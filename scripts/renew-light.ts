/**
 * Daily light re-check of automatically published listings (0 yen, no PDF re-read).
 *
 *   set -a; source "<autonomy dir>/runtime.env"; set +a
 *   npx tsx scripts/renew-light.ts --dir <folder of REINS detail pages saved today> [--missing <REINS no.>,…] [--save]
 *
 * For each published listing with a detail page saved in the last 6 hours, an unchanged price,
 * sales status, advertising field and REINS change date keep the listing visible for another
 * 24 hours, up to 7 days after its last full check (src/lib/autonomy/light-renewal.ts). A changed
 * listing is left to expire unless it gets a full check; a purchase application, a pause, or a
 * REINS number listed with --missing hides the listing now. Without --save nothing is written.
 */
import { createHash, randomUUID } from 'node:crypto'
import { chmodSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { AutonomyJob, Listing } from '@prisma/client'
import { config } from 'dotenv'
import { dealStatusBlocks, parseReinsDetail, type ReinsDetail } from '../src/lib/reins-detail'
import { LIGHT_CHECK_MAX_AGE_MS, baselineFromReceipt, lightRenewalDecision, type LightRenewalDecision } from '../src/lib/autonomy/light-renewal'

config({ path: resolve(process.cwd(), '.env'), quiet: true })

interface SavedDetail { file: string; checkedAt: Date; detail: ReinsDetail }
interface Planned { listing: Listing; decision: LightRenewalDecision; file: string | null }

const tokyoTime = (date: Date) => new Date(date.getTime() + 9 * 3600_000).toISOString().replace('T', ' ').slice(0, 16)

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index > 0 ? process.argv[index + 1] : undefined
}

/**
 * Per REINS number: a recent page showing a purchase application or pause wins; otherwise the
 * newest page that has every field the light check reads.
 */
function savedDetails(dir: string): Map<string, SavedDetail> {
  const recent = (date: Date) => Date.now() - date.getTime() <= LIGHT_CHECK_MAX_AGE_MS
  const result = new Map<string, SavedDetail>()
  for (const file of readdirSync(dir).filter((name) => name.endsWith('.txt'))) {
    const path = resolve(dir, file)
    const detail = parseReinsDetail(readFileSync(path, 'utf8'))
    if (!detail.sourcePropertyId) continue
    const checkedAt = statSync(path).mtime
    const complete = (item: ReinsDetail) => item.price !== null && item.adField !== null && item.changedOn !== null
    const previous = result.get(detail.sourcePropertyId)
    const blocks = (item: SavedDetail | { detail: ReinsDetail; checkedAt: Date }) => recent(item.checkedAt) && dealStatusBlocks(item.detail.dealStatus)
    if (previous && blocks(previous) && !blocks({ detail, checkedAt })) continue
    const better = !previous
      || (blocks({ detail, checkedAt }) && !blocks(previous))
      || (complete(detail) && !complete(previous.detail))
      || (complete(detail) === complete(previous.detail) && checkedAt > previous.checkedAt)
    if (better) result.set(detail.sourcePropertyId, { file, checkedAt, detail })
  }
  return result
}

function describe(decision: LightRenewalDecision): string {
  if (decision.action === 'extend') return `延長 → ${tokyoTime(decision.validUntil)} JSTまで`
  const label = { full_check: '全面確認が必要', withdraw: '今すぐ非表示', skip: '対象外' }[decision.action]
  return `${label}：${decision.reasons.join(' / ')}`
}

