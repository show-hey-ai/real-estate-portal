import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { ListingFilters } from '@/components/listing/listing-filters'
import { Pagination } from '@/components/common/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { matchesTransitFilters } from '@/lib/public-search'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'

interface ListingsPageProps {
  searchParams: Promise<{
    q?: string
    type?: string
    ward?: string
    line?: string
    station?: string
    prefecture?: string
    priceMin?: string
    priceMax?: string
    walkMax?: string
    areaMin?: string
    sort?: string
    page?: string
  }>
}

interface ListingRow {
  id: string
  propertyType: string | null
  price: string | number | null
  addressPublic: string | null
  stations: {
    name: string
    name_en?: string | null
    line?: string | null
    line_en?: string | null
    walk_minutes?: number | null
  }[] | null
  builtYear: number | null
  buildingArea: string | number | null
  yieldGross: string | number | null
  viewCount: number | null
  publishedAt: string | null
  media: { url: string; category: string }[] | null
}

export default async function ListingsPage({ searchParams }: ListingsPageProps) {
  const params = await searchParams
  const t = await getTranslations()
  const supabase = await createClient()
  const viewerPromise = getOptionalPublicViewer()
  const locationIndexPromise = getPublicSearchLocationIndex()

  const page = Number(params.page) || 1
  const perPage = 12

  const selectFields = `
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
    `

  // Build query
  let query = supabase
    .from('listings')
    .select(selectFields, { count: 'exact' })
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)

  // Apply filters
  if (params.q) {
    query = query.or(`addressPublic.ilike.%${params.q}%,city.ilike.%${params.q}%`)
  }
  if (params.type) {
    query = query.eq('propertyType', params.type)
  }
  if (params.ward) {
    query = query.eq('city', params.ward)
  } else if (params.prefecture) {
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

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let listings: ListingRow[] = []
  let total = 0

  const requiresManualFiltering = Boolean(params.walkMax || params.line || params.station)

  if (requiresManualFiltering) {
    const { data } = await query
    const maxWalk = params.walkMax ? Number(params.walkMax) : null
    const filteredListings = (data || []).filter((listing) => {
      const stations = listing.stations as {
        name?: string | null
        line?: string | null
        walk_minutes?: number | null
      }[] | null

      if (!matchesTransitFilters(stations, params.line, params.station)) {
        return false
      }

      if (!maxWalk) {
        return true
      }

      if (!stations || stations.length === 0) {
        return false
      }

      return stations.some((station) => station.walk_minutes != null && station.walk_minutes <= maxWalk)
    })

    total = filteredListings.length
    listings = filteredListings.slice(from, to + 1)
  } else {
    const { data, count } = await query.range(from, to)
    listings = data || []
    total = count || 0
  }

  const totalPages = Math.ceil(total / perPage)

  // Format listings for ListingCard component
  const formattedListings = (listings || []).map(listing => ({
    ...listing,
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
    media: listing.media || [],
  }))

  const [locationIndex, viewer] = await Promise.all([locationIndexPromise, viewerPromise])
  const userId = viewer?.id ?? null
  const favoriteIds = viewer
    ? await getFavoriteIdsForViewer(
        viewer.id,
        formattedListings.map((listing) => listing.id)
      )
    : new Set<string>()

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">{t('nav.listings')}</h1>

      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-20">
            <Suspense fallback={<Skeleton className="h-96" />}>
              <ListingFilters locationIndex={locationIndex} />
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
