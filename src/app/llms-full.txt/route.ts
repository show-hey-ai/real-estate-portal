import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { getPublicArticles } from '@/lib/portal-articles'
import { guideArticles } from '@/content/guides'
import { formatLlmsListing, type LlmsListing } from '@/lib/llms-listings'
import { WARD_SLUGS, countByWard, wardLabel } from '@/lib/ward-tile-map'
import { BUDGET_SLUGS, TYPE_COLLECTIONS, budgetBand, inBudget, typeSlugFor, type TypeSlug } from '@/lib/collections'
import { priceBandRange } from '@/lib/price-bands'

export const dynamic = 'force-dynamic'
const MAX_LISTED = 200

async function publishedListings(): Promise<LlmsListing[]> {
  try {
    const { data, error } = await createServiceClient().from('listings')
      .select('id, propertyType, city, price, buildingArea, landArea, builtYear, descriptionJa, currentStatus')
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
    '# Welcome Home Tokyo', '',
    'Welcome Home Tokyo is a Tokyo property portal for international buyers, operated by Ziyou Real Estate LLC (自由不動産合同会社, Tokyo Governor licence (1) No. 108831; Yanagibashi, Taito-ku, Tokyo; admin@ziyou-fudosan.com). It helps buyers look for investment property, residential homes, and land in Tokyo\'s 23 wards. The public site supports Japanese, English, Traditional Chinese, and Simplified Chinese.', '',
    'Every page has a URL per language: English is the plain URL; add ?lang=ja, ?lang=zh-TW or ?lang=zh-CN for Japanese, Traditional Chinese or Simplified Chinese.', '',
    'The portal lists properties for which advertising permission has been confirmed. A search result does not confirm current availability or suitability for an individual buyer. Prices are seller asking prices, not transaction prices.', '',
    'Signed-in buyers can save their purpose, budget, wards, property type, timing and other criteria on the personal search page. Saved criteria are rechecked against published listings, and matches are shown with matched, unmatched and unconfirmed points. The match score compares entered criteria only; it is not a loan, eligibility, yield or availability decision.', '',
    'Every listing page offers contact without sign-up: WhatsApp (+81-80-8492-7068) and LINE (official account @569fyrhn), both pre-filled with the listing, WeChat (ID sf930217) and email (admin@ziyou-fudosan.com). Signed-in buyers can also use the listing\'s private property chat.', '',
    'Each listing page has a monthly payment estimate and an initial cost simulator (also on the buying guide with any price): choose cash or a mortgage and a down payment to see the cash needed, split into the contract (5% deposit, stamp duty, half the brokerage) and settlement. It uses the statutory brokerage maximum, stamp duty on the sale and loan contracts from the National Tax Agency tables, and itemised rules of thumb: registration tax for ownership 0.5–0.8% of the price and for the mortgage 0.1–0.4% of the loan, judicial scrivener ¥100,000–200,000, acquisition tax 0.5–1.0%, pro-rata settlements 0.2–0.3%, fire and earthquake insurance 0.15–0.3% (about 2–3% of the price in total), plus a 2.2% lender fee on the loan. These are rough guides, not quotes.', '',
    'Financing: foreign nationals can often obtain a Japanese mortgage if they hold Japanese residence status (a visa), or can borrow through a company established in Japan. Buyers living abroad without residence status usually pay cash. Lenders decide eligibility, rates and down payment. The buying guide lists the usual costs by stage: contract (deposit, stamp duty, half the brokerage), settlement (balance, registration tax, scrivener, pro-rata taxes and fees, loan costs, insurance), after handover (acquisition tax) and ownership (fixed asset tax, management and repair fees, rental management, income tax with a tax representative for overseas owners).', '',
    '## Pages', '',
    `- [Home](${absoluteUrl('/')})`,
    `- [Properties for sale](${absoluteUrl('/listings')})`,
    `- [Buying guide](${absoluteUrl('/buying-guide')})`,
    `- [Personal search and saved criteria](${absoluteUrl('/match')})`,
    `- [Articles](${absoluteUrl('/articles')})`,
    `- [Help center](${absoluteUrl('/help')})`,
    `- [About us: operator, licence and content reviewer](${absoluteUrl('/about')})`,
    `- [Buying property in Tokyo as a foreigner: quick answers and listings](${absoluteUrl('/buy-property-in-tokyo')})`,
    `- [Buying from overseas: how the money moves, with a checklist](${absoluteUrl('/buy-from-overseas')})`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`, '',
    `## Properties for sale now (${listings.length})`, '',
    ...(listings.length ? listings.map((listing) => formatLlmsListing(listing, absoluteUrl(`/listings/${listing.id}`))) : ['See the properties page for the current inventory.']), '',
    '## Properties by ward', '',
    ...Object.entries(countByWard(listings)).sort((left, right) => right[1] - left[1]).filter(([ward]) => WARD_SLUGS[ward]).map(([ward, count]) => `- [${wardLabel(ward, 'en')}, Tokyo: ${count} for sale](${absoluteUrl(`/areas/${WARD_SLUGS[ward]}`)})`), '',
    '## Properties by type', '',
    ...(Object.keys(TYPE_COLLECTIONS) as TypeSlug[]).map((slug) => ({ slug, count: listings.filter((listing) => typeSlugFor(listing.propertyType) === slug).length })).filter((item) => item.count).map((item) => `- [${TYPE_COLLECTIONS[item.slug].label.en} for sale in Tokyo: ${item.count}](${absoluteUrl(`/types/${item.slug}`)})`), '',
    '## Properties by budget', '',
    ...BUDGET_SLUGS.map((slug) => ({ slug, count: listings.filter((listing) => inBudget(listing.price, budgetBand(slug)!)).length })).filter((item) => item.count).map((item) => `- [${priceBandRange(budgetBand(item.slug)!, 'en')}: ${item.count}](${absoluteUrl(`/budget/${item.slug}`)})`), '',
    '## Articles', '',
    ...articles.map((article) => `- [${article.locales.en.title}](${absoluteUrl(`/articles/${article.slug}/en`)}): ${article.locales.en.description}`),
    ...guideArticles.map((guide) => `- [${guide.locales.en.title}](${absoluteUrl(`/guides/${guide.slug}`)}): ${guide.locales.en.seoDescription}`), '',
  ].join('\n')
  return new Response(markdown, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
