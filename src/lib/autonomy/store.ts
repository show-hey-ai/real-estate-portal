import { randomUUID } from 'node:crypto'
import { Prisma, type AutonomyJob } from '@prisma/client'
import { prisma } from '../db'
import { AUTONOMY_VERSION, PORTAL_VENTURE_ID, defaultPolicy, retryTime, scheduleKey, tokyoMonthStart, type JobKind } from './policy'

export const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value))

export async function getPolicy() {
  return prisma.autonomyPolicy.upsert({
    where: { id: PORTAL_VENTURE_ID }, create: { id: PORTAL_VENTURE_ID, ...defaultPolicy }, update: {},
  })
}

export async function enqueueJob(kind: JobKind, key: string, payload: unknown = {}, priority = 0) {
  return prisma.autonomyJob.upsert({
    where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: key } },
    create: { ventureId: PORTAL_VENTURE_ID, kind, dedupeKey: key, payload: json(payload), priority }, update: {},
  })
}

export async function scheduleJobs(now = new Date()) {
  const policy = await getPolicy()
  await prisma.autonomyPolicy.update({ where: { id: policy.id }, data: { lastHeartbeatAt: now } })
  if (!policy.enabled) return policy
  for (const [kind, priority] of [['observe', 100], ['health', 90], ['strategy', 10]] as const) {
    await enqueueJob(kind, scheduleKey(kind, now, policy.intervalMinutes), {}, priority)
  }
  if (policy.allowReinsIntake) await enqueueJob('reins_intake', scheduleKey('reins_intake', now, policy.reinsIntervalHours * 60), {}, 40)
  if (policy.allowSeo) await enqueueJob('seo', scheduleKey('seo', now, 1440), {}, 30)
  if (policy.allowArticles) await enqueueJob('generate_article', scheduleKey('generate_article', now, 1440), {}, 25)
  const failedVerifications = await prisma.autonomyJob.findMany({ where: { ventureId: PORTAL_VENTURE_ID, kind: 'verify_publication', status: 'failed' }, take: 100 })
  for (const job of failedVerifications) await enqueueJob('rollback_publication', `rollback:${job.id}`, job.payload, 120)
  const failedArticles = await prisma.autonomyJob.findMany({ where: { ventureId: PORTAL_VENTURE_ID, kind: 'verify_article', status: 'failed' }, take: 100 })
  for (const job of failedArticles) await enqueueJob('rollback_article', `rollback:${job.id}`, job.payload, 120)
  return policy
}

export async function claimJob(now = new Date(), canReins = false) {
  const jobs = await prisma.$queryRaw<AutonomyJob[]>`
    SELECT * FROM public.claim_portal_autonomy_job(${PORTAL_VENTURE_ID}, ${now}::timestamp, ${randomUUID()}, ${Boolean(process.env.OPENAI_API_KEY)}, ${canReins})
  `
  return jobs[0] || null
}

export async function writeRecord(job: AutonomyJob, type: string, title: string, content: unknown, sources: unknown, verification: 'verified' | 'unverified' = 'unverified') {
  return prisma.autonomyRecord.upsert({
    where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `${job.id}:${job.leaseToken}:${type}` } },
    create: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `${job.id}:${job.leaseToken}:${type}`, recordType: type, title, content: json(content), sources: json(sources), verification, version: AUTONOMY_VERSION },
    update: {},
  })
}

export async function finishJob(job: AutonomyJob, result: unknown, outcome: 'succeeded' | 'blocked' = 'succeeded') {
  return prisma.$transaction(async (tx) => {
    const changed = await tx.autonomyJob.updateMany({
      where: { id: job.id, ventureId: PORTAL_VENTURE_ID, status: 'running', leaseToken: job.leaseToken },
      data: { status: outcome, result: json(result), leaseToken: null, leaseExpiresAt: null },
    })
    if (changed.count) await tx.autonomyRun.update({ where: { leaseToken: job.leaseToken! }, data: { outcome, finishedAt: new Date() } })
    return changed.count === 1
  })
}

export async function failJob(job: AutonomyJob) {
  const policy = await getPolicy()
  const run = await prisma.autonomyRun.findUniqueOrThrow({ where: { leaseToken: job.leaseToken! } })
  // Provider errors and timeouts can still be chargeable. Keep their reservation.
  const paid = run.reservedCostYen > 0
  const status = paid ? 'needs_reconciliation' : job.attempts >= policy.maxAttempts ? 'failed' : 'pending'
  await prisma.$transaction(async (tx) => {
    const changed = await tx.autonomyJob.updateMany({
      where: { id: job.id, ventureId: PORTAL_VENTURE_ID, status: 'running', leaseToken: job.leaseToken },
      data: { status, availableAt: retryTime(new Date(), job.attempts), leaseToken: null, leaseExpiresAt: null,
        lastError: paid ? 'Paid-call result requires reconciliation; no duplicate request was made.' : 'Execution failed. Automatic retry is bounded by the operating policy.' },
    })
    if (changed.count) await tx.autonomyRun.update({ where: { leaseToken: job.leaseToken! }, data: { outcome: status, finishedAt: new Date() } })
  })
  return status
}

export async function costSummary(now = new Date()) {
  const runs = await prisma.autonomyRun.findMany({
    where: { job: { ventureId: PORTAL_VENTURE_ID }, OR: [{ startedAt: { gte: tokyoMonthStart(now) } }, { actualCostYen: null, outcome: { in: ['running', 'needs_reconciliation'] } }] },
    select: { reservedCostYen: true, actualCostYen: true },
  })
  return {
    recordedActualYen: runs.reduce((sum, run) => sum + (run.actualCostYen ?? 0), 0),
    unresolvedReservedYen: runs.reduce((sum, run) => sum + (run.actualCostYen === null ? run.reservedCostYen : 0), 0),
  }
}
