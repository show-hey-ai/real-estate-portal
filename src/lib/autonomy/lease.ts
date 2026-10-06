import { type AutonomyJob, type AutonomyPolicy, type Prisma } from '@prisma/client'
import { prisma } from '../db'
import { PORTAL_VENTURE_ID } from './policy'

/** Serialize each side effect with stop/configuration and lease reclamation. */
export async function withLiveLease<T>(job: AutonomyJob, action: (tx: Prisma.TransactionClient, policy: AutonomyPolicy) => Promise<T>, timeout = 5000): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
    const policy = await tx.autonomyPolicy.findUniqueOrThrow({ where: { id: PORTAL_VENTURE_ID } })
    const owned = job.leaseToken && await tx.autonomyJob.findFirst({ where: { id: job.id, ventureId: PORTAL_VENTURE_ID, status: 'running', leaseToken: job.leaseToken, leaseExpiresAt: { gt: new Date() } } })
    if (!policy.enabled || !owned) throw new Error('Operating policy or lease changed.')
    return action(tx, policy)
  }, { timeout, maxWait: 5000 })
}