async function main() {
  const dirArgument = argumentValue('--dir')
  if (!dirArgument) {
    console.error('Usage: npx tsx scripts/renew-light.ts --dir <folder> [--missing <id,id>] [--save]')
    process.exitCode = 2
    return
  }
  const dir = resolve(dirArgument)
  const save = process.argv.includes('--save')
  const missing = new Set((argumentValue('--missing') ?? '').split(',').map((id) => id.trim()).filter((id) => /^\d{12}$/.test(id)))
  const details = savedDetails(dir)

  const { prisma } = await import('../src/lib/db')
  const { listingFactsHash } = await import('../src/lib/autonomy/publication')
  const { PORTAL_VENTURE_ID } = await import('../src/lib/autonomy/policy')
  const { withLiveLease } = await import('../src/lib/autonomy/lease')
  const { finishJob, json, writeRecord } = await import('../src/lib/autonomy/store')
  try {
    const now = new Date()
    const listings = await prisma.listing.findMany({ where: { status: 'PUBLISHED', autonomyValidUntil: { not: null }, sourcePropertyId: { not: null } }, orderBy: { autonomyValidUntil: 'asc' } })
    const planned: Planned[] = []
    for (const listing of listings) {
      const id = listing.sourcePropertyId!
      if (missing.has(id)) {
        planned.push({ listing, decision: { action: 'withdraw', reasons: ['Not found on REINS (listed with --missing).'] }, file: null })
        continue
      }
      const saved = details.get(id)
      if (!saved) {
        planned.push({ listing, decision: { action: 'skip', reasons: ['No REINS detail page saved today; it expires on schedule.'] }, file: null })
        continue
      }
      const audit = await prisma.autonomyJob.findFirst({
        where: { ventureId: PORTAL_VENTURE_ID, kind: 'publication_audit', status: 'succeeded', payload: { path: ['listingId'], equals: listing.id } },
        orderBy: { updatedAt: 'desc' },
      })
      const receipt = (audit?.payload as { receipt?: Parameters<typeof baselineFromReceipt>[0] } | null)?.receipt
      const baseline = receipt ? baselineFromReceipt(receipt, listingFactsHash(listing as unknown as Record<string, unknown>)) : null
      const decision = lightRenewalDecision({
        listing: { status: listing.status, sourcePropertyId: id, price: Number(listing.price), autonomyValidUntil: listing.autonomyValidUntil },
        baseline, detail: saved.detail, checkedAt: saved.checkedAt, now,
      })
      planned.push({ listing, decision, file: saved.file })
    }

    for (const { listing, decision, file } of planned) {
      console.log(`${listing.sourcePropertyId}  ${listing.city ?? ''}  現在の期限 ${tokyoTime(listing.autonomyValidUntil!)}  ${describe(decision)}${file ? `  (${file})` : ''}`)
    }
    const changes = planned.filter(({ decision }) => decision.action === 'extend' || decision.action === 'withdraw')
    const summary = Object.fromEntries(['extend', 'full_check', 'withdraw', 'skip'].map((action) => [action, planned.filter(({ decision }) => decision.action === action).length]))
    console.log(JSON.stringify({ mode: save ? 'save' : 'dry-run', ...summary }))
    if (!save || !changes.length) return

    const inputHash = createHash('sha256').update(JSON.stringify(changes.map(({ listing, decision, file }) => [listing.id, decision, file]))).digest('hex')
    const dedupeKey = `light-renewal:${tokyoTime(now).slice(0, 10)}:${inputHash}`
    const job = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
      const queued = await tx.autonomyJob.upsert({
        where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey } },
        create: { ventureId: PORTAL_VENTURE_ID, kind: 'reins_intake', priority: 1000, dedupeKey, payload: json({ lightRenewal: true, dir, files: changes.map(({ file }) => file) }) },
        update: {},
      })
      if (queued.status === 'succeeded') throw new Error('This light check was already applied.')
      if (queued.status === 'running' && queued.leaseExpiresAt && queued.leaseExpiresAt > new Date()) throw new Error('Another light renewal is running.')
      if (queued.status !== 'pending') await tx.autonomyJob.update({ where: { id: queued.id }, data: { status: 'pending', availableAt: new Date() } })
      const claimed = await tx.$queryRaw<AutonomyJob[]>`SELECT * FROM public.claim_portal_autonomy_job(${PORTAL_VENTURE_ID}, ${new Date()}::timestamp, ${randomUUID()}, ${false}, ${true})`
      if (claimed.length !== 1 || claimed[0].id !== queued.id) throw new Error('Could not claim the job (paused, REINS intake off, or another job first); nothing changed.')
      return claimed[0]
    })

    const results: { sourcePropertyId: string | null; action: string; validUntil?: string; result: string }[] = []
    try {
      for (const { listing, decision } of changes) {
        const result = await withLiveLease(job, async (tx, policy) => {
          if (decision.action === 'extend' && !policy.allowPublication) return 'publication_paused'
          const override = await tx.autonomyRecord.findUnique({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `source-override:${listing.sourcePropertyId}` } } })
          if (override) return 'operator_override_preserved'
          const validUntil = decision.action === 'extend' ? decision.validUntil : new Date()
          // Content is unchanged, so updatedAt (sitemap lastmod, edit detection) is kept as is.
          const changed = await tx.listing.updateMany({
            where: { id: listing.id, status: 'PUBLISHED', updatedAt: listing.updatedAt, autonomyValidUntil: listing.autonomyValidUntil },
            data: { autonomyValidUntil: validUntil, updatedAt: listing.updatedAt },
          })
          return changed.count === 1 ? 'applied' : 'concurrent_edit_preserved'
        })
        results.push({ sourcePropertyId: listing.sourcePropertyId, action: decision.action, ...(decision.action === 'extend' ? { validUntil: decision.validUntil.toISOString() } : {}), result })
      }
      await writeRecord(job, 'freshness', 'Light REINS re-check (price, sales status, advertising field, change date)', { results, costYen: 0 }, [dir], 'verified')
      await finishJob(job, { results, costYen: 0 })
    } catch (error) {
      await finishJob(job, { blocked: true, reason: 'Light renewal interrupted.', results }, 'blocked')
      throw error
    }
    const resultFile = resolve(dir, 'light-renewal-result.json')
    writeFileSync(resultFile, JSON.stringify({ appliedAt: new Date().toISOString(), results }, null, 2), { mode: 0o600 })
    chmodSync(resultFile, 0o600)
    console.log(JSON.stringify({ applied: results.filter((item) => item.result === 'applied').length, results }))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Light renewal failed.')
  process.exitCode = 1
})
