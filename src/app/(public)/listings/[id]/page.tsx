import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { JsonLd } from '@/components/common/json-ld'
import { createServiceClient } from '@/lib/supabase/server'
import { ListingGallery } from '@/components/listing/listing-gallery'
import { ListingSpecs } from '@/components/listing/listing-specs'
import { InquiryButton } from '@/components/listing/inquiry-button'
import { FavoriteButton } from '@/components/listing/favorite-button'
import { ViewTracker } from '@/components/listing/view-tracker'
import { formatPrice } from '@/lib/format'
import { MapPin, Train, Info, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExclusiveCta } from '@/components/listing/exclusive-cta'
import { formatPublicAddress } from '@/lib/address'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import { formatTransitAccessLabel, translateAddress } from '@/lib/translate-fields'
import { getIsFavoriteForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import {
  absoluteUrl,
  buildListingDescription,
  buildListingTitle,
  getOpenGraphLocale,
  getPrimaryListingImage,
  getSchemaLanguage,
} from '@/lib/site-config'

interface ListingPageProps {
  params: Promise<{ id: string }>
}

async function getPublicListing(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      media (*)
    `)
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

export async function generateMetadata({
  params,
}: ListingPageProps): Promise<Metadata> {
  const [{ id }, locale] = await Promise.all([params, getLocale()])
  const listing = await getPublicListing(id)

  if (!listing) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = buildListingTitle(listing, locale)
  const description = buildListingDescription(listing, locale)
  const image = getPrimaryListingImage(listing)
  const url = absoluteUrl(`/listings/${id}`)
  const keywords = [
    'Japan hospitality property',
    'Japan hotel acquisition',
    'Japan ryokan property',
    'Japan minpaku property',
    listing.propertyType,
    listing.city,
    ...(Array.isArray(listing.stations)
      ? listing.stations.flatMap((station: { name?: string | null; line?: string | null }) => [station.name, station.line])
      : []),
  ].filter((value): value is string => Boolean(value))

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      locale: getOpenGraphLocale(locale),
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params
  const [t, locale] = await Promise.all([getTranslations('listing'), getLocale()])
  const viewerPromise = getOptionalPublicViewer()

  // 物件情報を取得
  const listing = await getPublicListing(id)

  if (!listing) {
    notFound()
  }

  // メディアをソート（isAdoptedがtrue、sortOrder順）
  const sortedMedia = (listing.media || [])
    .filter((m: { isAdopted: boolean }) => m.isAdopted)
    .sort((a: { sortOrder: number }, b: { sortOrder: number }) => (a.sortOrder || 0) - (b.sortOrder || 0))

  const viewer = await viewerPromise
  const userId = viewer?.id ?? null
  const isFavorite = viewer ? await getIsFavoriteForViewer(viewer.id, id) : false

  const publicAddress = formatPublicAddress(listing.addressPublic).publicAddress || listing.addressPublic
  const stations = normalizeTransitStations(
    listing.stations as { name: string; name_en?: string | null; line?: string | null; line_en?: string | null; walk_minutes?: number | null }[] | null
  )
  const features = (listing.features as string[]) || []

  // 言語に応じた説明文を取得
  const getDescription = () => {
    switch (locale) {
      case 'en':
        return listing.descriptionEn || listing.descriptionJa
      case 'zh-TW':
        return listing.descriptionZhTw || listing.descriptionJa
      case 'zh-CN':
        return listing.descriptionZhCn || listing.descriptionJa
      default:
        return listing.descriptionJa
    }
  }
  const description = getDescription()

  // Prisma互換の形式に変換
  const formattedListing = {
    ...listing,
    addressPublic: publicAddress,
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    landArea: listing.landArea ? Number(listing.landArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
    yieldNet: listing.yieldNet ? Number(listing.yieldNet) : null,
    media: sortedMedia,
  }
  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: buildListingTitle(formattedListing, locale),
    description: buildListingDescription(formattedListing, locale),
    url: absoluteUrl(`/listings/${listing.id}`),
    inLanguage: getSchemaLanguage(locale),
    datePublished: listing.publishedAt || undefined,
    dateModified: listing.updatedAt || undefined,
    mainEntity: {
      '@type': formattedListing.propertyType === '戸建' ? 'SingleFamilyResidence' : 'Residence',
      name: buildListingTitle(formattedListing, locale),
      description: buildListingDescription(formattedListing, locale),
      address: {
        '@type': 'PostalAddress',
        addressRegion: listing.prefecture || 'Tokyo',
        addressLocality: listing.city || undefined,
        streetAddress: publicAddress || undefined,
        addressCountry: 'JP',
      },
      floorSize: formattedListing.buildingArea
        ? {
            '@type': 'QuantitativeValue',
            value: formattedListing.buildingArea,
            unitCode: 'MTK',
          }
        : undefined,
      numberOfFloors: formattedListing.floorCount || undefined,
      yearBuilt: formattedListing.builtYear || undefined,
      additionalProperty: [
        formattedListing.propertyType
          ? {
              '@type': 'PropertyValue',
              name: 'Property type',
              value: formattedListing.propertyType,
            }
          : null,
        formattedListing.currentStatus
          ? {
              '@type': 'PropertyValue',
              name: 'Current status',
              value: formattedListing.currentStatus,
            }
          : null,
        formattedListing.yieldGross != null
          ? {
              '@type': 'PropertyValue',
              name: 'Gross yield',
              value: `${formattedListing.yieldGross}%`,
            }
          : null,
      ].filter(Boolean),
      geo:
        listing.latitude != null && listing.longitude != null
          ? {
              '@type': 'GeoCoordinates',
              latitude: Number(listing.latitude),
              longitude: Number(listing.longitude),
            }
          : undefined,
      image: formattedListing.media.map((item: { url: string }) => item.url),
      offers: formattedListing.price
        ? {
            '@type': 'Offer',
            priceCurrency: 'JPY',
            price: Number(formattedListing.price),
            availability: 'https://schema.org/InStock',
            url: absoluteUrl(`/listings/${listing.id}`),
          }
        : undefined,
    },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Listings',
        item: absoluteUrl('/listings'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: buildListingTitle(formattedListing, locale),
        item: absoluteUrl(`/listings/${listing.id}`),
      },
    ],
  }

  return (
    <div className="container py-8">
      <JsonLd data={listingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ViewTracker listingId={listing.id} />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 min-w-0">
          <ListingGallery media={formattedListing.media} />

          <div className="mt-8">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-3xl font-bold text-primary mb-2">
                  {formattedListing.price ? formatPrice(formattedListing.price, locale) : '-'}
                </p>
                {publicAddress && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{translateAddress(publicAddress, locale) || publicAddress}</span>
                    </div>
                    <p className="text-xs text-muted-foreground/70 flex items-center gap-1 ml-5">
                      <Info className="h-3 w-3 shrink-0" />
                      {t('addressPrivacyNote')}
                    </p>
                  </div>
                )}
                {stations.length > 0 && (
                  <div className="space-y-1 mt-1">
                    {stations.map((station, index) => (
                      <div key={index} className="flex items-center gap-1 text-muted-foreground">
                        <Train className="h-4 w-4" />
                        <span>
                          {formatTransitAccessLabel(station, locale)}
                          {station.walk_minutes && ` ${t('walkMinutes', { minutes: station.walk_minutes })}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <FavoriteButton
                listingId={formattedListing.id}
                initialFavorite={isFavorite}
                userId={userId}
              />
            </div>

            <ListingSpecs listing={formattedListing} />

            {/* アピールポイント */}
            {(description || features.length > 0) && (
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {t('overview')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {description && (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {description}
                    </p>
                  )}
                  {features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // 翻訳版featuresがあればそちらを使用
                        const translatedFeatures = locale === 'en' ? listing.featuresEn as string[] | null
                          : locale === 'zh-TW' ? listing.featuresZhTw as string[] | null
                          : locale === 'zh-CN' ? listing.featuresZhCn as string[] | null
                          : null
                        const displayFeatures = (translatedFeatures && translatedFeatures.length > 0)
                          ? translatedFeatures
                          : (locale === 'ja' ? features : [])
                        return displayFeatures.map((feature: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {feature}
                          </Badge>
                        ))
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        <div className="lg:col-span-1 min-w-0">
          <div className="sticky top-24 space-y-4">
            <InquiryButton
              listingId={formattedListing.id}
              userId={userId}
              listingTitle={translateAddress(publicAddress, locale) || publicAddress || t('property')}
            />
            <ExclusiveCta listingId={formattedListing.id} userId={userId} />
          </div>
        </div>
      </div>
    </div>
  )
}
