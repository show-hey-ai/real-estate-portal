import 'server-only'

import { cache } from 'react'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { createServiceClient } from '@/lib/supabase/server'

const CARD_FIELDS = 'id, city, propertyType, price, addressPublic, descriptionJa, descriptionEn, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, publishedAt, media (url, category, caption, isAdopted)'

/** Public listings with what a listing card needs, newest first; read once per request. */
export const getPublicCardRows = cache(async () => {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select(CARD_FIELDS)
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    .order('publishedAt', { ascending: false })
    .limit(1000)
  if (error) {
    console.error('Failed to load listings for line and station pages:', error.message)
    return []
  }
  return data || []
})

export type PublicCardRow = Awaited<ReturnType<typeof getPublicCardRows>>[number]

/** The shape ListingCard expects (BigInt price, numeric areas, adopted photos only). */
export function toCardListing(row: PublicCardRow) {
  return {
    ...row,
    price: row.price ? BigInt(row.price) : null,
    buildingArea: row.buildingArea ? Number(row.buildingArea) : null,
    landArea: row.landArea ? Number(row.landArea) : null,
    yieldGross: row.yieldGross ? Number(row.yieldGross) : null,
    media: (row.media || []).filter((item) => item.isAdopted),
  }
}
