import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getLocale, getTranslations } from 'next-intl/server'
import { JsonLd } from '@/components/common/json-ld'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { ListingFilters } from '@/components/listing/listing-filters'
import { Pagination } from '@/components/common/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { getHospitalityCategoryLabel, getHospitalityListingsCopy } from '@/lib/hospitality-copy'
import { matchesTransitFilters } from '@/lib/public-search'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import {
  absoluteUrl,
  buildListingDescription,
  buildListingTitle,
  getPrimaryListingImage,
  getSchemaLanguage,
  getSiteCopy,
} from '@/lib/site-config'
import { translateCityName, translatePropertyType, translateRailwayLine } from '@/lib/translate-fields'

interface ListingsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
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

function hasActiveSearchFilters(params: Awaited<ListingsPageProps['searchParams']>) {
  return Boolean(
    params.q ||
    params.category ||
    params.type ||
    params.ward ||
    params.line ||
    params.station ||
    params.prefecture ||
    params.priceMin ||
    params.priceMax ||
    params.walkMax ||
    params.areaMin ||
    (params.sort && params.sort !== 'newest') ||
    (params.page && params.page !== '1')
  )
}

export async function generateMetadata({
  searchParams,
}: ListingsPageProps): Promise<Metadata> {
  const [params, locale] = await Promise.all([searchParams, getLocale()])
  const siteCopy = getSiteCopy(locale)
  const activeFilters = hasActiveSearchFilters(params)
  const filterLabel = params.ward
    ? translateCityName(params.ward, locale) || params.ward
    : params.line
      ? translateRailwayLine(params.line, locale) || params.line
      : params.category
        ? getHospitalityCategoryLabel(params.category, locale) || params.category
      : params.type
        ? translatePropertyType(params.type, locale) || params.type
        : null

  const title = filterLabel
    ? `${filterLabel} - ${siteCopy.listingsTitle}`
    : siteCopy.listingsTitle
  const description = activeFilters
    ? `${siteCopy.listingsDescription} ${filterLabel ? `${filterLabel}.` : ''}`.trim()
    : siteCopy.listingsDescription

  return {
    title,
    description,
    alternates: {
      canonical: absoluteUrl('/listings'),
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl('/listings'),
      type: 'website',
    },
    twitter: {
      title,
      description,
    },
    robots: activeFilters
      ? {
          index: false,
          follow: true,
        }
      : undefined,
  }
}

interface ListingRow {
  id: string
  propertyType: string | null
  hospitalityCategory?: string | null
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
  const [t, locale] = await Promise.all([getTranslations(), getLocale()])
  const supabase = await createClient()
  const viewerPromise = getOptionalPublicViewer()
  const locationIndexPromise = getPublicSearchLocationIndex()

  const page = Number(params.page) || 1
  const perPage = 12

  const selectFields = `
      id,
      propertyType,
      hospitalityCategory,
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
  if (params.category) {
    query = query.eq('hospitalityCategory', params.category)
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
  const copy = getHospitalityListingsCopy(locale)
  const userId = viewer?.id ?? null
  const favoriteIds = viewer
    ? await getFavoriteIdsForViewer(
        viewer.id,
        formattedListings.map((listing) => listing.id)
      )
    : new Set<string>()
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: getSiteCopy(locale).listingsTitle,
    description: getSiteCopy(locale).listingsDescription,
    url: absoluteUrl('/listings'),
    inLanguage: getSchemaLanguage(locale),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: formattedListings.map((listing, index) => ({
        '@type': 'ListItem',
        position: from + index + 1,
        url: absoluteUrl(`/listings/${listing.id}`),
        name: buildListingTitle(listing, locale),
        image: getPrimaryListingImage(listing) || undefined,
        description: buildListingDescription(listing, locale),
      })),
    },
  }

  return (
    <div className="bg-[#f7f5ed]">
      <JsonLd data={itemListJsonLd} />
      <section className="border-b border-[#ded6c4] bg-[#10231e] py-10 text-white md:py-14">
        <div className="container">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-normal md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
              {copy.intro}
            </p>
          </div>
          <div className="mt-7 flex flex-wrap gap-2 text-xs text-white/75">
            <span className="rounded-[6px] border border-white/15 bg-white/[0.08] px-3 py-1.5">
              Hotel / Ryokan
            </span>
            <span className="rounded-[6px] border border-white/15 bg-white/[0.08] px-3 py-1.5">
              Minpaku-ready
            </span>
            <span className="rounded-[6px] border border-white/15 bg-white/[0.08] px-3 py-1.5">
              Conversion candidate
            </span>
            <span className="rounded-[6px] border border-white/15 bg-white/[0.08] px-3 py-1.5">
              Development land
            </span>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <Suspense fallback={<Skeleton className="h-96 rounded-[8px]" />}>
                <ListingFilters locationIndex={locationIndex} />
              </Suspense>
            </div>
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-[#5f6b65]">
                {copy.resultPrefix}: {t('search.resultsCount', { count: total })}
              </p>
            </div>

            {formattedListings.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
              <div className="rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] py-12 text-center text-[#647069]">
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
    </div>
  )
}
