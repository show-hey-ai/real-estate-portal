import { agentHandlers, archiveUnsafeListings } from './agents'
import { generateArticle, verifyArticle, rollbackArticle, seo } from './content-agents'
import { claimJob, enqueueJob, failJob, finishJob, scheduleJobs } from './store'
import { jobKinds, type JobKind } from './policy'

export async function runAutonomyTick(maxJobs = 5, localHandlers: Partial<Record<JobKind, (job: import('@prisma/client').AutonomyJob) => Promise<unknown>>> = {}) {
  const policy = await scheduleJobs()
  if (localHandlers.reins_intake) await (await import('../db')).prisma.autonomyPolicy.update({ where: { id: policy.id }, data: { lastSourceHeartbeatAt: new Date() } })
  if (!policy.enabled) return { state: 'paused', executed: [] }
  const started = Date.now()
  const executed: { id: string; kind: string; status: string }[] = []
  const handlers = { ...agentHandlers, generate_article: generateArticle, verify_article: verifyArticle, rollback_article: rollbackArticle, seo }
  for (let index = 0; index < Math.min(10, maxJobs) && Date.now() - started < 45_000; index++) {
    const job = await claimJob(new Date(), Boolean(localHandlers.reins_intake && localHandlers.maisoku_import))
    if (!job) break
    try {
      if (!jobKinds.includes(job.kind as JobKind)) throw new Error('Unregistered capability.')
      const handler = localHandlers[job.kind as JobKind] || handlers[job.kind as keyof typeof handlers]
      if (!handler) throw new Error('Worker capability is unavailable.')
      const result = await handler(job)
      if (job.kind === 'observe') await archiveUnsafeListings(job)
      const blocked = Boolean(result && typeof result === 'object' && 'blocked' in result && result.blocked === true)
      const owned = await finishJob(job, result, blocked ? 'blocked' : 'succeeded')
      executed.push({ id: job.id, kind: job.kind, status: owned ? blocked ? 'blocked' : 'succeeded' : 'lease_lost' })
    } catch {
      const status = await failJob(job)
      if (job.kind === 'verify_publication' && status === 'failed') await enqueueJob('rollback_publication', `rollback:${job.id}`, job.payload, 120)
      if (job.kind === 'verify_article' && status === 'failed') await enqueueJob('rollback_article', `rollback:${job.id}`, job.payload, 120)
      executed.push({ id: job.id, kind: job.kind, status })
    }
  }
  return { state: 'active', executed }
}
