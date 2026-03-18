import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { ListingFilters } from '@/components/listing/listing-filters'
import { Pagination } from '@/components/common/pagination'
import { Skeleton } from '@/components/ui/skeleton'

interface ListingsPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
    prefecture?: string
    priceMin?: string
    priceMax?: string
    walkMax?: string
    areaMin?: string
    sort?: string
    page?: string
  }>
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams
  const t = await getTranslations()
  const supabase = await createClient()

  const page = Number(params.page) || 1
  const perPage = 12

  // Build query
  let query = supabase
    .from('listings')
    .select(`
      id,
      propertyType,
      price,
      addressPublic,
      stations,
      builtYear,
      buildingArea,
      yieldGross,
      viewCount,
      publishedAt,
      media (url, category)
    `, { count: 'exact' })
    .eq('status', 'PUBLISHED')

  // Apply filters
  if (params.q) {
    query = query.or(`addressPublic.ilike.%${params.q}%,city.ilike.%${params.q}%`)
  }
  if (params.type) {
    query = query.eq('propertyType', params.type)
  }
  if (params.prefecture) {
    query = query.eq('prefecture', params.prefecture)
  }
  if (params.priceMin) {
    query = query.gte('price', params.priceMin)
  }
  if (params.priceMax) {
    query = query.lte('price', params.priceMax)
  }
  if (params.areaMin) {
    query = query.gte('buildingArea', params.areaMin)
  }

  // Apply sorting
  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'yield_desc':
      query = query.order('yieldGross', { ascending: false, nullsFirst: false })
      break
    default:
      query = query.order('createdAt', { ascending: false })
  }

  // Apply pagination
  const from = (page - 1) * perPage
  const to = from + perPage - 1
  query = query.range(from, to)

  const { data: listings, count } = await query
  const total = count || 0
  const totalPages = Math.ceil(total / perPage)

  // Get authenticated user and their favorites
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let userId: string | null = null
  let favoriteIds: Set<string> = new Set()

  if (authUser) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email!)
      .single()

    if (dbUser) {
      userId = dbUser.id
      const { data: favorites } = await supabase
        .from('favorites')
        .select('listingId')
        .eq('userId', dbUser.id)

      if (favorites) {
        favoriteIds = new Set(favorites.map(f => f.listingId))
      }
    }
  }

  // Filter by walkMax (post-query filtering for JSONB stations)
  let filteredListings = listings || []
  if (params.walkMax) {
    const maxWalk = Number(params.walkMax)
    filteredListings = filteredListings.filter(listing => {
      const stations = listing.stations as { walk_minutes?: number | null }[] | null
      if (!stations || stations.length === 0) return false
      // Check if any station has walk_minutes <= maxWalk
      return stations.some(s => s.walk_minutes != null && s.walk_minutes <= maxWalk)
    })
  }

  // Format listings for ListingCard component
  const formattedListings = filteredListings.map(listing => ({
    ...listing,
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
  }))

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('nav.listings')}</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Suspense fallback={<Skeleton className="h-96" />}>
              <ListingFilters />
            </Suspense>
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {t('search.resultsCount', { count: total })}
            </p>
          </div>

          {formattedListings.length > 0 ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {formattedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.has(listing.id)}
                  userId={userId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t('search.noResults')}
            </div>
          )}

          <div className="mt-8">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              baseUrl="/listings"
              searchParams={params}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
