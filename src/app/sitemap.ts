import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { absoluteUrl } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'

function getLatestDate(values: Array<string | Date | null | undefined>) {
  const timestamps = values
    .map((value) => {
      if (!value) return null
      const date = value instanceof Date ? value : new Date(value)
      return Number.isNaN(date.getTime()) ? null : date.getTime()
    })
    .filter((value): value is number => value != null)

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date('2026-04-09T00:00:00.000Z')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portalLaunchAt = new Date('2026-09-29T00:00:00+09:00')

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: portalLaunchAt,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/listings'),
      lastModified: portalLaunchAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    { url: absoluteUrl('/buying-guide'), lastModified: new Date('2026-09-29T00:00:00+09:00'), changeFrequency: 'monthly', priority: 0.85 },
    { url: absoluteUrl('/match'), lastModified: new Date('2026-09-29T00:00:00+09:00'), changeFrequency: 'monthly', priority: 0.8 },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return staticEntries
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase
    .from('listings')
    .select('id, updatedAt, publishedAt')
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('Failed to build sitemap from listings:', error.message)
    return staticEntries
  }

  const latestListingModifiedAt = getLatestDate(
    (data || []).flatMap((listing) => [listing.updatedAt, listing.publishedAt])
  )
  const staticLastModified = getLatestDate([portalLaunchAt, latestListingModifiedAt])
  const adjustedStaticEntries = staticEntries.map((entry) => ({
    ...entry,
    lastModified: staticLastModified,
  }))

  const listingEntries: MetadataRoute.Sitemap = (data || []).map((listing) => ({
    url: absoluteUrl(`/listings/${listing.id}`),
    lastModified: listing.updatedAt || listing.publishedAt || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...adjustedStaticEntries, ...listingEntries]
}
