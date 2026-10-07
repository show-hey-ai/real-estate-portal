import { adFieldPermits, dealStatusBlocks, dealStatusOpen, parseReinsDetail, reinsDate, type ReinsDetail } from '../reins-detail'
import { CHECK_VALIDITY_MS, FULL_CHECK_INTERVAL_MS } from '../freshness'

/**
 * Weekly light re-check of an automatically published listing (user decision 2026-10-07). The
 * full check (current REINS detail plus a full read of the original drawing) stays mandatory at
 * least monthly and whenever REINS shows a change; in between, an unchanged price, sales status,
 * advertising field and change date on the current REINS detail page keep the listing visible
 * for another week (plus a grace day).
 */

export const LIGHT_EXTENSION_MS = CHECK_VALIDITY_MS
export { FULL_CHECK_INTERVAL_MS }
/** A saved detail page older than this is not a check made today. */
export const LIGHT_CHECK_MAX_AGE_MS = 6 * 3600_000

export interface LightRenewalListing {
  status: string
  sourcePropertyId: string | null
  price: number
  autonomyValidUntil: Date | null
}

/** What the last full check saw, read from its publication receipt. */
export interface FullCheckBaseline {
  capturedAt: Date
  adField: string | null
  changedOn: string | null
  factsUnchanged: boolean
}

export type LightRenewalDecision =
  | { action: 'extend'; validUntil: Date }
  | { action: 'full_check'; reasons: string[] }
  | { action: 'withdraw'; reasons: string[] }
  | { action: 'skip'; reasons: string[] }

export interface LightRenewalInput {
  listing: LightRenewalListing
  baseline: FullCheckBaseline | null
  detail: ReinsDetail
  checkedAt: Date
  now: Date
}

const tokyoDate = (date: Date) => new Date(date.getTime() + 9 * 3600_000).toISOString().slice(0, 10)
const sameText = (left: string | null, right: string | null) => (left ?? '').normalize('NFKC').replace(/\s/g, '') === (right ?? '').normalize('NFKC').replace(/\s/g, '')

export function lightRenewalDecision({ listing, baseline, detail, checkedAt, now }: LightRenewalInput): LightRenewalDecision {
  if (listing.status !== 'PUBLISHED' || !listing.autonomyValidUntil) return { action: 'skip', reasons: ['Not an automatically published listing.'] }
  if (checkedAt.getTime() > now.getTime() || now.getTime() - checkedAt.getTime() > LIGHT_CHECK_MAX_AGE_MS) return { action: 'skip', reasons: ['The saved REINS page is not from the last 6 hours.'] }
  if (!detail.sourcePropertyId || detail.sourcePropertyId !== listing.sourcePropertyId) return { action: 'skip', reasons: ['The saved page is for a different REINS number.'] }
  if (dealStatusBlocks(detail.dealStatus)) return { action: 'withdraw', reasons: [`REINS sales status: ${detail.dealStatus}`] }
  if (listing.autonomyValidUntil.getTime() <= now.getTime()) return { action: 'full_check', reasons: ['Publication already expired; only a full check can restore it.'] }

  const reasons: string[] = []
  if (!dealStatusOpen(detail.dealStatus)) reasons.push(`REINS sales status not readable as open: ${detail.dealStatus ?? '(missing)'}`)
  if (!baseline) reasons.push('No full-check receipt was found.')
  else {
    if (now.getTime() - baseline.capturedAt.getTime() > FULL_CHECK_INTERVAL_MS) reasons.push('The monthly full check is due.')
    if (!baseline.factsUnchanged) reasons.push('Listing facts were edited after the full check.')
    if (baseline.adField !== null ? !sameText(baseline.adField, detail.adField) : !adFieldPermits(detail.adField)) reasons.push(`REINS advertising field changed: ${detail.adField ?? '(none)'}`)
    const changed = baseline.changedOn !== null
      ? !sameText(baseline.changedOn, detail.changedOn)
      // Only a date is known: a change on the full check's own day cannot be ordered, so it counts.
      : (reinsDate(detail.changedOn) ?? '9999-12-31') >= tokyoDate(baseline.capturedAt)
    if (changed) reasons.push(`REINS shows an update since the full check: ${detail.changedOn ?? '(no date)'}`)
  }
  if (detail.price === null || detail.price !== listing.price) reasons.push(`Price on REINS differs: ${detail.price ?? '(unreadable)'}`)
  if (reasons.length) return { action: 'full_check', reasons }

  if (!baseline) return { action: 'full_check', reasons: ['No full-check receipt was found.'] }
  const validUntil = new Date(Math.min(checkedAt.getTime() + LIGHT_EXTENSION_MS, baseline.capturedAt.getTime() + FULL_CHECK_INTERVAL_MS))
  if (validUntil.getTime() <= listing.autonomyValidUntil.getTime()) return { action: 'skip', reasons: ['Already valid beyond what a light check can grant.'] }
  return { action: 'extend', validUntil }
}

interface ReceiptLike {
  capturedAt: string
  factsHash: string
  ad?: { positive_evidence?: string[] }
  evidence?: { field_name: string; raw_text: string }[]
}

/** Audit chunks overlap by 300 characters (makeImportReceipt); rebuild the original text. */
function sourceText(receipt: ReceiptLike): string {
  const chunks = (receipt.evidence ?? []).filter((item) => item.field_name === 'source_text').map((item) => item.raw_text)
  return chunks.map((chunk, index) => (index === 0 ? chunk : chunk.slice(300))).join('')
}

/** Reads what the last full check saw from its receipt; null when the receipt has no valid time. */
export function baselineFromReceipt(receipt: ReceiptLike, currentFactsHash: string): FullCheckBaseline | null {
  const capturedAt = new Date(receipt.capturedAt)
  if (Number.isNaN(capturedAt.getTime())) return null
  const detail = parseReinsDetail(sourceText(receipt))
  const fromEvidence = (receipt.ad?.positive_evidence ?? []).map((item) => item.normalize('NFKC').match(/広告転載区分[:：]\s*(.+)$/u)?.[1]?.trim()).find(Boolean) ?? null
  return {
    capturedAt,
    adField: detail.adField ?? fromEvidence,
    changedOn: detail.changedOn,
    factsUnchanged: receipt.factsHash === currentFactsHash,
  }
}
