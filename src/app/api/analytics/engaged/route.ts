import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ENGAGEMENT_WINDOW_MINUTES, normalizeAnalyticsPathname } from '@/lib/site-analytics'
import { skipInternalAnalytics } from '@/lib/site-analytics-server'

const engagedSchema = z.object({
  visitorId: z.string().min(8).max(128),
  pathname: z.string().min(1).max(512),
})

/** Marks the visitor's latest view of this page as used (scrolled, tapped, clicked or typed on). */
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get('origin') !== request.nextUrl.origin) return new NextResponse(null, { status: 403 })
    const parsed = engagedSchema.safeParse(await request.json())
    if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    const excluded = await skipInternalAnalytics(request)
    if (excluded) return excluded
    const pathname = normalizeAnalyticsPathname(parsed.data.pathname)
    if (!pathname) return new NextResponse(null, { status: 204 })

    // Only a view recorded moments ago can be marked, so a forged call cannot rewrite history.
    await prisma.$executeRaw`
      UPDATE site_visit_events SET "engagedAt" = now()
      WHERE id = (
        SELECT id FROM site_visit_events
        WHERE "visitorId" = ${parsed.data.visitorId} AND pathname = ${pathname} AND "engagedAt" IS NULL
          AND "occurredAt" > now() - make_interval(mins => ${ENGAGEMENT_WINDOW_MINUTES})
        ORDER BY "occurredAt" DESC LIMIT 1
      )
    `
  } catch (error) {
    console.error('Failed to record engagement', error)
  }
  return new NextResponse(null, { status: 204 })
}
