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
