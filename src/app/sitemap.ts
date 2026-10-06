import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { absoluteUrl } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { getPublicArticles } from '@/lib/portal-articles'
import { guideArticles } from '@/content/guides'
import { locales } from '@/i18n/config'
import { parseDbTimestamp } from '@/lib/db-timestamp'

export const dynamic = 'force-dynamic'

function getLatestDate(values: Array<string | Date | null | undefined>) {
  const timestamps = values
    .map((value) => parseDbTimestamp(value)?.getTime() ?? null)
    .filter((value): value is number => value != null)

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date('2026-04-09T00:00:00.000Z')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portalLaunchAt = new Date('2026-09-29T00:00:00+09:00')
  const articles = await getPublicArticles()
  const articleEntries: MetadataRoute.Sitemap = articles.flatMap((article) => locales.map((locale) => ({ url: absoluteUrl(`/articles/${article.slug}/${locale}`), lastModified: article.updatedAt, changeFrequency: 'weekly' as const, priority: 0.65, alternates: { languages: Object.fromEntries(locales.map((language) => [language, absoluteUrl(`/articles/${article.slug}/${language}`)])) } })))
  const guideEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/guides'), lastModified: getLatestDate(guideArticles.map((guide) => guide.updatedAt)), changeFrequency: 'monthly', priority: 0.6 },
    ...guideArticles.map((guide) => ({ url: absoluteUrl(`/guides/${guide.slug}`), lastModified: new Date(guide.updatedAt), changeFrequency: 'monthly' as const, priority: 0.6 })),
  ]

  const staticEntries: MetadataRoute.Sitemap = [
    ...(articles.length ? [{ url: absoluteUrl('/articles'), lastModified: articles[0].updatedAt, changeFrequency: 'weekly' as const, priority: 0.65 }] : []),
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
    { url: absoluteUrl('/help'), lastModified: new Date('2026-10-03T00:00:00+09:00'), changeFrequency: 'monthly', priority: 0.6 },
  ]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return [...staticEntries, ...guideEntries, ...articleEntries]
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase
    .from('listings')
    .select('id, updatedAt, publishedAt')
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0])
    .or(publicFreshnessFilters()[1])
    .order('updatedAt', { ascending: false })

  if (error) {
    console.error('Failed to build sitemap from listings:', error.message)
    return [...staticEntries, ...guideEntries, ...articleEntries]
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
    lastModified: parseDbTimestamp(listing.updatedAt) || parseDbTimestamp(listing.publishedAt) || new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...adjustedStaticEntries, ...guideEntries, ...listingEntries, ...articleEntries]
}
