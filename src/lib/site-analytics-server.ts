import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './db'
import { getAdminUserFromSession } from './admin-auth'
import { ANALYTICS_INTERNAL_COOKIE, ANALYTICS_VISITOR_COOKIE, getReferrerHost, isAutomatedAnalyticsAgent, isLocalAnalyticsHost } from './site-analytics'

export async function excludeAdministratorVisitor(visitorId: string | undefined) {
  if (!visitorId || visitorId.length < 8 || visitorId.length > 128) return false
  const changed = await prisma.$executeRaw`
    INSERT INTO site_analytics_exclusions ("visitorId", reason)
    VALUES (${visitorId}, 'administrator') ON CONFLICT ("visitorId") DO NOTHING
  `
  return changed > 0
}

export function internalAnalyticsResponse(request: NextRequest) {
  const response = new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } })
  // This cookie only suppresses measurement; it never grants privileges.
  response.cookies.set(ANALYTICS_INTERNAL_COOKIE, '1', {
    path: '/', maxAge: 365 * 24 * 60 * 60, sameSite: 'lax', httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
  })
  return response
}

export async function skipInternalAnalytics(request: NextRequest, referrer?: string | null) {
  if (isLocalAnalyticsHost(request.nextUrl.hostname) || isLocalAnalyticsHost(getReferrerHost(referrer ?? request.headers.get('referer'))) || isAutomatedAnalyticsAgent(request.headers.get('user-agent'))) {
    return new NextResponse(null, { status: 204 })
  }

  // A forged opt-out cookie may suppress only this request, never another ID's history.
  if (request.cookies.get(ANALYTICS_INTERNAL_COOKIE)?.value === '1') return internalAnalyticsResponse(request)

  const hasSession = request.cookies.getAll().some(({ name }) => /^sb-.+-auth-token(?:\.\d+)?$/.test(name))
  if (hasSession && await getAdminUserFromSession()) {
    await excludeAdministratorVisitor(request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value)
    return internalAnalyticsResponse(request)
  }

  const visitorId = request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value
  if (visitorId && visitorId.length <= 128) {
    const excluded = await prisma.$queryRaw<{ excluded: boolean }[]>`
      SELECT EXISTS (SELECT 1 FROM site_analytics_exclusions WHERE "visitorId" = ${visitorId}) AS excluded
    `
    if (excluded[0]?.excluded) return internalAnalyticsResponse(request)
  }
  return null
}
