import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { getLocale, getTranslations } from 'next-intl/server'
import { ArrowRight, SearchX } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { ListingFilters } from '@/components/listing/listing-filters'
import { Pagination } from '@/components/common/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { getPortalCategoryLabel, getPortalListingsCopy } from '@/lib/portal-copy'
import { getMarketCategory, isMarketCategory, isPublicPropertyType, PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
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
  const filterLabel = isMarketCategory(params.category) ? getPortalCategoryLabel(locale, params.category) : params.ward
    ? translateCityName(params.ward, locale) || params.ward
    : params.line
      ? translateRailwayLine(params.line, locale) || params.line
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
    title: { absolute: title },
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
  landArea: string | number | null
  zoning: string | null
  currentStatus: string | null
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

  const page = Math.max(1, Number.parseInt(params.page || '1', 10) || 1)
  const perPage = 12
  const category = isMarketCategory(params.category) ? params.category : null

  const selectFields = `
      id,
      propertyType,
      hospitalityCategory,
      price,
      addressPublic,
      stations,
      builtYear,
      buildingArea,
      landArea,
      zoning,
      currentStatus,
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
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)

  // Apply filters
  const safeKeyword = params.q?.replace(/[^\p{L}\p{N}\s\-]/gu, '').trim().slice(0, 80)
  if (safeKeyword) {
    query = query.or(`addressPublic.ilike.%${safeKeyword}%,city.ilike.%${safeKeyword}%`)
  }
  if (isPublicPropertyType(params.type)) {
    query = query.eq('propertyType', params.type)
  }
  if (params.ward) {
    query = query.eq('city', params.ward)
  } else if (params.prefecture) {
    query = query.eq('prefecture', params.prefecture)
  }
  if (params.priceMin && /^\d{1,12}$/u.test(params.priceMin)) {
    query = query.gte('price', params.priceMin)
  }
  if (params.priceMax && /^\d{1,12}$/u.test(params.priceMax)) {
    query = query.lte('price', params.priceMax)
  }
  if (params.areaMin && /^\d{1,6}$/u.test(params.areaMin) && (isPublicPropertyType(params.type) || category === 'land')) {
    query = query.gte(params.type === '土地' || category === 'land' ? 'landArea' : 'buildingArea', params.areaMin)
  }

  // Apply sorting
  switch (params.sort) {
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    default:
      query = query.order('createdAt', { ascending: false })
  }

  const from = (page - 1) * perPage
  const to = from + perPage - 1

  let listings: ListingRow[] = []
  let total = 0

  const requiresManualFiltering = Boolean(category || params.walkMax || params.line || params.station || (params.areaMin && !params.type))

  if (requiresManualFiltering) {
    const candidates: ListingRow[] = []
    const batchSize = 500
    for (let start = 0; ; start += batchSize) {
      const { data, error } = await query.range(start, start + batchSize - 1)
      if (error) { console.error('Failed to load filtered listings:', error); break }
      candidates.push(...(data || []))
      if (!data || data.length < batchSize) break
    }
    const maxWalk = params.walkMax ? Number(params.walkMax) : null
    const minArea = params.areaMin ? Number(params.areaMin) : null
    const filteredListings = candidates.filter((listing) => {
      if (category && getMarketCategory(listing) !== category) return false
      if (minArea && Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea) < minArea) return false
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
    landArea: listing.landArea ? Number(listing.landArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
    media: listing.media || [],
  }))

  const [locationIndex, viewer] = await Promise.all([locationIndexPromise, viewerPromise])
  const copy = getPortalListingsCopy(locale)
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
    <div data-testid="listings-page" className="bg-white text-[#1b293a]">
      <JsonLd data={itemListJsonLd} />
      <section className="border-b border-[#dbe2e9] bg-[#f5f7f9] py-12 md:py-16">
        <div className="container">
          <div className="max-w-4xl">
            <p className="mb-4 text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">ZIYOU / PROPERTIES</p>
            <h1 className="text-4xl font-medium tracking-tight md:text-5xl">
              {copy.title}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#657487] md:text-base">
              {copy.intro}
            </p>
          </div>
        </div>
      </section>

      <div className="container py-8 md:py-10">
        <div className="grid gap-8 lg:grid-cols-4">
          <aside data-testid="listing-filters" className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <Suspense fallback={<Skeleton className="h-96 rounded-[8px]" />}>
                <ListingFilters locationIndex={locationIndex} />
              </Suspense>
            </div>
          </aside>

          <div data-testid="listings-results" className="lg:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm font-medium text-[#657487]">
                {copy.resultPrefix}: {t('search.resultsCount', { count: total })}
              </p>
            </div>

            {formattedListings.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {formattedListings.map((listing, index) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorite={favoriteIds.has(listing.id)}
                    userId={userId}
                    imagePriority={index === 0}
                  />
                ))}
              </div>
            ) : (
              <div data-testid="listings-empty-state" className="border-y border-[#dbe2e9] bg-white px-6 py-16 text-center text-[#657487]">
                <div className="mx-auto flex h-12 w-12 items-center justify-center bg-[#e9f0f7] text-[#274d7d]">
                  <SearchX className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-lg font-medium text-[#1b293a]">{copy.emptyTitle}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6">{copy.emptyDescription}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link href="/listings" className="inline-flex h-10 items-center gap-2 rounded-[4px] border border-[#cbd5df] px-4 text-sm font-semibold text-[#1b293a] transition-colors hover:bg-[#f5f7f9]">
                    {t('search.clearFilters')}
                  </Link>
                  <Link href={category ? `/match?purpose=${category}` : '/match'} className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[#274d7d] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#18375f]">
                    {copy.emptyCta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
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
