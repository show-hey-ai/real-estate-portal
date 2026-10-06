import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

const migration = readFile(resolve(process.cwd(), 'prisma/migrations/20261002_portal_autonomy/migration.sql'), 'utf8')
async function database() {
  const db = new PGlite()
  await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;')
  await db.exec('CREATE TABLE listings (id text PRIMARY KEY);')
  await db.exec(await migration)
  return db
}
async function addJob(db: PGlite, id: string, kind = 'observe', venture = 'ziyou-portal') {
  await db.query(`INSERT INTO autonomy_jobs (id, "ventureId", kind, "dedupeKey", payload, "updatedAt", "createdAt", "availableAt") VALUES ($1,$2,$3,$1,'{}','2026-10-01','2026-10-01','2026-10-01')`, [id, venture, kind])
}
async function claim(db: PGlite, lease: string, now = '2026-10-02 00:00:00') {
  return (await db.query<{ id: string; attempts: number; leaseToken: string }>('SELECT * FROM claim_portal_autonomy_job($1,$2::timestamp,$3,true)', ['ziyou-portal', now, lease])).rows
}

test('database enforces private state, operating limits and idempotent job keys', async () => {
  const db = await database()
  try {
    await addJob(db, 'job-1')
    assert.deepEqual(await claim(db, 'paused-lease'), [])
    await assert.rejects(db.query(`UPDATE autonomy_policies SET "maxAttempts"=999`))
    await assert.rejects(db.query(`INSERT INTO autonomy_jobs (id,"ventureId",kind,"dedupeKey",payload,"updatedAt") VALUES ('other','ziyou-portal','observe','job-1','{}',now())`))
    await db.exec('SET ROLE anon;')
    await assert.rejects(db.query('SELECT * FROM autonomy_jobs'))
    await assert.rejects(db.query(`SELECT * FROM claim_portal_autonomy_job('ziyou-portal',now()::timestamp,'bad',true)`))
  } finally { await db.close() }
})

test('two workers cannot claim the same live job, and an interrupted free job resumes with a new lease', async () => {
  const db = await database()
  try {
    await db.exec('UPDATE autonomy_policies SET enabled=true')
    await addJob(db, 'job-1')
    const results = await Promise.all([claim(db, 'worker-a'), claim(db, 'worker-b')])
    assert.equal(results.flat().length, 1)
    assert.equal((await claim(db, 'resumed', '2026-10-02 00:06:00'))[0].attempts, 2)
    const old = (await db.query<{ outcome: string }>('SELECT outcome FROM autonomy_runs WHERE id=$1', [results.flat()[0].leaseToken])).rows[0]
    assert.equal(old.outcome, 'interrupted')
  } finally { await db.close() }
})

test('budget reservation is atomic, includes unsettled older calls, and allows independent free work', async () => {
  const db = await database()
  try {
    await db.exec('UPDATE autonomy_policies SET enabled=true,"allowAiStrategy"=true,"monthlyBudgetYen"=100,"aiCallReserveYen"=100')
    await addJob(db, 'paid-1', 'strategy')
    await addJob(db, 'paid-2', 'strategy')
    const results = await Promise.all([claim(db, 'lease-1'), claim(db, 'lease-2')])
    assert.equal(results.flat().length, 1)
    await addJob(db, 'free', 'observe')
    assert.equal((await claim(db, 'free-lease'))[0].id, 'free')
    await db.exec(`UPDATE autonomy_jobs SET status='succeeded' WHERE id='free'; UPDATE autonomy_runs SET outcome='succeeded' WHERE id='free-lease';`)
    assert.deepEqual(await claim(db, 'lost-lease', '2026-11-01 00:00:00'), [])
    const lost = (await db.query<{ status: string }>('SELECT status FROM autonomy_jobs WHERE id=$1', [results.flat()[0].id])).rows[0]
    assert.equal(lost.status, 'needs_reconciliation')
    const expiredRun = (await db.query<{ outcome: string; finishedAt: string }>('SELECT outcome,"finishedAt" FROM autonomy_runs WHERE id=$1', [results.flat()[0].leaseToken])).rows[0]
    assert.equal(expiredRun.outcome, 'needs_reconciliation')
    assert.ok(expiredRun.finishedAt)
    await addJob(db, 'new-month-paid', 'strategy')
    assert.deepEqual(await claim(db, 'new-month-lease', '2026-11-01 00:00:00'), [])
  } finally { await db.close() }
})

