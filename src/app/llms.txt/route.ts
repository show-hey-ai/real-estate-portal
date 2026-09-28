import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'

export async function GET() {
  let count: number | null = null
  try {
    const result = await createServiceClient().from('listings').select('*', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED').eq('adAllowed', true)
      .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    if (!result.error) count = result.count
  } catch { /* Inventory count can be unavailable without affecting the page. */ }

  const markdown = [
    '# Ziyou Real Estate', '',
    '> Multilingual portal for buying investment property, a home, or land in Tokyo, Japan.', '',
    count == null ? 'See the live listings page for current properties.' : `Currently published properties: ${count}.`,
    'Only listings with advertising permission are shown. Availability may change; ask the brokerage to confirm.', '',
    '## Main pages', '',
    `- [Home](${absoluteUrl('/')}): Tokyo property purchase overview and search.`,
    `- [Properties for sale](${absoluteUrl('/listings')}): Published investment, residential, and land listings.`,
    `- [Buying guide](${absoluteUrl('/buying-guide')}): The basic process from criteria to closing.`,
    `- [Discuss your search](${absoluteUrl('/match')}): Share purchase purpose, area, budget, property type, and timing with Ziyou.`, '',
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`, '',
  ].join('\n')
  return new Response(markdown, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
