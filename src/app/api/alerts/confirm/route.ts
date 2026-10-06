import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

const bodySchema = z.object({ token: z.string().min(32).max(128) })

/** Confirmation is a POST from the confirm page, so link scanners that open emails cannot subscribe anyone. */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ success: false }, { status: 403 })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ success: false }, { status: 400 }) }
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false }, { status: 400 })
  try {
    const result = await prisma.listingAlertSubscription.updateMany({
      where: { token: parsed.data.token, status: { in: ['pending', 'active'] } },
      data: { status: 'active', confirmedAt: new Date() },
    })
    return NextResponse.json({ success: result.count > 0 }, { status: result.count > 0 ? 200 : 404 })
  } catch (error) {
    console.error('Failed to confirm listing alerts:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
