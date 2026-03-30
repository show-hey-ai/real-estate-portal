export const ANALYTICS_VISITOR_COOKIE = 'tp_vid'

export type SiteAnalyticsPageType =
  | 'home'
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
