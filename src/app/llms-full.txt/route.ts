import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { getPublicArticles } from '@/lib/portal-articles'
import { guideArticles } from '@/content/guides'
import { formatLlmsListing, type LlmsListing } from '@/lib/llms-listings'
import { WARD_SLUGS, countByWard, wardLabel } from '@/lib/ward-tile-map'

export const dynamic = 'force-dynamic'
const MAX_LISTED = 200

async function publishedListings(): Promise<LlmsListing[]> {
  try {
    const { data, error } = await createServiceClient().from('listings')
      .select('id, propertyType, city, price, buildingArea, landArea, builtYear')
      .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
      .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
      .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
      .order('publishedAt', { ascending: false }).limit(MAX_LISTED)
    return error ? [] : (data as LlmsListing[] | null) || []
  } catch { return [] } // The page stays useful when inventory cannot be read.
}

export async function GET() {
  const [listings, articles] = await Promise.all([publishedListings(), getPublicArticles()])
  const markdown = [
    '# Ziyou Real Estate', '',
    'Ziyou Real Estate (自由不動産合同会社, Tokyo Governor licence (1) No. 108831; Yanagibashi, Taito-ku, Tokyo; +81-3-5687-7120; admin@ziyou-fudosan.com) helps buyers look for investment property, residential homes, and land in Tokyo\'s 23 wards. The public site supports Japanese, English, Traditional Chinese, and Simplified Chinese.', '',
    'Every page has a URL per language: English is the plain URL; add ?lang=ja, ?lang=zh-TW or ?lang=zh-CN for Japanese, Traditional Chinese or Simplified Chinese.', '',
    'The portal lists properties for which advertising permission has been confirmed. A search result does not confirm current availability or suitability for an individual buyer. Prices are seller asking prices, not transaction prices.', '',
    'Signed-in buyers can save their purpose, budget, wards, property type, timing and other criteria on the personal search page. Saved criteria are rechecked against published listings, and matches are shown with matched, unmatched and unconfirmed points. The match score compares entered criteria only; it is not a loan, eligibility, yield or availability decision.', '',
    'Every listing page offers contact without sign-up: WhatsApp (+81-80-8492-7068, pre-filled with the listing), email (admin@ziyou-fudosan.com) and phone (+81-3-5687-7120). Signed-in buyers can also use the listing\'s private property chat.', '',
    '## Pages', '',
    `- [Home](${absoluteUrl('/')})`,
    `- [Properties for sale](${absoluteUrl('/listings')})`,
    `- [Buying guide](${absoluteUrl('/buying-guide')})`,
    `- [Personal search and saved criteria](${absoluteUrl('/match')})`,
    `- [Articles](${absoluteUrl('/articles')})`,
    `- [Help center](${absoluteUrl('/help')})`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`, '',
    `## Properties for sale now (${listings.length})`, '',
    ...(listings.length ? listings.map((listing) => formatLlmsListing(listing, absoluteUrl(`/listings/${listing.id}`))) : ['See the properties page for the current inventory.']), '',
    '## Properties by ward', '',
    ...Object.entries(countByWard(listings)).sort((left, right) => right[1] - left[1]).filter(([ward]) => WARD_SLUGS[ward]).map(([ward, count]) => `- [${wardLabel(ward, 'en')}, Tokyo: ${count} for sale](${absoluteUrl(`/areas/${WARD_SLUGS[ward]}`)})`), '',
    '## Articles', '',
    ...articles.map((article) => `- [${article.locales.en.title}](${absoluteUrl(`/articles/${article.slug}/en`)}): ${article.locales.en.description}`),
    ...guideArticles.map((guide) => `- [${guide.locales.en.title}](${absoluteUrl(`/guides/${guide.slug}`)}): ${guide.locales.en.seoDescription}`), '',
  ].join('\n')
  return new Response(markdown, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
