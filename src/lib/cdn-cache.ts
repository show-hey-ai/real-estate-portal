import { LOCALE_QUERY, isLocale } from './locale-url'
import { defaultLocale } from '@/i18n/config'

/**
 * Public pages render on every request (Fluid Active CPU, billed on Vercel Pro since 2026-10-28).
 * Anonymous pages whose language is fixed by the URL are the same for everyone, so the CDN keeps
 * them: a property page ten minutes (its price and sale status matter), lists, areas, stations and
 * guides an hour. The header is set in next.config.ts (keep the values and personal paths in step);
 * the proxy applies the redirect. Every deployment empties the CDN cache.
 */
export const CDN_CACHE_HEADER = 'Vercel-CDN-Cache-Control'
export const CDN_CACHE_VALUE = 'max-age=3600, stale-while-revalidate=3600'
export const CDN_CACHE_LISTING_VALUE = 'max-age=600, stale-while-revalidate=600'

// Pages that depend on the visitor (forms, saved items, sign-in) or are never meant for search.
const PERSONAL = /^\/(?:admin|favorites|mypage|inquiry|chats|login|register|match|alerts|preview|compare|auth)(?:\/|$)/

export type CachePlan = { action: 'cache' } | { action: 'none' } | { action: 'redirect'; location: string }

export interface CacheRequest {
  method: string
  pathname: string
  search: string
  cookieNames: string[]
  localeCookie: string | null
}

const signedIn = (names: string[]) =>
  names.some((name) => name.startsWith('sb-') && /auth-token|access-token|refresh-token/.test(name))

export function publicCachePlan(request: CacheRequest): CachePlan {
  if (!['GET', 'HEAD'].includes(request.method) || PERSONAL.test(request.pathname) || signedIn(request.cookieNames)) return { action: 'none' }
  const params = new URLSearchParams(request.search)
  if (isLocale(params.get(LOCALE_QUERY))) return { action: 'cache' }
  // A plain URL is English for everyone; a visitor who chose another language goes to its URL.
  if (isLocale(request.localeCookie) && request.localeCookie !== defaultLocale) {
    params.set(LOCALE_QUERY, request.localeCookie)
    return { action: 'redirect', location: `${request.pathname}?${params.toString()}` }
  }
  return { action: 'cache' }
}
