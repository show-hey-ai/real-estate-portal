// Budget shortcuts for the home page. Bounds are inclusive minimum, exclusive maximum (yen).
export const PRICE_BANDS = [
  { min: 0, max: 20_000_000 },
  { min: 20_000_000, max: 40_000_000 },
  { min: 40_000_000, max: 60_000_000 },
  { min: 60_000_000, max: 100_000_000 },
  { min: 100_000_000, max: null },
] as const

export type PriceBand = (typeof PRICE_BANDS)[number]

export function countPriceBands(prices: (number | string | bigint | null)[]): number[] {
  const values = prices.map(Number).filter((price) => Number.isFinite(price) && price > 0)
  return PRICE_BANDS.map((band) => values.filter((price) => price >= band.min && (band.max === null || price < band.max)).length)
}

/** Listing search query for a band; the search treats priceMax as inclusive, so use one yen less. */
export function priceBandQuery(band: PriceBand): string {
  const params = new URLSearchParams()
  if (band.min > 0) params.set('priceMin', String(band.min))
  if (band.max !== null) params.set('priceMax', String(band.max - 1))
  return params.toString()
}

export function priceBandLabel(band: PriceBand, locale: string): string {
  const unit = (value: number) => {
    if (locale === 'en') return `¥${value / 1_000_000}M`
    const oku = locale === 'zh-CN' ? '亿' : '億'
    const man = locale === 'zh-TW' ? '萬' : '万'
    return value >= 100_000_000 ? `${value / 100_000_000}${oku}` : `${(value / 10_000).toLocaleString('ja-JP')}${man}`
  }
  if (band.min === 0) return locale === 'en' ? `Under ${unit(band.max!)}` : `〜${unit(band.max!)}`
  if (band.max === null) return locale === 'en' ? `${unit(band.min)}+` : `${unit(band.min)}〜`
  return `${unit(band.min)}–${unit(band.max)}`
}

/** Band label including the currency unit, for titles: 2,000万〜4,000万円 / 1億円〜 / ¥20M–¥40M. */
export function priceBandRange(band: PriceBand, locale: string): string {
  if (locale === 'en') return priceBandLabel(band, locale)
  const currency = locale === 'zh-TW' ? '日圓' : locale === 'zh-CN' ? '日元' : '円'
  const oku = locale === 'zh-CN' ? '亿' : '億'
  const man = locale === 'zh-TW' ? '萬' : '万'
  const unit = (value: number) => value >= 100_000_000 ? `${value / 100_000_000}${oku}` : `${(value / 10_000).toLocaleString('ja-JP')}${man}`
  if (band.min === 0) return `〜${unit(band.max!)}${currency}`
  if (band.max === null) return `${unit(band.min)}${currency}〜`
  return `${unit(band.min)}〜${unit(band.max)}${currency}`
}
