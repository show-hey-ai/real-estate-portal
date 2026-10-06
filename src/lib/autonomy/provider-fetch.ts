import { withLiveLease } from './lease'
import { prisma } from '../db'
import { PORTAL_VENTURE_ID, AUTONOMY_VERSION } from './policy'
import { json } from './store'

let calls = 0
/** Used only by a source-import child. Bound requests, fence every dispatch, retain usage. */
export async function guardedProviderFetch(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) {
  if (++calls > 8) throw new Error('Source import provider-call limit reached.')
  const job = await prisma.autonomyJob.findFirstOrThrow({ where: { id: process.env.AUTONOMY_JOB_ID, ventureId: PORTAL_VENTURE_ID, leaseToken: process.env.AUTONOMY_LEASE_TOKEN } })
  // Commit before dispatch. A timeout, crash or rejected transaction cannot erase ambiguity.
  await withLiveLease(job, async (tx, policy) => {
    if (!policy.allowReinsIntake) throw new Error('Source intake was stopped.')
    await tx.autonomyRun.update({ where: { leaseToken: job.leaseToken! }, data: { pendingProviderRequests: { increment: 1 } } })
  })
  return withLiveLease(job, async (tx, policy) => {
    if (!policy.allowReinsIntake) throw new Error('Source intake was stopped.')
    const response = await fetch(input, { ...init, signal: AbortSignal.timeout(60_000) })
    const body = await response.clone().json().catch(() => null)
    if (body?.id && body?.usage) {
      const run = await tx.autonomyRun.findUniqueOrThrow({ where: { leaseToken: job.leaseToken! } })
      await tx.autonomyRun.update({ where: { id: run.id }, data: { providerReceipt: body.id, pendingProviderRequests: { decrement: 1 }, inputTokens: (run.inputTokens || 0) + (body.usage.prompt_tokens || 0), outputTokens: (run.outputTokens || 0) + (body.usage.completion_tokens || 0) } })
      await tx.autonomyRecord.create({ data: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `provider:${body.id}`, recordType: 'provider_usage', title: 'Source import provider receipt', content: json({ requestId: body.id, model: body.model, usage: body.usage }), sources: json([body.id]), verification: 'verified', version: AUTONOMY_VERSION } })
    }
    return response
  }, 70_000)
}
