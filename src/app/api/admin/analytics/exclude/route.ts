import { NextRequest, NextResponse } from 'next/server'
import { requireAdminUser } from '@/lib/admin-auth'
import { ANALYTICS_VISITOR_COOKIE } from '@/lib/site-analytics'
import { excludeAdministratorVisitor, internalAnalyticsResponse } from '@/lib/site-analytics-server'

export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return new NextResponse(null, { status: 403 })
  const auth = await requireAdminUser()
  if (!auth.ok) return auth.response
  await excludeAdministratorVisitor(request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value)
  return internalAnalyticsResponse(request)
}
