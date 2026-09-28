/** Buyer-facing groups derived from factual listing fields; no publication decision is made here. */
export type MarketCategory = 'investment' | 'residential' | 'land'

export const PUBLIC_PROPERTY_TYPES = [
  '区分マンション', '戸建', '土地',
  '一棟マンション', '一棟アパート', '一棟ビル', '店舗・事務所',
] as const

const investmentTypes = new Set<string>([
  '一棟マンション', '一棟アパート', '一棟ビル', '店舗・事務所',
])
const residentialTypes = new Set<string>(['区分マンション', '戸建'])
const tenancyPattern = /オーナーチェンジ|賃貸中|賃貸借|賃借人|サブリース中|入居者あり|入居者有|満室/u

export interface MarketListingFacts {
  propertyType: string | null | undefined
  currentStatus?: string | null
  yieldGross?: number | string | { toString(): string } | null
}

export function getMarketCategory(listing: MarketListingFacts): MarketCategory | null {
  const type = listing.propertyType
  if (type === '土地') return 'land'
  if (type && investmentTypes.has(type)) return 'investment'
  if (type && residentialTypes.has(type)) {
    if (tenancyPattern.test(listing.currentStatus || '') || Number(listing.yieldGross || 0) > 0) {
      return 'investment'
    }
    return 'residential'
  }
  return null
}

export function isPublicPropertyType(type: string | null | undefined): type is typeof PUBLIC_PROPERTY_TYPES[number] {
  return !!type && PUBLIC_PROPERTY_TYPES.includes(type as typeof PUBLIC_PROPERTY_TYPES[number])
}

export function isInvestmentTenancy(text: string | null | undefined): boolean {
  return tenancyPattern.test(text || '')
}

export function isMarketCategory(value: string | null | undefined): value is MarketCategory {
  return value === 'investment' || value === 'residential' || value === 'land'
}
