import { createServiceClient } from '@/lib/supabase/server'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'

const CARD_FIELDS = 'id, city, propertyType, price, addressPublic, descriptionJa, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, publishedAt, media (url, category, caption, isAdopted, sortOrder)'

/** Newest published listings, shaped for ListingCard. Failures return an empty list. */
export async function getLatestListingCards(limit: number) {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select(CARD_FIELDS)
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    .order('publishedAt', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map((home) => ({
    ...home,
    price: home.price ? BigInt(home.price) : null,
    buildingArea: home.buildingArea ? Number(home.buildingArea) : null,
    landArea: home.landArea ? Number(home.landArea) : null,
    yieldGross: home.yieldGross ? Number(home.yieldGross) : null,
    media: (home.media || []).filter((item) => item.isAdopted),
  }))
}

const ROW_FIELDS = 'id, city, propertyType, price, addressPublic, descriptionJa, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, publishedAt, media (url, category, caption, isAdopted, sortOrder)'

/** All published listings (up to 500) as raw rows for collection pages. */
export async function getPublicListingRows() {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select(ROW_FIELDS)
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    .order('publishedAt', { ascending: false })
    .limit(500)
  if (error) { console.error('Failed to load public listings:', error); return [] }
  return data || []
}

/** Number of published listings; 0 when the count cannot be read. */
export async function countPublicListings(): Promise<number> {
  const { count, error } = await createServiceClient()
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
  if (error) { console.error('Failed to count public listings:', error); return 0 }
  return count ?? 0
}

export type PublicListingRow = Awaited<ReturnType<typeof getPublicListingRows>>[number]

export function toCardListing(home: PublicListingRow) {
  return {
    ...home,
    price: home.price ? BigInt(home.price) : null,
    buildingArea: home.buildingArea ? Number(home.buildingArea) : null,
    landArea: home.landArea ? Number(home.landArea) : null,
    yieldGross: home.yieldGross ? Number(home.yieldGross) : null,
    media: (home.media || []).filter((item) => item.isAdopted),
  }
}
