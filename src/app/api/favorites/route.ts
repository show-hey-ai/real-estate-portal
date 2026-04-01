import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

const favoriteRequestSchema = z.object({
  listingId: z.string().trim().min(1),
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
    const parsed = favoriteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
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

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_listingId: {
          userId: dbUser.id,
          listingId: parsed.data.listingId,
        },
      },
      update: {},
      create: {
        userId: dbUser.id,
        listingId: parsed.data.listingId,
      },
    })

    return NextResponse.json(favorite)
  } catch (error) {
    console.error('Favorite creation error:', error)
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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
    const parsed = favoriteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid listingId' }, { status: 400 })
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: dbUser.id,
        listingId: parsed.data.listingId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorite deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    )
  }
}
