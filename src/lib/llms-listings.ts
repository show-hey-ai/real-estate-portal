import { translateCityName, translatePropertyType } from './translate-fields'
import { extractBuildingName } from './building-name'

export interface LlmsListing {
  id: string
  propertyType: string | null
  city: string | null
  price: number | string | bigint | null
  buildingArea: number | string | null
  landArea: number | string | null
  builtYear: number | null
  descriptionJa?: string | null
}

/** One factual English line per published listing for AI assistants; no availability or return claims. */
export function formatLlmsListing(listing: LlmsListing, url: string): string {
  const type = translatePropertyType(listing.propertyType, 'en') || 'Property'
  const ward = listing.city ? `${translateCityName(listing.city, 'en') || listing.city}, Tokyo` : 'Tokyo'
  const area = Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea) || null
  const facts = [
    listing.price ? `asking JPY ${Number(listing.price).toLocaleString('en-US')}` : null,
    area ? `${area} m² ${listing.propertyType === '土地' ? 'land' : 'floor area'}` : null,
    listing.builtYear ? `built ${listing.builtYear}` : null,
  ].filter(Boolean)
  const name = extractBuildingName(listing.descriptionJa)
  return `- [${type} in ${ward}${name ? ` (${name})` : ''}](${url})${facts.length ? `: ${facts.join(', ')}` : ''}`
}
