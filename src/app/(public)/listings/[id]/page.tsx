import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { ListingGallery } from '@/components/listing/listing-gallery'
import { ListingSpecs } from '@/components/listing/listing-specs'
import { ListingWarnings } from '@/components/listing/listing-warnings'
import { InquiryButton } from '@/components/listing/inquiry-button'
import { FavoriteButton } from '@/components/listing/favorite-button'
import { ViewTracker } from '@/components/listing/view-tracker'
import { formatPrice } from '@/lib/format'
import { MapPin, Train, Info, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExclusiveCta } from '@/components/listing/exclusive-cta'
import { translateAddress, translateRailwayLine, translateStationName } from '@/lib/translate-fields'
import { getIsFavoriteForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'

interface ListingPageProps {
  params: Promise<{ id: string }>
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params
  const [t, locale] = await Promise.all([getTranslations('listing'), getLocale()])
  const supabase = await createClient()
  const viewerPromise = getOptionalPublicViewer()

  // 物件情報を取得
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      media (*)
    `)
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .single()

  if (error || !listing) {
    notFound()
  }

  // メディアをソート（isAdoptedがtrue、sortOrder順）
  const sortedMedia = (listing.media || [])
    .filter((m: { isAdopted: boolean }) => m.isAdopted)
    .sort((a: { sortOrder: number }, b: { sortOrder: number }) => (a.sortOrder || 0) - (b.sortOrder || 0))

  const viewer = await viewerPromise
  const userId = viewer?.id ?? null
  const isFavorite = viewer ? await getIsFavoriteForViewer(viewer.id, id) : false

  const warnings = (listing.warnings as string[]) || []
  const stations = (listing.stations as { name: string; name_en?: string | null; line?: string | null; line_en?: string | null; walk_minutes?: number | null }[]) || []
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
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    landArea: listing.landArea ? Number(listing.landArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
    yieldNet: listing.yieldNet ? Number(listing.yieldNet) : null,
    media: sortedMedia,
  }

  return (
    <div className="container py-8">
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
                {formattedListing.addressPublic && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{translateAddress(formattedListing.addressPublic, locale) || formattedListing.addressPublic}</span>
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
                          {station.line && `${(locale !== 'ja' && station.line_en) ? station.line_en : translateRailwayLine(station.line, locale) || station.line} `}
                          {(locale !== 'ja' && station.name_en) ? station.name_en : translateStationName(station.name, locale) || station.name}
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

            {warnings.length > 0 && (
              <ListingWarnings warnings={warnings} />
            )}
          </div>
        </div>

        <div className="lg:col-span-1 min-w-0">
          <div className="sticky top-24 space-y-4">
            <InquiryButton
              listingId={formattedListing.id}
              userId={userId}
              listingTitle={translateAddress(formattedListing.addressPublic, locale) || formattedListing.addressPublic || t('property')}
            />
            <ExclusiveCta listingId={formattedListing.id} userId={userId} />
          </div>
        </div>
      </div>
    </div>
  )
}
