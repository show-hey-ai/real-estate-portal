import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { LOCALE_HEADER, LOCALE_QUERY, isLocale } from '@/lib/locale-url'

const SESSION_PATHS = ['/admin', '/favorites', '/inquiry', '/chats']
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  if (SESSION_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return updateSession(request)
  }
  const requested = searchParams.get(LOCALE_QUERY)
  if (!isLocale(requested)) return NextResponse.next()
  // A language URL (from search results or hreflang) renders that language and keeps it for later pages.
  const headers = new Headers(request.headers)
  headers.set(LOCALE_HEADER, requested)
  const response = NextResponse.next({ request: { headers } })
  response.cookies.set('locale', requested, { path: '/', maxAge: LOCALE_COOKIE_MAX_AGE, sameSite: 'lax' })
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
