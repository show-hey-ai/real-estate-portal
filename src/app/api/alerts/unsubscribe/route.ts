import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/

/**
 * Unsubscribes by token. Accepts the token in the query (RFC 8058 one-click from mail clients)
 * or in a JSON body (the unsubscribe page).
 */
export async function POST(request: NextRequest) {
  let token = request.nextUrl.searchParams.get('token') || ''
  if (!token && request.headers.get('content-type')?.includes('application/json')) {
    try { token = String(((await request.json()) as { token?: unknown }).token || '') } catch { token = '' }
  }
  if (!TOKEN_PATTERN.test(token)) return NextResponse.json({ success: false }, { status: 400 })
  try {
    await prisma.listingAlertSubscription.updateMany({
      where: { token, status: { not: 'unsubscribed' } },
      data: { status: 'unsubscribed', unsubscribedAt: new Date() },
    })
    // Already unsubscribed or unknown tokens get the same answer.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to unsubscribe listing alerts:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
