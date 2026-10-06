import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { policySchema, PORTAL_VENTURE_ID, AUTONOMY_VERSION } from '@/lib/autonomy/policy'
import { costSummary, getPolicy, json } from '@/lib/autonomy/store'
import { runAutonomyTick } from '@/lib/autonomy/runner'

export const runtime = 'nodejs'
export const maxDuration = 120
export const dynamic = 'force-dynamic'

const commandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('configure'), policy: policySchema }).strict(),
  z.object({ action: z.literal('tick') }).strict(),
  z.object({ action: z.literal('settle_cost'), runId: z.string().min(1).max(100), actualCostYen: z.number().int().min(0).max(1_000_000), billingReference: z.string().trim().min(3).max(200) }).strict(),
])

export async function GET() {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response
    const [policy, costs, jobs, records, runs] = await Promise.all([
      getPolicy(), costSummary(),
      prisma.autonomyJob.findMany({ where: { ventureId: PORTAL_VENTURE_ID }, orderBy: { updatedAt: 'desc' }, take: 30, select: { id: true, kind: true, status: true, attempts: true, availableAt: true, lastError: true, updatedAt: true, result: true } }),
      prisma.autonomyRecord.findMany({ where: { ventureId: PORTAL_VENTURE_ID }, orderBy: { createdAt: 'desc' }, take: 30 }),
      prisma.autonomyRun.findMany({ where: { job: { ventureId: PORTAL_VENTURE_ID }, reservedCostYen: { gt: 0 } }, orderBy: { startedAt: 'desc' }, take: 20, select: { id: true, outcome: true, reservedCostYen: true, actualCostYen: true, providerReceipt: true, inputTokens: true, outputTokens: true, startedAt: true, finishedAt: true } }),
    ])
    return NextResponse.json({ policy, costs, jobs, records, runs, connections: { scheduler: Boolean(process.env.AUTONOMY_CRON_SECRET && process.env.AUTONOMY_CRON_SECRET.length >= 32), ai: Boolean(process.env.OPENAI_API_KEY) } })
  } catch { return NextResponse.json({ error: 'Runtime data is unavailable. Install the autonomy migration and verify the database connection.' }, { status: 503 }) }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (!origin || origin !== request.nextUrl.origin) return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  const parsed = commandSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid autonomy command' }, { status: 400 })
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response
    const input = parsed.data
    if (input.action === 'tick') return NextResponse.json(await runAutonomyTick())
    if (input.action === 'configure') {
      await getPolicy()
      await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
        await tx.autonomyPolicy.update({ where: { id: PORTAL_VENTURE_ID }, data: input.policy })
        // Reconsider policy/budget waits. Failed source checks stay blocked until source data is replaced.
        await tx.autonomyJob.updateMany({ where: { ventureId: PORTAL_VENTURE_ID, status: 'blocked', lastError: { not: null } }, data: { status: 'pending', lastError: null, availableAt: new Date() } })
        await tx.autonomyRecord.create({ data: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `configuration:${crypto.randomUUID()}`, recordType: 'configuration', title: 'Operating policy updated', content: json({ policy: input.policy, actorId: auth.user.id }), sources: json(['admin_configuration']), verification: 'verified', version: AUTONOMY_VERSION } })
      })
      return NextResponse.json({ saved: true })
    }
    const existing = await prisma.autonomyRun.findFirst({ where: { id: input.runId, job: { ventureId: PORTAL_VENTURE_ID } } })
    if (!existing || existing.outcome === 'running') return NextResponse.json({ error: 'A completed run is required.' }, { status: 409 })
    if (existing.actualCostYen !== null) return NextResponse.json({ error: 'This cost was already reconciled.' }, { status: 409 })
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
      const changed = await tx.autonomyRun.updateMany({ where: { id: input.runId, actualCostYen: null }, data: { actualCostYen: input.actualCostYen } })
      if (changed.count !== 1) throw new Error('Cost already reconciled.')
      await tx.autonomyRecord.create({ data: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `cost:${input.runId}`, recordType: 'cost', title: 'Actual cost recorded from billing reference', content: json({ runId: input.runId, actualCostYen: input.actualCostYen, billingReference: input.billingReference, recordedBy: auth.user.id }), sources: json([input.billingReference]), verification: 'unverified', version: AUTONOMY_VERSION } })
    })
    return NextResponse.json({ saved: true })
  } catch { return NextResponse.json({ error: 'The autonomy command could not be completed. Runtime records are retained.' }, { status: 503 }) }
}
