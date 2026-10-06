import { absoluteUrl } from '@/lib/site-config'

export function GET() {
  const markdown = [
    '# Ziyou Real Estate', '',
    'Ziyou Real Estate helps buyers look for investment property, residential homes, and land in Tokyo. The public site supports Japanese, English, Traditional Chinese, and Simplified Chinese.', '',
    'The portal lists properties for which advertising permission has been confirmed. A search result does not confirm current availability or suitability for an individual buyer. Addresses may be shortened on public pages.', '',
    'Signed-in buyers can save their purpose, budget, wards, property type, timing and other criteria on the personal search page. Saved criteria are rechecked against published listings, and matches are shown with matched, unmatched and unconfirmed points. The match score compares entered criteria only; it is not a loan, eligibility, yield or availability decision.', '',
    'Questions about a specific property start in that listing\'s private property chat. Buyers who prefer messaging can also open a WhatsApp draft from the personal search page; nothing is sent automatically.', '',
    '## Pages', '',
    `- [Home](${absoluteUrl('/')})`,
    `- [Properties for sale](${absoluteUrl('/listings')})`,
    `- [Buying guide](${absoluteUrl('/buying-guide')})`,
    `- [Personal search and saved criteria](${absoluteUrl('/match')})`,
    `- [Articles](${absoluteUrl('/articles')})`,
    `- [Help center](${absoluteUrl('/help')})`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`, '',
  ].join('\n')
  return new Response(markdown, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
