import { absoluteUrl } from '@/lib/site-config'

export function GET() {
  const markdown = [
    '# Ziyou Real Estate', '',
    'Ziyou Real Estate helps buyers look for investment property, residential homes, and land in Tokyo. The public site supports Japanese, English, Traditional Chinese, and Simplified Chinese.', '',
    'The portal lists properties for which advertising permission has been confirmed. A search result does not confirm current availability or suitability for an individual buyer. Addresses may be shortened on public pages.', '',
    'If no suitable listing is published, buyers can share their purpose, area, budget, property type, and timing with Ziyou. The buyer contact form opens a WhatsApp draft and does not send a message automatically.', '',
    '## Pages', '',
    `- [Home](${absoluteUrl('/')})`,
    `- [Properties for sale](${absoluteUrl('/listings')})`,
    `- [Buying guide](${absoluteUrl('/buying-guide')})`,
    `- [Discuss your search](${absoluteUrl('/match')})`,
    `- [Sitemap](${absoluteUrl('/sitemap.xml')})`, '',
  ].join('\n')
  return new Response(markdown, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, s-maxage=3600' } })
}
