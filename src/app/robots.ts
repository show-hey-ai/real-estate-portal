import type { MetadataRoute } from 'next'
import { absoluteUrl, getSiteUrl } from '@/lib/site-config'

export default function robots(): MetadataRoute.Robots {
  const disallow = ['/admin/', '/api/', '/favorites', '/login', '/preview/', '/register']

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow,
      },
      {
        // OpenAI recommends allowing OAI-SearchBot to surface sites in ChatGPT search.
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow,
      },
      {
        // Keep training opt-in separate from search visibility.
        userAgent: 'GPTBot',
        disallow: '/',
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: getSiteUrl(),
  }
}
