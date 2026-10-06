import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'

export async function GET() {
  let count: number | null = null
  try {
    const result = await createServiceClient().from('listings').select('*', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED').eq('adAllowed', true)
    .eq('adConsentRequired', false)
      .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
      .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    if (!result.error) count = result.count
  } catch { /* Inventory count can be unavailable without affecting the page. */ }

  const markdown = [
    '# Welcome Home Tokyo', '',
    '> Multilingual portal for international buyers of investment property, homes and land in Tokyo, Japan, operated by Ziyou Real Estate LLC (自由不動産合同会社), a licensed Tokyo brokerage.', '',
    count == null ? 'See the live listings page for current properties.' : `Currently published properties: ${count}.`,
    'Only listings with advertising permission are shown. Availability may change; ask the brokerage to confirm.',
    'Pages are available in English (plain URL), Japanese (?lang=ja), Traditional Chinese (?lang=zh-TW) and Simplified Chinese (?lang=zh-CN). The full inventory with prices is in llms-full.txt.', '',
    '## Main pages', '',
    `- [Home](${absoluteUrl('/')}): Tokyo property purchase overview and search.`,
    `- [Properties for sale](${absoluteUrl('/listings')}): Published investment, residential, and land listings.`,
    `- [Buying guide](${absoluteUrl('/buying-guide')}): The basic process from criteria to closing.`,
    `- [Property insights](${absoluteUrl('/articles')}): Source-backed Tokyo property selections and comparisons.`,
    `- [Personal search](${absoluteUrl('/match')}): Save purchase criteria and review matching published listings.`,
    `- [Help center](${absoluteUrl('/help')}): Answers about searching, accounts, property chat, and buying steps.`,
    `- [About us](${absoluteUrl('/about')}): Operator, licence, content reviewer, listing and editorial rules.`, '',
    `- [Full details for AI assistants](${absoluteUrl('/llms-full.txt')})`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`, '',
  ].join('\n')
  return new Response(markdown, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
