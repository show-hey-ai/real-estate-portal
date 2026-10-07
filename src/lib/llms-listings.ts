import { translateCityName, translatePropertyType } from './translate-fields'
import { buildingNameOf } from './building-name'
import { parseMonthlyFigures } from './monthly-costs'

export interface LlmsListing {
  id: string
  propertyType: string | null
  city: string | null
  price: number | string | bigint | null
  buildingArea: number | string | null
  landArea: number | string | null
  builtYear: number | null
  descriptionJa?: string | null
  currentStatus?: string | null
}

/** One factual English line per published listing for AI assistants; no availability or return claims. */
export function formatLlmsListing(listing: LlmsListing, url: string): string {
  const type = translatePropertyType(listing.propertyType, 'en') || 'Property'
  const ward = listing.city ? `${translateCityName(listing.city, 'en') || listing.city}, Tokyo` : 'Tokyo'
  const monthly = parseMonthlyFigures(listing.descriptionJa)
  const area = Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea) || null
  const facts = [
    listing.price ? `asking JPY ${Number(listing.price).toLocaleString('en-US')}` : null,
    area ? `${area} m² ${listing.propertyType === '土地' ? 'land' : 'floor area'}` : null,
    listing.builtYear ? `built ${listing.builtYear}` : null,
    monthly.fees ? `management and repair fees JPY ${monthly.fees.toLocaleString('en-US')}/month` : null,
    monthly.rent && listing.currentStatus?.includes('賃貸中') ? `let, current rent JPY ${monthly.rent.toLocaleString('en-US')}/month` : null,
  ].filter(Boolean)
  const name = buildingNameOf(listing)
  return `- [${type} in ${ward}${name ? ` (${name})` : ''}](${url})${facts.length ? `: ${facts.join(', ')}` : ''}`
}
