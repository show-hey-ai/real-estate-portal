export const ANALYTICS_VISITOR_COOKIE = 'tp_vid'
export const ANALYTICS_INTERNAL_COOKIE = 'tp_internal'

export function isLocalAnalyticsHost(host: string | null | undefined) {
  if (!host) return false
  const normalized = host.toLowerCase().replace(/^\[|\]$/g, '')
  return normalized === 'localhost' || normalized.endsWith('.localhost') || normalized === '::1' || /^127\.\d+\.\d+\.\d+$/.test(normalized)
}

export function isAutomatedAnalyticsAgent(userAgent: string | null) {
  return !!userAgent && /bot\b|crawler|spider|HeadlessChrome|Playwright|Ziyou-Autonomy/i.test(userAgent)
}

export type SiteAnalyticsPageType =
  | 'home'
  | 'youtube_landing'
  | 'listing_index'
  | 'listing_detail'
  | 'favorites'
  | 'other'

export function normalizeAnalyticsPathname(pathname: string | null | undefined) {
  if (!pathname) return null
  if (!pathname.startsWith('/')) return null

  return pathname.replace(/\/+$/, '') || '/'
}

export function getSiteAnalyticsPageType(pathname: string): SiteAnalyticsPageType {
  if (pathname === '/') return 'home'
  if (pathname === '/youtube') return 'youtube_landing'
  if (pathname === '/listings') return 'listing_index'
  if (pathname.startsWith('/listings/')) return 'listing_detail'
  if (pathname === '/favorites') return 'favorites'
  return 'other'
}

export function extractListingIdFromPath(pathname: string) {
  const match = pathname.match(/^\/listings\/([^/?#]+)$/)
  return match?.[1] ?? null
}

export function getReferrerHost(referrerUrl: string | null | undefined) {
  if (!referrerUrl) return null

  try {
    const url = new URL(referrerUrl)
    return url.hostname.replace(/^www\./, '') || null
  } catch {
    return null
  }
}

export function isBotReferrer(referrerHost: string | null | undefined) {
  if (!referrerHost) return false
  return /(crawler|spider|bot)\b/i.test(referrerHost)
}
