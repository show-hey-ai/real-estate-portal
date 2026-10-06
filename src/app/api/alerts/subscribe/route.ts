import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { criteriaFrom, newAlertToken, subscribeSchema } from '@/lib/listing-alerts'

/** A repeat sign-up within this window does not reissue the confirmation mail. */
const RESEND_WINDOW_MS = 10 * 60_000

// The response never reveals whether an address was already registered.
const accepted = () => NextResponse.json({ success: true })

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false }, { status: 403 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ success: false }, { status: 400 }) }
  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false }, { status: 400 })
  const { email, locale } = parsed.data
  const criteria = criteriaFrom(parsed.data)
  try {
    const existing = await prisma.listingAlertSubscription.findUnique({ where: { email } })
    if (!existing) {
      await prisma.listingAlertSubscription.create({ data: { email, locale, criteria: { ...criteria }, token: newAlertToken() } })
      return accepted()
    }
    if (existing.status === 'active') {
      // Active subscribers can change their filters without confirming again.
      await prisma.listingAlertSubscription.update({ where: { email }, data: { locale, criteria: { ...criteria } } })
      return accepted()
    }
    const recentlySent = existing.confirmationSentAt && Date.now() - existing.confirmationSentAt.getTime() < RESEND_WINDOW_MS
    if (recentlySent) return accepted()
    await prisma.listingAlertSubscription.update({
      where: { email },
      data: { locale, criteria: { ...criteria }, status: 'pending', token: newAlertToken(), confirmationSentAt: null, unsubscribedAt: null },
    })
    return accepted()
  } catch (error) {
    console.error('Failed to save listing alert sign-up:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
