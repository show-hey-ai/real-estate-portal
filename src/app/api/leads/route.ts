import { NextRequest, NextResponse } from 'next/server'
import { ContactMethod } from '@prisma/client'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

const leadRequestSchema = z.object({
  listingId: z.string().trim().min(1),
  contactMethod: z.nativeEnum(ContactMethod),
  contactValue: z.string().trim().min(1),
  message: z.string().trim().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: authUser.email! },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const parsed = leadRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid inquiry payload' }, { status: 400 })
    }

    const listing = await prisma.listing.findFirst({
      where: {
        id: parsed.data.listingId,
        status: 'PUBLISHED',
        adAllowed: true,
      },
      select: { id: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const lead = await prisma.lead.create({
      data: {
        userId: dbUser.id,
        listingId: parsed.data.listingId,
        contactMethod: parsed.data.contactMethod,
        contactValue: parsed.data.contactValue,
        message: parsed.data.message || null,
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    )
  }
}
