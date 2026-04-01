import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { Button } from '@/components/ui/button'
import { Heart, Search } from 'lucide-react'

export default async function FavoritesPage() {
  const t = await getTranslations('favorites')
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/favorites')
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
    select: { id: true },
  })

  if (!dbUser) {
    redirect('/login?redirect=/favorites')
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: dbUser.id },
    include: {
      listing: {
        include: {
          media: {
            where: { isAdopted: true },
            orderBy: { sortOrder: 'asc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Filter out non-published listings
  const publishedFavorites = favorites.filter(
    (fav) => fav.listing.status === 'PUBLISHED' && fav.listing.adAllowed
  )

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        {publishedFavorites.length > 0 && (
          <p className="text-muted-foreground">
            {t('count', { count: publishedFavorites.length })}
          </p>
        )}
      </div>

      {publishedFavorites.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {publishedFavorites.map((fav) => (
            <ListingCard
              key={fav.id}
              listing={{
                ...fav.listing,
                buildingArea: fav.listing.buildingArea ? Number(fav.listing.buildingArea) : null,
                yieldGross: fav.listing.yieldGross ? Number(fav.listing.yieldGross) : null,
                stations: fav.listing.stations as { name: string; line?: string | null; walk_minutes?: number | null }[] | null,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('empty')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('emptyDescription')}
          </p>
          <Link href="/listings">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              {t('browseListings')}
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