test('web workers leave REINS jobs for a capable source worker and each PDF reserves a budget slot', async () => {
  const db = await database()
  try {
    await db.exec('UPDATE autonomy_policies SET enabled=true,"allowReinsIntake"=true,"monthlyBudgetYen"=1000')
    await addJob(db, 'download', 'reins_intake')
    await addJob(db, 'import', 'maisoku_import')
    await addJob(db, 'health', 'health')
    assert.equal((await claim(db, 'web'))[0].id, 'health')
    const local = (await db.query<{ id: string }>(`SELECT * FROM claim_portal_autonomy_job('ziyou-portal','2026-10-02'::timestamp,'local',true,true)`)).rows[0]
    assert.equal(local.id, 'download')
    const imported = (await db.query<{ id: string }>(`SELECT * FROM claim_portal_autonomy_job('ziyou-portal','2026-10-02'::timestamp,'importer',true,true)`)).rows[0]
    assert.equal(imported.id, 'import')
    assert.equal((await db.query<{ reservedCostYen: number }>(`SELECT "reservedCostYen" FROM autonomy_runs WHERE id='importer'`)).rows[0].reservedCostYen, 1000)
  } finally { await db.close() }
})

test('completed paid receipts charge their own month; unknown results retain their hold across months', async () => {
  const db = await database()
  try {
    await db.exec('UPDATE autonomy_policies SET enabled=true,"allowAiStrategy"=true,"monthlyBudgetYen"=100,"aiCallReserveYen"=100')
    await addJob(db, 'paid', 'strategy')
    await claim(db, 'known')
    await db.exec(`UPDATE autonomy_jobs SET status='succeeded' WHERE id='paid'; UPDATE autonomy_runs SET outcome='succeeded',"providerReceipt"='receipt',"finishedAt"='2026-10-02' WHERE id='known'`)
    await addJob(db, 'next-month', 'strategy')
    assert.equal((await claim(db, 'new', '2026-11-01 00:00:00'))[0].id, 'next-month')
  } finally { await db.close() }
})

test('public column privileges hide addresses and source URLs even with a valid browser session', async () => {
  const db = new PGlite()
  try {
    const projection = await readFile(resolve('prisma/migrations/20261002_public_listing_projection/migration.sql'), 'utf8')
    const columns = projection.match(/GRANT SELECT \(([\s\S]*?)\) ON/)![1].split(',').map((field) => `${field.trim()} ${field.trim() === '"adAllowed"' ? 'boolean' : field.trim() === '"viewCount"' ? 'integer' : 'text'}`).join(',')
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE TABLE listings (${columns}, "conditionsExpiry" timestamp, "autonomyValidUntil" timestamp, "addressPrivate" text, "sourcePdfUrl" text, "adminNotes" text); GRANT SELECT ON listings TO anon, authenticated; INSERT INTO listings (id,"addressPublic","addressPrivate",status,"adAllowed") VALUES ('public','Tokyo','Private house','PUBLISHED',true);`)
    await db.exec(projection)
    await db.exec('ALTER TABLE listings ENABLE ROW LEVEL SECURITY')
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`)
      assert.equal((await db.query<{ id: string }>('SELECT id,"addressPublic" FROM listings')).rows[0].id, 'public')
      await assert.rejects(db.query('SELECT "addressPrivate" FROM listings'))
      await assert.rejects(db.query('SELECT "sourcePdfUrl" FROM listings'))
      await db.exec('RESET ROLE')
    }
    await db.exec(`UPDATE listings SET "autonomyValidUntil"='2020-01-01'; SET ROLE anon`)
    assert.equal((await db.query('SELECT id FROM listings')).rows.length, 0)
  } finally { await db.close() }
})

test('publication permission and venture boundaries are enforced before a lease is issued', async () => {
  const db = await database()
  try {
    await db.exec(`UPDATE autonomy_policies SET enabled=true;
      INSERT INTO autonomy_policies (id,objective,enabled,"updatedAt") VALUES ('other-venture','Other objective',true,now());`)
    await addJob(db, 'other', 'observe', 'other-venture')
    await addJob(db, 'publish', 'publication_audit')
    await addJob(db, 'own', 'observe')
    assert.equal((await claim(db, 'own-lease'))[0].id, 'own')
    assert.deepEqual(await claim(db, 'blocked-lease'), [])
    assert.equal((await db.query<{ status: string }>(`SELECT status FROM autonomy_jobs WHERE id='publish'`)).rows[0].status, 'blocked')
    assert.equal((await db.query<{ status: string }>(`SELECT status FROM autonomy_jobs WHERE id='other'`)).rows[0].status, 'pending')
  } finally { await db.close() }
})
