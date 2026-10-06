const SQM_PER_TSUBO = 3.305785

/** Asking price per m² (and per tsubo in Japanese) so differently sized listings can be compared. */
export function formatUnitPrice(price: number | null | undefined, area: number | null | undefined, locale: string): string | null {
  if (!price || !area || price <= 0 || area <= 0) return null
  const perSqm = price / area
  const man = (value: number) => (value / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })
  if (locale === 'en') return `¥${Math.round(perSqm).toLocaleString('en-US')}/m²`
  if (locale === 'zh-TW') return `${man(perSqm)}萬日圓/㎡`
  if (locale === 'zh-CN') return `${man(perSqm)}万日元/㎡`
  return `${man(perSqm)}万円/㎡（坪${man(perSqm * SQM_PER_TSUBO)}万円）`
}

export interface UnitPriceSource {
  id: string
  propertyType: string | null
  price: number | string | bigint | null
  buildingArea: number | string | null
  landArea: number | string | null
}

/** Asking price per m² of one listing; land uses land area, everything else floor area. */
export function unitPriceOf(listing: UnitPriceSource): number | null {
  const price = Number(listing.price)
  const area = Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea)
  return Number.isFinite(price) && price > 0 && Number.isFinite(area) && area > 0 ? price / area : null
}

export const MIN_COMPARISON_LISTINGS = 3

/**
 * Compares a listing's asking price per m² with the average of other published listings of the
 * same kind in its ward. Returns null when fewer than three listings (including this one) qualify.
 */
export function compareUnitPrice(current: UnitPriceSource, peers: UnitPriceSource[]): { current: number; average: number; count: number } | null {
  const own = unitPriceOf(current)
  if (own === null) return null
  const others = peers.filter((peer) => peer.id !== current.id && (peer.propertyType === '土地') === (current.propertyType === '土地')).map(unitPriceOf).filter((value): value is number => value !== null)
  if (others.length + 1 < MIN_COMPARISON_LISTINGS) return null
  return { current: own, average: others.reduce((sum, value) => sum + value, 0) / others.length, count: others.length }
}
