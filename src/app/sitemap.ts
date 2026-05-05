import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { guideArticles } from '@/content/guides'
import { absoluteUrl } from '@/lib/site-config'

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
  const latestGuideModifiedAt = getLatestDate(
    guideArticles.flatMap((article) => [article.publishedAt, article.updatedAt])
  )

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl('/'),
      lastModified: latestGuideModifiedAt,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/listings'),
      lastModified: latestGuideModifiedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/guides'),
      lastModified: latestGuideModifiedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    ...guideArticles.map((article) => ({
      url: absoluteUrl(`/guides/${article.slug}`),
      lastModified: article.updatedAt || article.publishedAt,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
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
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('Failed to build sitemap from listings:', error.message)
    return staticEntries
  }

  const latestListingModifiedAt = getLatestDate(
    (data || []).flatMap((listing) => [listing.updatedAt, listing.publishedAt])
  )
  const staticLastModified = getLatestDate([latestGuideModifiedAt, latestListingModifiedAt])
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
