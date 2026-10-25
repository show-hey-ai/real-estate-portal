import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// CDN caching for anonymous public pages (see src/lib/cdn-cache.ts). The header must be on the
// page response itself; set from the proxy it only reaches the browser, after the CDN.
// Signed-in visitors carry the Supabase session cookie (possibly split into .0/.1 chunks) and are never cached.
const supabaseRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
const signedInCookies = supabaseRef ? ['', '.0', '.1', '.2'].map((suffix) => ({ type: 'cookie' as const, key: `sb-${supabaseRef}-auth-token${suffix}` })) : null

const nextConfig: NextConfig = {
  // Put metadata in <head> for every client, not only the bots Next.js recognises, so AI crawlers read descriptions.
  htmlLimitedBots: /.*/,
  serverExternalPackages: ['pdf-to-img', 'sharp'],
  turbopack: {
    root: projectRoot,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.claude/worktrees/**',
          '**/playwright-report/**',
          '**/test-results/**',
          '**/screenshots/**',
        ],
      }
    }

    return config
  },
  async headers() {
    if (!signedInCookies) return []
    return [{
      // Every public page except personal ones; a plain URL is always English (the proxy sends
      // visitors who chose another language to its ?lang= URL before the cache).
      source: '/((?!admin|favorites|inquiry|chats|login|register|match|alerts|preview|compare|auth|api/|_next/).*)',
      missing: signedInCookies,
      headers: [{ key: 'Vercel-CDN-Cache-Control', value: 'max-age=600, stale-while-revalidate=600' }],
    }]
  },
  // Retired hospitality-era pages that still receive search impressions.
  async redirects() {
    return [
      { source: '/hotel-airbnb-checklist', destination: '/buying-guide', permanent: true },
      { source: '/hotel-lp.html', destination: '/', permanent: true },
      { source: '/hotel-lp/:path*', destination: '/', permanent: true },
      { source: '/youtube', destination: '/', permanent: true },
      { source: '/checklists/:path*', destination: '/buying-guide', permanent: true },
      // Production aliases on vercel.app (two projects build this repo) duplicate the site; send them to the canonical domain.
      { source: '/:path*', has: [{ type: 'host', value: 'real-estate-portal-omega.vercel.app' }], destination: 'https://portal.ziyou-fudosan.com/:path*', permanent: true },
      { source: '/:path*', has: [{ type: 'host', value: 'portal-psi-virid.vercel.app' }], destination: 'https://portal.ziyou-fudosan.com/:path*', permanent: true },
    ]
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hlvtehtdvjyklxqoecld.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'fnxibittudgldhyoiacj.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
