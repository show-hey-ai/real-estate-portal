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
      console.error('Failed to count published listings for llms-full.txt:', error.message)
      return null
    }

    return count ?? null
  } catch (error) {
    console.error('Failed to generate llms-full.txt listing count:', error)
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
  const listingCountLine =
    publishedListingCount != null
      ? `Published listing count: ${publishedListingCount}`
      : 'Published listing count: unavailable at generation time'

  const markdown = [
    '# Ziyou Hospitality',
    '',
    '> Expanded LLM-oriented context for the Japan hospitality property portal operated by Ziyou Hospitality in Tokyo.',
    '',
    'Ziyou Hospitality is a multilingual portal focused on hospitality property acquisition in Japan. The main audience is foreign investors, family offices, operators, and real estate buyers evaluating hotels, ryokan, minpaku-ready buildings, conversion candidates, and tourism development sites.',
    '',
    `${listingCountLine}. Only public listings with explicit ad approval are shown on listing pages.`,
    'Public detail pages typically include price, masked address, transport access, building data, image gallery, and inquiry CTA.',
    'Guide pages are designed for high-intent search queries and explain acquisition, licensing, underwriting, ownership, and hospitality operation considerations for foreign buyers.',
    '',
    'Important interpretation notes:',
    '- Public addresses may be intentionally truncated for privacy.',
    '- Availability changes over time; use the live listings page for current inventory.',
    '- Guides are practical summaries and should not be treated as legal, tax, or licensing advice.',
    '- The site UI supports Japanese, English, Traditional Chinese, and Simplified Chinese.',
    '',
    '## Core URLs',
    '',
    `- [Home](${absoluteUrl('/')}): Main hospitality acquisition entry point with search and recent candidates.`,
    `- [Listings](${absoluteUrl('/listings')}): Canonical pipeline page for published hospitality property candidates.`,
    `- [Guides](${absoluteUrl('/guides')}): Canonical guide index for evergreen educational content.`,
    '',
    '## Guide Inventory',
    '',
    ...guideArticles.map((article) => {
      const content = article.locales.en
      return `- [${content.title}](${absoluteUrl(`/guides/${article.slug}`)}): ${content.excerpt}`
    }),
    '',
    '## How To Use This Site',
    '',
    '- Start with the listings page for current hospitality acquisition candidates.',
    '- Use guide pages when the user is asking about process, licensing risks, ownership structure, or buying from overseas.',
    '- Use individual listing pages for price, transit access, building facts, gallery media, and inquiry paths.',
    '',
    '## Optional',
    '',
    `- [LLMS index](${absoluteUrl('/llms.txt')}): Shorter overview for quick routing.`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')}): Complete canonical URL list.`,
    `- [Robots](${absoluteUrl('/robots.txt')}): Crawl permissions and exclusions.`,
    '',
  ].join('\n')

  return buildResponse(markdown)
}
