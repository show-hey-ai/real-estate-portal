import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { LOCALE_HEADER, LOCALE_QUERY, isLocale } from '@/lib/locale-url'
import { CDN_CACHE_HEADER, CDN_CACHE_VALUE, publicCachePlan } from '@/lib/cdn-cache'

const SESSION_PATHS = ['/admin', '/favorites', '/inquiry', '/chats']

export async function proxy(request: NextRequest) {
  const { pathname, searchParams, search } = request.nextUrl
  if (SESSION_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return updateSession(request)
  }
  const plan = publicCachePlan({
    method: request.method,
    pathname,
    search,
    cookieNames: request.cookies.getAll().map((cookie) => cookie.name),
    localeCookie: request.cookies.get('locale')?.value ?? null,
  })
  if (plan.action === 'redirect') return NextResponse.redirect(new URL(plan.location, request.url), 307)

  const requested = searchParams.get(LOCALE_QUERY)
  const headers = new Headers(request.headers)
  // A language URL (from search results or hreflang) renders that language. The browser
  // remembers it for later pages (LocaleMemory); a Set-Cookie here would stop the CDN caching the page.
  if (isLocale(requested)) headers.set(LOCALE_HEADER, requested)
  const response = NextResponse.next({ request: { headers } })
  if (plan.action === 'cache') response.headers.set(CDN_CACHE_HEADER, CDN_CACHE_VALUE)
  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/favorites/:path*',
    '/inquiry/:path*',
    '/chats/:path*',
    // Public pages, excluding Next.js assets, API routes and files with an extension.
    '/((?!_next/|api/|.*\\..*).*)',
  ],
}
