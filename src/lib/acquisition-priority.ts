import type { ScreeningVerdict } from './ad-screening'
import { sourcePrices } from './autonomy/publication'
import { adFieldPermits, classifyImages, dealStatusBlocks, type ReinsDetail } from './reins-detail'

/**
 * Work order for listing acquisition: pages whose drawing allows advertising first, then the
 * user's price range (¥50M–¥100M, then over ¥100M, then the rest), and listings with room photos
 * before listings without. Ordering only; every publication check still applies.
 */

const WARDS = ['千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区']
const PREFERRED_MIN = 50_000_000
const PREFERRED_MAX = 100_000_000
const PLAUSIBLE_MIN = 1_000_000
const PLAUSIBLE_MAX = 50_000_000_000
const ROOM_PHOTOS_STRONG = 3

export const VERDICT_ORDER: Record<ScreeningVerdict, number> = { permitted: 0, unclear: 1, no_mention: 2, consent: 3, denied: 4 }

/** Pages worth opening: the drawing allows it, is unclear, or is silent (REINS's own field may allow it). */
export function isWorkable(verdict: ScreeningVerdict): boolean {
  return VERDICT_ORDER[verdict] <= VERDICT_ORDER.no_mention
}

/** 0 = ¥50M–¥100M, 1 = over ¥100M, 2 = under ¥50M, 3 = unknown. */
export function priceTier(price: number | null): number {
  if (price === null) return 3
  if (price >= PREFERRED_MIN && price <= PREFERRED_MAX) return 0
  return price > PREFERRED_MAX ? 1 : 2
}

/** 0 = three or more room photos, 1 = some room or unnamed photos, 2 = none found. */
export function photoTier(images: { interior: number; unlabeled: number }): number {
  if (images.interior >= ROOM_PHOTOS_STRONG) return 0
  return images.interior > 0 || images.unlabeled >= ROOM_PHOTOS_STRONG ? 1 : 2
}

/**
 * The asking price on an OCR page: the amount after 「価格」, else the largest amount in 万円 or
 * 億円 that is not a monthly or yearly figure. Big price digits often OCR apart from their label,
 * so this is a sorting hint only; the REINS detail page has the exact price.
 */
export function pagePrice(rows: readonly string[]): number | null {
  const texts = rows.map((row) => row.normalize('NFKC').replace(/\s/g, ''))
  for (const text of texts) {
    const at = text.search(/(?<!変更前|うち)価格/u)
    if (at < 0) continue
    const price = sourcePrices(text.slice(at)).find((value) => value >= PLAUSIBLE_MIN && value <= PLAUSIBLE_MAX)
    if (price) return price
  }
  const amounts = texts.flatMap((text) => [...text.matchAll(/(?<![\d,.])(\d{1,3}(?:,\d{3})+|\d{3,5})(?:\.\d+)?(万円|億円)(?![/／]?(?:月|年))/gu)]
    .filter((match) => !/(?:月額|年額|年間|賃料|収入|管理費|積立金)[^。]{0,6}$/u.test(text.slice(0, match.index)))
    .map((match) => Number(match[1].replaceAll(',', '')) * (match[2] === '億円' ? 100_000_000 : 10_000)))
    .filter((value) => value >= 10_000_000 && value <= PLAUSIBLE_MAX)
  return amounts.length ? Math.max(...amounts) : null
}

export function pageWard(rows: readonly string[]): string | null {
  for (const row of rows) {
    const text = row.normalize('NFKC').replace(/\s/g, '')
    const ward = WARDS.find((name) => text.includes(`東京都${name}`)) ?? WARDS.find((name) => new RegExp(`(?<![一-龯])${name}`, 'u').test(text) && /丁目|\d-\d|所在地|住所/u.test(text))
    if (ward) return ward
  }
  return null
}

export interface ScreenedPage {
  page: string
  verdict: ScreeningVerdict
  price: number | null
}

export function comparePages(left: ScreenedPage, right: ScreenedPage): number {
  return VERDICT_ORDER[left.verdict] - VERDICT_ORDER[right.verdict]
    || priceTier(left.price) - priceTier(right.price)
    || (right.price ?? 0) - (left.price ?? 0)
    || left.page.localeCompare(right.page)
}

export interface DetailCandidate {
  sourcePropertyId: string
  price: number | null
  adField: string | null
  adPermits: boolean
  blocked: boolean
  interior: number
  unlabeled: number
}

export function detailCandidate(detail: ReinsDetail & { sourcePropertyId: string }): DetailCandidate {
  const images = classifyImages(detail.imageNames)
  return {
    sourcePropertyId: detail.sourcePropertyId,
    price: detail.price,
    adField: detail.adField,
    adPermits: adFieldPermits(detail.adField),
    blocked: dealStatusBlocks(detail.dealStatus),
    interior: images.interior,
    unlabeled: images.unlabeled,
  }
}

/** Available first, REINS advertising allowed first, then room photos, then price range. */
export function compareDetails(left: DetailCandidate, right: DetailCandidate): number {
  return Number(left.blocked) - Number(right.blocked)
    || Number(right.adPermits) - Number(left.adPermits)
    || photoTier(left) - photoTier(right)
    || priceTier(left.price) - priceTier(right.price)
    || right.interior - left.interior
    || left.sourcePropertyId.localeCompare(right.sourcePropertyId)
}
