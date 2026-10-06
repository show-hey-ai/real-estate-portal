import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ANALYTICS_VISITOR_COOKIE } from '@/lib/site-analytics'
import { skipInternalAnalytics } from '@/lib/site-analytics-server'

const eventSchema = z.object({
  locale: z.string().max(16).optional(),
  search: z.string().max(500).optional(),
  // Direct-contact buttons on listing pages report the listing and the channel used.
  listingId: z.string().regex(/^[A-Za-z0-9-]{8,64}$/).optional(),
  channel: z.enum(['whatsapp', 'email', 'phone']).optional(),
}).strict()

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) return new NextResponse(null, { status: 403 })
  let body: unknown
  try { body = await request.json() } catch { return new NextResponse(null, { status: 400 }) }
  const parsed = eventSchema.safeParse(body)
  if (!parsed.success) return new NextResponse(null, { status: 400 })

  const search = new URLSearchParams(parsed.data.search?.replace(/^\?/, '') || '')
  try {
    const excluded = await skipInternalAnalytics(request)
    if (excluded) return excluded
    await prisma.siteVisitEvent.create({ data: {
      visitorId: request.cookies.get(ANALYTICS_VISITOR_COOKIE)?.value?.slice(0, 128) || crypto.randomUUID(),
      pathname: parsed.data.listingId ? `/listings/${parsed.data.listingId}` : '/match',
      queryString: parsed.data.channel ? `channel=${parsed.data.channel}` : null,
      pageType: 'contact_click',
      locale: parsed.data.locale || null,
      utmSource: search.get('utm_source')?.slice(0, 100) || null,
      utmMedium: search.get('utm_medium')?.slice(0, 100) || null,
      utmCampaign: search.get('utm_campaign')?.slice(0, 100) || null,
      listingId: parsed.data.listingId && await prisma.listing.findUnique({ where: { id: parsed.data.listingId }, select: { id: true } }) ? parsed.data.listingId : null,
    } })
  } catch (error) {
    console.error('Failed to record contact click:', error)
  }
  return new NextResponse(null, { status: 204 })
}
