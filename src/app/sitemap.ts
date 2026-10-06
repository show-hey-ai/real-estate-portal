import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'
import { absoluteUrl, getSchemaLanguage } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { getPublicArticles } from '@/lib/portal-articles'
import { guideArticles } from '@/content/guides'
import { locales } from '@/i18n/config'
import { parseDbTimestamp } from '@/lib/db-timestamp'
import { localizedSitemapUrls } from '@/lib/locale-url'
import { WARD_SLUGS } from '@/lib/ward-tile-map'
import { BUDGET_SLUGS, TYPE_COLLECTIONS, budgetBand, inBudget, typeSlugFor, type TypeSlug } from '@/lib/collections'

export const dynamic = 'force-dynamic'

function getLatestDate(values: Array<string | Date | null | undefined>) {
  const timestamps = values
    .map((value) => parseDbTimestamp(value)?.getTime() ?? null)
    .filter((value): value is number => value != null)

  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date('2026-04-09T00:00:00.000Z')
}

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]['changeFrequency']>

function localized(path: string, lastModified: Date | string, changeFrequency: ChangeFrequency, priority: number): MetadataRoute.Sitemap {
  return localizedSitemapUrls(path).map(({ url, languages }) => ({ url, lastModified, changeFrequency, priority, alternates: { languages } }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const portalLaunchAt = new Date('2026-09-29T00:00:00+09:00')
  const articles = await getPublicArticles()
  const articleEntries: MetadataRoute.Sitemap = articles.flatMap((article) => locales.map((locale) => ({ url: absoluteUrl(`/articles/${article.slug}/${locale}`), lastModified: article.updatedAt, changeFrequency: 'weekly' as const, priority: 0.65, alternates: { languages: Object.fromEntries(locales.map((language) => [getSchemaLanguage(language), absoluteUrl(`/articles/${article.slug}/${language}`)])) } })))
  const guideEntries: MetadataRoute.Sitemap = [
    ...localized('/guides', getLatestDate(guideArticles.map((guide) => guide.updatedAt)), 'monthly', 0.6),
    ...guideArticles.flatMap((guide) => localized(`/guides/${guide.slug}`, new Date(guide.updatedAt), 'monthly', 0.6)),
  ]

  // Every page has one URL per language.
  const articleIndex = (lastModified: Date | string): MetadataRoute.Sitemap =>
    articles.length ? localized('/articles', lastModified, 'weekly', 0.65) : []
  const staticPages = (lastModified?: Date): MetadataRoute.Sitemap => [
    ...articleIndex(lastModified ?? (articles[0]?.updatedAt || portalLaunchAt)),
    ...localized('/', lastModified ?? portalLaunchAt, 'daily', 1),
    ...localized('/listings', lastModified ?? portalLaunchAt, 'daily', 0.9),
    ...localized('/buying-guide', lastModified ?? new Date('2026-09-29T00:00:00+09:00'), 'monthly', 0.85),
    ...localized('/match', lastModified ?? new Date('2026-09-29T00:00:00+09:00'), 'monthly', 0.8),
    ...localized('/help', lastModified ?? new Date('2026-10-03T00:00:00+09:00'), 'monthly', 0.6),
  ]
  const staticEntries = staticPages()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return [...staticEntries, ...guideEntries, ...articleEntries]
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const { data, error } = await supabase
    .from('listings')
    .select('id, city, propertyType, price, updatedAt, publishedAt')
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
  const adjustedStaticEntries = staticPages(staticLastModified)

  const listingEntries: MetadataRoute.Sitemap = (data || []).flatMap((listing) =>
    localized(`/listings/${listing.id}`, parseDbTimestamp(listing.updatedAt) || parseDbTimestamp(listing.publishedAt) || new Date(), 'weekly', 0.8))

  // Ward pages with at least one published listing; empty wards are noindex.
  const wardEntries: MetadataRoute.Sitemap = [...new Set((data || []).map((listing) => listing.city).filter((city): city is string => !!city && !!WARD_SLUGS[city]))]
    .flatMap((city) => localized(`/areas/${WARD_SLUGS[city]}`, getLatestDate((data || []).filter((listing) => listing.city === city).map((listing) => listing.updatedAt)), 'daily', 0.85))

  // Type and budget collections that currently hold listings; empty ones are noindex.
  const rows = data || []
  const typeEntries: MetadataRoute.Sitemap = (Object.keys(TYPE_COLLECTIONS) as TypeSlug[])
    .filter((slug) => rows.some((row) => typeSlugFor(row.propertyType) === slug))
    .flatMap((slug) => localized(`/types/${slug}`, getLatestDate(rows.filter((row) => typeSlugFor(row.propertyType) === slug).map((row) => row.updatedAt)), 'daily', 0.85))
  const budgetEntries: MetadataRoute.Sitemap = BUDGET_SLUGS
    .filter((slug) => rows.some((row) => inBudget(row.price, budgetBand(slug)!)))
    .flatMap((slug) => localized(`/budget/${slug}`, getLatestDate(rows.filter((row) => inBudget(row.price, budgetBand(slug)!)).map((row) => row.updatedAt)), 'daily', 0.8))

  return [...adjustedStaticEntries, ...wardEntries, ...typeEntries, ...budgetEntries, ...guideEntries, ...listingEntries, ...articleEntries]
}
