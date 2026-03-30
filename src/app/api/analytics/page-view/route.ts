import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import {
  extractListingIdFromPath,
  getReferrerHost,
  getSiteAnalyticsPageType,
  isBotReferrer,
  normalizeAnalyticsPathname,
} from '@/lib/site-analytics'

const pageViewSchema = z.object({
  visitorId: z.string().min(8).max(128),
  pathname: z.string().min(1).max(512),
  search: z.string().max(2000).optional().nullable(),
  locale: z.string().max(16).optional().nullable(),
  referrer: z.string().max(2000).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = pageViewSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const pathname = normalizeAnalyticsPathname(parsed.data.pathname)
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return new NextResponse(null, { status: 204 })
    }

    const search = parsed.data.search?.startsWith('?')
      ? parsed.data.search
      : parsed.data.search
        ? `?${parsed.data.search}`
        : null

    const query = new URLSearchParams(search?.slice(1) ?? '')
    const referrerHost = getReferrerHost(parsed.data.referrer)

    if (isBotReferrer(referrerHost)) {
      return new NextResponse(null, { status: 204 })
    }

    const listingId = extractListingIdFromPath(pathname)
    const data = {
      visitorId: parsed.data.visitorId,
      pathname,
      queryString: search,
      pageType: getSiteAnalyticsPageType(pathname),
      locale: parsed.data.locale || null,
      referrerUrl: parsed.data.referrer || null,
      referrerHost,
      utmSource: query.get('utm_source'),
      utmMedium: query.get('utm_medium'),
      utmCampaign: query.get('utm_campaign'),
      utmTerm: query.get('utm_term'),
      utmContent: query.get('utm_content'),
      listingId,
    }

    try {
      await prisma.siteVisitEvent.create({ data })
    } catch (error) {
      if (!listingId) throw error
      await prisma.siteVisitEvent.create({
        data: {
          ...data,
          listingId: null,
        },
      })
    }
  } catch (error) {
    console.error('Failed to record page view', error)
  }

  return new NextResponse(null, { status: 204 })
}
