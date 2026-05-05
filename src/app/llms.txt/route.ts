import { guideArticles } from '@/content/guides'
import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl } from '@/lib/site-config'

async function getPublishedListingCount() {
  try {
    const supabase = createServiceClient()
    const { count, error } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED')
      .eq('adAllowed', true)

    if (error) {
      console.error('Failed to count published listings for llms.txt:', error.message)
      return null
    }

    return count ?? null
  } catch (error) {
    console.error('Failed to generate llms.txt listing count:', error)
    return null
  }
}

function buildResponse(markdown: string) {
  return new Response(markdown, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

export async function GET() {
  const publishedListingCount = await getPublishedListingCount()
  const featuredGuides = guideArticles.slice(0, 3)
  const listingSummary =
    publishedListingCount != null
      ? `The portal currently exposes ${publishedListingCount} published, ad-approved hospitality property candidates.`
      : 'The portal exposes live, ad-approved hospitality property candidates.'

  const markdown = [
    '# Ziyou Hospitality',
    '',
    '> Multilingual Japan hospitality property portal for foreign investors acquiring hotels, ryokan, minpaku-ready buildings, and conversion candidates.',
    '',
    `${listingSummary} Public listing pages focus on hospitality acquisition fit, train access, price, yield, building scale, and inquiry intent.`,
    'Addresses may be partially masked on public pages for privacy. Guides are informational and do not replace legal, tax, or licensing advice.',
    '',
    '## Main Pages',
    '',
    `- [Home](${absoluteUrl('/')}): Search-first hospitality acquisition page with latest candidates and pre-purchase review positioning.`,
    `- [Listings](${absoluteUrl('/listings')}): Main pipeline page for live hospitality property candidates. Supports filters for ward, train line, station, price, walk time, and building area.`,
    `- [Guides](${absoluteUrl('/guides')}): Evergreen content for overseas buyers evaluating Japanese hospitality property and acquisition risk.`,
    '',
    '## Key Guides',
    '',
    ...featuredGuides.map((article) => {
      const content = article.locales.en
      return `- [${content.title}](${absoluteUrl(`/guides/${article.slug}`)}): ${content.seoDescription}`
    }),
    '',
    '## Optional',
    '',
    `- [LLMS full context](${absoluteUrl('/llms-full.txt')}): Expanded site summary with usage notes, guide inventory, and content interpretation hints.`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')}): Full index of canonical public URLs.`,
    `- [Robots](${absoluteUrl('/robots.txt')}): Crawl policy for search and AI crawlers.`,
    '',
  ].join('\n')

  return buildResponse(markdown)
}
