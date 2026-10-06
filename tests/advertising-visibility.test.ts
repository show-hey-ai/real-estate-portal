import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'

test('browser roles can read approved full addresses but cannot read entrusted, consent-pending or draft inventory', async () => {
  const db = new PGlite()
  try {
    const projection = await readFile('prisma/migrations/20261002_public_listing_projection/migration.sql', 'utf8')
    const columns = projection.match(/GRANT SELECT \(([\s\S]*?)\) ON/)![1].split(',').map(field => `${field.trim()} ${field.trim() === '"adAllowed"' ? 'boolean' : field.trim() === '"viewCount"' ? 'integer' : 'text'}`).join(',')
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE TABLE listings (${columns}, "adConsentRequired" boolean NOT NULL DEFAULT false,
        "conditionsExpiry" timestamp, "autonomyValidUntil" timestamp, "addressPrivate" text, "sourcePdfUrl" text);
      ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
      INSERT INTO listings (id,status,"adAllowed","adConsentRequired","addressPublic","addressPrivate") VALUES
      ('allowed','PUBLISHED',true,false,'東京都台東区谷中3丁目2-2','INTERNAL-ONLY'),
      ('entrusted','PUBLISHED',false,false,'SECRET-ENTRUSTED','SECRET-ADDRESS'),
      ('pending','PUBLISHED',true,true,'SECRET-PENDING','SECRET-ADDRESS'),
      ('draft','DRAFT',true,false,'SECRET-DRAFT','SECRET-ADDRESS');`)
    await db.exec(projection)
    await db.exec(await readFile('prisma/migrations/20261004_advertising_visibility/migration.sql', 'utf8'))
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`SET ROLE ${role}`)
      assert.deepEqual((await db.query('SELECT id,"addressPublic" FROM listings')).rows, [{ id: 'allowed', addressPublic: '東京都台東区谷中3丁目2-2' }])
      await assert.rejects(db.query('SELECT "addressPrivate" FROM listings'))
      await assert.rejects(db.query('SELECT "sourcePdfUrl" FROM listings'))
      for (const id of ['entrusted', 'pending', 'draft']) {
        assert.equal((await db.query<{ visible: boolean }>('SELECT is_public_listing($1) AS visible', [id])).rows[0].visible, false)
      }
      await db.exec('RESET ROLE')
    }
    await db.exec(`UPDATE listings SET "autonomyValidUntil"='2020-01-01' WHERE id='allowed'; SET ROLE anon`)
    assert.equal((await db.query('SELECT id FROM listings')).rows.length, 0)
  } finally { await db.close() }
})
