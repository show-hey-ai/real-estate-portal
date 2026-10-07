import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, open, readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { type AutonomyJob, type Prisma } from '@prisma/client'
import { PDFDocument } from 'pdf-lib'
import { z } from 'zod'
import { prisma } from '../db'
import { PORTAL_VENTURE_ID } from './policy'
import { withLiveLease } from './lease'
import { json, writeRecord } from './store'
import { buyerSourceTarget, buyerSourceCurrent, finishBuyerSource } from '../buyer-matching-server'

const sourceDir = () => resolve(process.env.AUTONOMY_SOURCE_DIR || join(process.cwd(), '.autonomy-sources'))
const sourceSchema = z.object({ hash: z.string().regex(/^[a-f0-9]{64}$/) }).strict()

export async function runSourceCommand(job: AutonomyJob, script: 'reins-download.ts' | 'process-openai-vision.ts', args: string[], extraEnv: Partial<NodeJS.ProcessEnv>, sourceGuard?: () => Promise<boolean>) {
  await withLiveLease(job, async (_tx, policy) => {
    if (!policy.allowReinsIntake) throw new Error('Source intake is disabled.')
  })
  await mkdir(sourceDir(), { recursive: true, mode: 0o700 })
  const logName = `run-${createHash('sha256').update(`${job.id}:${job.leaseToken}`).digest('hex')}.log`
  const logFile = await open(join(sourceDir(), logName), 'a', 0o600)
  try {
    await logFile.chmod(0o600)
    await new Promise<void>((done, reject) => {
      const child = spawn(process.execPath, [resolve('node_modules/tsx/dist/cli.mjs'), resolve('scripts', script), ...args], { cwd: process.cwd(), env: { ...process.env, ...extraEnv }, stdio: ['ignore', logFile.fd, logFile.fd], detached: true })
      let stopping = false
      let forceKill: ReturnType<typeof setTimeout> | undefined
      const stop = () => {
        if (stopping) return
        stopping = true
        if (child.pid) { try { process.kill(-child.pid, 'SIGTERM') } catch { /* Already stopped. */ } }
        forceKill = setTimeout(() => { if (child.pid) { try { process.kill(-child.pid, 'SIGKILL') } catch { /* Already stopped. */ } } }, 5000)
      }
      const deadline = setTimeout(stop, 15 * 60_000)
      const monitor = setInterval(() => {
        void Promise.all([
          prisma.autonomyPolicy.findUnique({ where: { id: PORTAL_VENTURE_ID }, select: { enabled: true, allowReinsIntake: true } }),
          prisma.autonomyJob.findFirst({ where: { id: job.id, status: 'running', leaseToken: job.leaseToken, leaseExpiresAt: { gt: new Date() } }, select: { id: true } }),
          sourceGuard ? sourceGuard() : Promise.resolve(true),
        ]).then(([policy, owned, sourceCurrent]) => { if (!policy?.enabled || !policy.allowReinsIntake || !owned || !sourceCurrent) stop() }).catch(stop)
      }, 5000)
      process.once('SIGTERM', stop)
      process.once('SIGINT', stop)
      const finish = (error?: Error) => {
        // The parent can exit on SIGTERM while a descendant still ignores it.
        if (stopping && child.pid) { try { process.kill(-child.pid, 'SIGKILL') } catch { /* The group is already gone. */ } }
        clearInterval(monitor); clearTimeout(deadline); clearTimeout(forceKill)
        process.off('SIGTERM', stop); process.off('SIGINT', stop)
        if (error) reject(error); else done()
      }
      child.once('error', () => finish(new Error('Source command could not start.')))
      child.once('exit', (code) => finish(code === 0 && !stopping ? undefined : new Error('Source command failed or was stopped.')))
    })
  } finally { await logFile.close() }
}

export async function reinsIntake(job: AutonomyJob) {
  // Scheduled intake jobs have an empty payload. Desktop scripts claim reins_intake jobs with a
  // payload for their own work; if one stops mid-way the worker may reclaim it, and must not
  // start a REINS download in its place.
  const payload = job.payload as Record<string, unknown> | null
  if (payload && typeof payload === 'object' && Object.keys(payload).length) return { blocked: true, reason: 'A desktop script job stopped before finishing; rerun the script instead.' }
  if (!(process.env.REINS_LOGIN_ID || process.env.REINS_USER_ID) || !(process.env.REINS_LOGIN_PW || process.env.REINS_PASSWORD)) return { blocked: true, reason: 'REINS connection is not configured on the source worker.' }
  const batchDir = join(sourceDir(), `batch-${job.id}`)
  await mkdir(batchDir, { recursive: true, mode: 0o700 })
  const browserArgs = process.env.REINS_HEADLESS === 'false' ? ['--background'] : ['--headless']
  const target = await buyerSourceTarget(job)
  try {
  if (target && !await buyerSourceCurrent(target)) throw new Error('Buyer criteria changed before source search.')
  await runSourceCommand(job, 'reins-download.ts', [...browserArgs, '--max-pages=1', '--dir', batchDir], {...(target?.plan.env || {}),REINS_BUYER_STRICT:target?'true':'false'}, target ? () => buyerSourceCurrent(target) : undefined)
  const files = (await readdir(batchDir)).filter((name) => name.toLowerCase().endsWith('.pdf')).sort()
  if (!files.length) throw new Error('REINS command finished without a downloaded PDF.')
  let pages = 0
  for (const file of files) {
    const source = await PDFDocument.load(await readFile(join(batchDir, file)))
    for (let index = 0; index < Math.min(source.getPageCount(), 100) && pages < 50; index++) {
      const single = await PDFDocument.create()
      single.setCreationDate(new Date('2000-01-01T00:00:00Z'))
      single.setModificationDate(new Date('2000-01-01T00:00:00Z'))
      const [page] = await single.copyPages(source, [index])
      single.addPage(page)
      const bytes = Buffer.from(await single.save())
      const hash = createHash('sha256').update(bytes).digest('hex')
      await writeFile(join(sourceDir(), `${hash}.pdf`), bytes, { mode: 0o600 })
      await withLiveLease(job, (tx, policy) => {
        if (!policy.allowReinsIntake) throw new Error('Source intake is disabled.')
        const key = `source:${hash}:${new Date().toISOString().slice(0, 10)}`
        return tx.autonomyJob.upsert({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: key } }, create: { ventureId: PORTAL_VENTURE_ID, kind: 'maisoku_import', dedupeKey: key, payload: json({ hash }), priority: 20 }, update: {} })
      })
      pages++
    }
  }
  await writeRecord(job, 'intake', 'REINS PDFs downloaded and fingerprinted source jobs queued', { downloadedFiles: files.length, pages }, ['REINS', job.id], 'verified')
  if (target) await finishBuyerSource(job, target, true)
  return { downloadedFiles: files.length, pages }
  } catch (error) {
    if (target) await finishBuyerSource(job, target, false).catch(() => undefined)
    throw error
  }
}

