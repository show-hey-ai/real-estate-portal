import { PRICE_BANDS, type PriceBand } from './price-bands'

// Indexable collection pages by property type and by budget.

export const TYPE_COLLECTIONS = {
  condominium: { types: ['区分マンション'], label: { ja: '中古マンション', en: 'Condominiums', 'zh-TW': '中古公寓', 'zh-CN': '二手公寓' } },
  house: { types: ['戸建'], label: { ja: '戸建て', en: 'Houses', 'zh-TW': '獨棟住宅', 'zh-CN': '独栋住宅' } },
  'apartment-building': { types: ['一棟マンション', '一棟アパート'], label: { ja: '一棟マンション・アパート', en: 'Apartment buildings', 'zh-TW': '整棟公寓', 'zh-CN': '整栋公寓' } },
  'commercial-building': { types: ['一棟ビル', '店舗・事務所'], label: { ja: '一棟ビル・店舗・事務所', en: 'Commercial buildings and shops', 'zh-TW': '整棟大樓・店面・辦公室', 'zh-CN': '整栋大楼・店铺・办公室' } },
  land: { types: ['土地'], label: { ja: '土地', en: 'Land', 'zh-TW': '土地', 'zh-CN': '土地' } },
} as const satisfies Record<string, { types: readonly string[]; label: Record<string, string> }>

export type TypeSlug = keyof typeof TYPE_COLLECTIONS

export const BUDGET_SLUGS = ['under-20m', '20m-40m', '40m-60m', '60m-100m', 'over-100m'] as const
export type BudgetSlug = (typeof BUDGET_SLUGS)[number]

export function isTypeSlug(value: string): value is TypeSlug {
  return Object.hasOwn(TYPE_COLLECTIONS, value)
}

export function typeSlugFor(propertyType: string | null | undefined): TypeSlug | null {
  if (!propertyType) return null
  return (Object.keys(TYPE_COLLECTIONS) as TypeSlug[]).find((slug) => (TYPE_COLLECTIONS[slug].types as readonly string[]).includes(propertyType)) ?? null
}

export function budgetBand(slug: string): PriceBand | null {
  const index = (BUDGET_SLUGS as readonly string[]).indexOf(slug)
  return index === -1 ? null : PRICE_BANDS[index]
}

export function budgetSlugFor(band: PriceBand): BudgetSlug {
  return BUDGET_SLUGS[PRICE_BANDS.indexOf(band)]
}

export function inBudget(price: number | string | bigint | null, band: PriceBand): boolean {
  const value = Number(price)
  return Number.isFinite(value) && value > 0 && value >= band.min && (band.max === null || value < band.max)
}
