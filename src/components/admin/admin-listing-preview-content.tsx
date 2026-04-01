'use client'

import { useLocale, useTranslations } from 'next-intl'
import { MapPin, Train, Info, Sparkles } from 'lucide-react'
import { ListingGallery } from '@/components/listing/listing-gallery'
import { ListingSpecs } from '@/components/listing/listing-specs'
import { ListingWarnings } from '@/components/listing/listing-warnings'
import { InquiryButton } from '@/components/listing/inquiry-button'
import { FavoriteButton } from '@/components/listing/favorite-button'
import { ExclusiveCta } from '@/components/listing/exclusive-cta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/format'
import {
  translateAddress,
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'

interface PreviewMedia {
  id: string
  url: string
  category: string
  sortOrder?: number | null
  isAdopted?: boolean | null
}

interface PreviewStation {
  name: string
  name_en?: string | null
  line?: string | null
  line_en?: string | null
  walk_minutes?: number | null
}

interface PreviewListing {
  id: string
  price: string | number | null
  addressPublic: string | null
  propertyType: string | null
  builtYear: number | null
  builtMonth: number | null
  structure: string | null
  floorCount: number | null
  landArea: string | number | null
  buildingArea: string | number | null
  zoning: string | null
  currentStatus: string | null
  yieldGross: string | number | null
  yieldNet: string | number | null
  warnings: string[] | null
  stations: PreviewStation[] | null
  features: string[] | null
  featuresEn?: string[] | null
  featuresZhTw?: string[] | null
  featuresZhCn?: string[] | null
  descriptionJa?: string | null
  descriptionEn?: string | null
  descriptionZhTw?: string | null
  descriptionZhCn?: string | null
  media: PreviewMedia[]
}

interface AdminListingPreviewContentProps {
  listing: PreviewListing
}

export function AdminListingPreviewContent({
  listing,
}: AdminListingPreviewContentProps) {
  const t = useTranslations('listing')
  const locale = useLocale()

  const media = (listing.media || [])
    .filter((item) => item.isAdopted !== false)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  const warnings = listing.warnings || []
  const stations = listing.stations || []
  const features = listing.features || []

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
  const formattedListing = {
    ...listing,
    price: listing.price ? BigInt(String(listing.price)) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    landArea: listing.landArea ? Number(listing.landArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
    yieldNet: listing.yieldNet ? Number(listing.yieldNet) : null,
    media,
  }

  return (
    <div className="min-h-full bg-background">
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 min-w-0">
            <div data-preview-interactive>
              <ListingGallery media={formattedListing.media} />
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="mb-2 text-3xl font-bold text-primary">
                    {formattedListing.price
                      ? formatPrice(formattedListing.price, locale)
                      : '-'}
                  </p>
                  {formattedListing.addressPublic && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>
                          {translateAddress(formattedListing.addressPublic, locale) ||
                            formattedListing.addressPublic}
                        </span>
                      </div>
                      <p className="ml-5 flex items-center gap-1 text-xs text-muted-foreground/70">
                        <Info className="h-3 w-3 shrink-0" />
                        {t('addressPrivacyNote')}
                      </p>
                    </div>
                  )}
                  {stations.length > 0 && (
                    <div className="mt-1 space-y-1">
                      {stations.map((station, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-muted-foreground"
                        >
                          <Train className="h-4 w-4" />
                          <span>
                            {station.line &&
                              `${(locale !== 'ja' && station.line_en)
                                ? station.line_en
                                : translateRailwayLine(station.line, locale) ||
                                  station.line} `}
                            {(locale !== 'ja' && station.name_en)
                              ? station.name_en
                              : translateStationName(station.name, locale) ||
                                station.name}
                            {station.walk_minutes &&
                              ` ${t('walkMinutes', {
                                minutes: station.walk_minutes,
                              })}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div data-preview-interactive>
                  <FavoriteButton
                    listingId={formattedListing.id}
                    initialFavorite={false}
                    userId={null}
                  />
                </div>
              </div>

              <ListingSpecs listing={formattedListing} />

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
                      <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                        {description}
                      </p>
                    )}
                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {(() => {
                          const translatedFeatures =
                            locale === 'en'
                              ? listing.featuresEn || null
                              : locale === 'zh-TW'
                                ? listing.featuresZhTw || null
                                : locale === 'zh-CN'
                                  ? listing.featuresZhCn || null
                                  : null
                          const displayFeatures =
                            translatedFeatures && translatedFeatures.length > 0
                              ? translatedFeatures
                              : locale === 'ja'
                                ? features
                                : []

                          return displayFeatures.map((feature, index) => (
                            <Badge
                              key={`${feature}-${index}`}
                              variant="secondary"
                              className="text-sm"
                            >
                              {feature}
                            </Badge>
                          ))
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {warnings.length > 0 && <ListingWarnings warnings={warnings} />}
            </div>
          </div>

          <div className="lg:col-span-1 min-w-0">
            <div className="sticky top-6 space-y-4" data-preview-interactive>
              <InquiryButton
                listingId={formattedListing.id}
                userId={null}
                listingTitle={
                  translateAddress(formattedListing.addressPublic, locale) ||
                  formattedListing.addressPublic ||
                  t('property')
                }
              />
              <ExclusiveCta listingId={formattedListing.id} userId={null} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