export async function maisokuImport(job: AutonomyJob) {
  const { hash } = sourceSchema.parse(job.payload)
  const path = join(sourceDir(), `${hash}.pdf`)
  if (createHash('sha256').update(await readFile(path)).digest('hex') !== hash) throw new Error('Source file changed after queueing.')
  const since = new Date()
  await runSourceCommand(job, 'process-openai-vision.ts', [path, '--max-pdf-pages=1', '--ai-provider=openai'], {
    AUTONOMY_JOB_ID: job.id, AUTONOMY_LEASE_TOKEN: job.leaseToken!,
    AUTONOMY_SOURCE_HASH: hash,
    MAISOKU_AI_PROVIDER: 'openai', MAISOKU_CODEX_ON_QUOTA: 'false',
    MAISOKU_OCR_MODEL: 'gpt-4.1-mini', MAISOKU_EXTRACT_MODEL: 'gpt-4.1-mini', MAISOKU_TRANSLATE_MODEL: 'gpt-4.1-mini', OPENAI_VISION_MODEL: 'gpt-4.1-mini',
    MAISOKU_AD_MODEL: 'gpt-4.1-mini',
    JEV_API_KEY: '',
  })
  const audits = await prisma.autonomyJob.findMany({ where: { ventureId: PORTAL_VENTURE_ID, kind: 'publication_audit', createdAt: { gte: since }, dedupeKey: { contains: hash } }, select: { id: true } })
  const run = await prisma.autonomyRun.findUniqueOrThrow({ where: { leaseToken: job.leaseToken! } })
  if (run.pendingProviderRequests > 0) throw new Error('A dispatched provider request has an unknown result.')
  if (!run.providerReceipt) await withLiveLease(job, (tx) => tx.autonomyRun.update({ where: { id: run.id }, data: { actualCostYen: 0 } }))
  await writeRecord(job, 'intake', 'Source analysis finished; publication decisions remain separate', { sourceHash: hash, queuedAudits: audits.map((audit) => audit.id), providerReceipt: run.providerReceipt }, [hash], 'verified')
  return { sourceHash: hash, queuedAudits: audits.length, ...(audits.length ? {} : { blocked: true, reason: 'The source produced no eligible new publication candidate.' }) }
}

export async function revokeSourcePermission(sourceId: string) {
  const job = await prisma.autonomyJob.findFirstOrThrow({ where: { id: process.env.AUTONOMY_JOB_ID, ventureId: PORTAL_VENTURE_ID, leaseToken: process.env.AUTONOMY_LEASE_TOKEN } })
  const changed = await withLiveLease(job, async (tx, policy) => {
    if (!policy.allowReinsIntake) throw new Error('Source intake is disabled.')
    return tx.listing.updateMany({ where: { sourcePropertyId: sourceId, autonomyValidUntil: { not: null } }, data: { adAllowed: false, status: 'ARCHIVED', autonomyValidUntil: new Date() } })
  })
  await writeRecord(job, 'maintenance', 'Fresh source advertising denial revoked an automatic listing', { sourceId, changed: changed.count }, [process.env.AUTONOMY_SOURCE_HASH || 'source'], 'verified')
}

export async function renewAutomaticSourceListing(id: string, updatedAt: string, values: Record<string, unknown>) {
  const job = await prisma.autonomyJob.findFirstOrThrow({ where: { id: process.env.AUTONOMY_JOB_ID, ventureId: PORTAL_VENTURE_ID, leaseToken: process.env.AUTONOMY_LEASE_TOKEN } })
  return withLiveLease(job, async (tx, policy) => {
    if (!policy.allowReinsIntake) throw new Error('Source intake is disabled.')
    const data = { ...values, price: BigInt(Number(values.price)) } as Prisma.ListingUpdateManyMutationInput
    const changed = await tx.listing.updateMany({ where: { id, updatedAt: new Date(updatedAt), autonomyValidUntil: { not: null } }, data })
    return changed.count ? tx.listing.findUnique({ where: { id } }) : null
  })
}
