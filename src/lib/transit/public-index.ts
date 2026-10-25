import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { createServiceClient } from '@/lib/supabase/server'
import { buildTransitIndex, transitOptions, type TransitIndex, type TransitOptions } from './search'

/** The nearby stations of every public listing; counts on the pages follow the CDN's ten minutes. */
async function fetchPublicStationRows(): Promise<{ stations: unknown }[]> {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('stations')
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0])
    .or(publicFreshnessFilters()[1])
  if (error) {
    console.error('Failed to load listing stations for line search:', error.message)
    return []
  }
  return data ?? []
}

const getPublicStationRowsCached = unstable_cache(fetchPublicStationRows, ['public-station-rows'], { revalidate: 600 })

const getPublicStationRows = cache(async () => getPublicStationRowsCached())

export async function getTransitIndex(locale: string): Promise<TransitIndex> {
  return buildTransitIndex(await getPublicStationRows(), locale)
}

export async function getTransitOptions(locale: string): Promise<TransitOptions> {
  return transitOptions(await getTransitIndex(locale))
}
