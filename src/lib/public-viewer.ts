import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'

interface PublicViewer {
  id: string
  email: string
  role: string
}

function hasSupabaseSessionCookie(cookieNames: string[]) {
  return cookieNames.some(
    (name) =>
      name.startsWith('sb-') &&
      (name.includes('auth-token') || name.includes('access-token') || name.includes('refresh-token'))
  )
}

export async function getOptionalPublicViewer(): Promise<PublicViewer | null> {
  const cookieStore = await cookies()

  if (!hasSupabaseSessionCookie(cookieStore.getAll().map((cookie) => cookie.name))) {
    return null
  }

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    return null
  }

  return prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, role: true },
  })
}

export async function getFavoriteIdsForViewer(userId: string, listingIds: string[]) {
  if (listingIds.length === 0) {
    return new Set<string>()
  }

  const favorites = await prisma.favorite.findMany({
    where: {
      userId,
      listingId: { in: listingIds },
    },
    select: { listingId: true },
  })

  return new Set(favorites.map((favorite) => favorite.listingId))
}

export async function getIsFavoriteForViewer(userId: string, listingId: string) {
  const favoriteCount = await prisma.favorite.count({
    where: {
      userId,
      listingId,
    },
  })

  return favoriteCount > 0
}
