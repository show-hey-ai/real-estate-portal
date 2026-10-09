import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { CompareToggle, ListingViewTracker, RecentlyViewed } from '@/components/listing/browser-lists-client'
import { StationAccess } from '@/components/listing/station-access'
import { UnitPriceChart } from '@/components/listing/unit-price-chart'
import { compareUnitPrice, type UnitPriceSource } from '@/lib/unit-price'
import { LoanSimulator } from '@/components/listing/loan-simulator'
import { InitialCostSimulator } from '@/components/listing/initial-cost-simulator'
import { OverseasBuyingLink } from '@/components/overseas/overseas-buying-link'
import { parseMonthlyFigures } from '@/lib/monthly-costs'
import { cardGrossYield } from '@/lib/card-facts'
import { netYieldFromRent } from '@/lib/seismic'
import { formatApproxPrice, getJpyRates } from '@/lib/fx'
import { geocodeAddress } from '@/lib/geocode'
import { HazardLinks } from '@/components/listing/hazard-links'
import { ListingHighlightChips } from '@/components/listing/listing-highlights'
import { listingHighlights } from '@/lib/listing-highlights'
import Link from 'next/link'
import { WARD_SLUGS, wardLabel } from '@/lib/ward-tile-map'
import { ListingAlertForm } from '@/components/alerts/listing-alert-form'
import { typeSlugFor } from '@/lib/collections'
import { ListingCard } from '@/components/listing/listing-card'
import { rankRelatedListings, type RelatedCandidate } from '@/lib/related-listings'
import { QuickContact } from '@/components/listing/quick-contact'
import { parseDbTimestamp } from '@/lib/db-timestamp'
import { ListingMap } from '@/components/listing/listing-map'
import { localeAlternates, localizedPath } from '@/lib/locale-url'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, getLocale } from 'next-intl/server'
import { JsonLd } from '@/components/common/json-ld'
import { createServiceClient } from '@/lib/supabase/server'
import { ListingGallery } from '@/components/listing/listing-gallery'
import { ListingSpecs } from '@/components/listing/listing-specs'
import { ListingUpdateDates } from '@/components/listing/update-dates'
import { listingUpdateDates } from '@/lib/freshness'
import { ListingChat } from '@/components/listing/listing-chat'
import { PropertyChatLink } from '@/components/chat/private-chats'
import { getTradeChatCopy } from '@/lib/trade-chat'
import { FavoriteButton } from '@/components/listing/favorite-button'
import { ViewTracker } from '@/components/listing/view-tracker'
import { formatPrice } from '@/lib/format'
import { MapPin, Info, Sparkles, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ExclusiveCta } from '@/components/listing/exclusive-cta'
import { formatApprovedPublicAddress, hasDetailedPublicAddress } from '@/lib/address'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import { formatTransitAccessLabel, translateAddress, translatePropertyType } from '@/lib/translate-fields'
import { getIsFavoriteForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { getMarketCategory, PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { getPortalCategoryLabel } from '@/lib/portal-copy'
import {
  absoluteUrl,
  buildListingDescription,
  buildListingHeading,
  OPERATOR_NAME,
  OPERATOR_NAME_JA,
  SITE_NAME,
  buildListingTitle,
  getOpenGraphLocale,
  getPrimaryListingImage,
  getSchemaLanguage,
} from '@/lib/site-config'
import { pickCoverImage } from '@/lib/cover-image'
import { withCardFacts } from '@/lib/card-facts'
import { ShareListing } from '@/components/listing/share-listing'

interface ListingPageProps {
  params: Promise<{ id: string }>
}

async function getPublicListing(id: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id, status, propertyType, price, priceCurrency, prefecture, city, addressPublic,
      stations, builtYear, builtMonth, currentStatus, buildingArea, landArea, floorCount,
      structure, zoning, landRights, yieldGross, features, featuresEn, featuresZhTw, featuresZhCn,
      descriptionJa, descriptionEn, descriptionZhTw, descriptionZhCn, publishedAt,
      updatedAt, autonomyValidUntil, viewCount, hospitalityCategory,
      media (id, url, category, caption, isAdopted, sortOrder)
    `)
    .eq('id', id)
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0])
    .or(publicFreshnessFilters()[1])
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
  const alternates = localeAlternates(`/listings/${id}`, locale)
  const url = alternates.canonical
  const keywords = [
    'Tokyo property for sale',
    'Tokyo investment property',
    'Japan property purchase',
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
    alternates,
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

function schemaPropertyType(propertyType: string | null | undefined): string {
  if (propertyType === '区分マンション') return 'Apartment'
  if (propertyType === '戸建') return 'SingleFamilyResidence'
  if (propertyType === '一棟マンション' || propertyType === '一棟アパート') return 'ApartmentComplex'
  return 'Place'
}

async function getRelatedListings(current: RelatedCandidate & UnitPriceSource) {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('id, city, propertyType, price, addressPublic, descriptionJa, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, publishedAt, media (url, category, caption, isAdopted)')
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    .limit(200)
  if (error || !data) return { related: [], unitPrice: null }
  const unitPrice = current.city ? compareUnitPrice(current, data.filter((row) => row.city === current.city)) : null
  const related = rankRelatedListings(current, data).map((home) => ({
    ...home,
    price: home.price ? BigInt(home.price) : null,
    buildingArea: home.buildingArea ? Number(home.buildingArea) : null,
    landArea: home.landArea ? Number(home.landArea) : null,
    yieldGross: home.yieldGross ? Number(home.yieldGross) : null,
    media: (home.media || []).filter((item) => item.isAdopted),
  }))
  return { related, unitPrice }
}

const unitPriceCopy: Record<string, { title: string; self: string; average: (ward: string, count: number) => string; note: (count: number) => string }> = {
  ja: { title: '㎡単価の比較', self: 'この物件', average: (ward, count) => `${ward}の公開物件の平均（${count}件）`, note: (count) => `当ポータルで公開中の同区の物件${count}件の売出価格から計算した参考値です。成約価格や相場を示すものではありません。` },
  en: { title: 'Price per m² compared', self: 'This property', average: (ward, count) => `Average of ${count} listings in ${ward}`, note: (count) => `Reference figure from the asking prices of ${count} other listings in this ward on this portal; not transaction prices or a market valuation.` },
  'zh-TW': { title: '每平方公尺單價比較', self: '本物件', average: (ward, count) => `${ward}刊登物件平均（${count}筆）`, note: (count) => `依本站同區刊登中${count}筆物件的開價計算的參考值，並非成交價或市場行情。` },
  'zh-CN': { title: '每平方米单价比较', self: '本房源', average: (ward, count) => `${ward}在售房源平均（${count}套）`, note: (count) => `根据本站同区在售${count}套房源的挂牌价计算的参考值，并非成交价或市场行情。` },
}

const wardMore: Record<string, (ward: string) => string> = { ja: (ward) => `${ward}の物件をもっと見る`, en: (ward) => `More properties in ${ward}`, 'zh-TW': (ward) => `查看更多${ward}物件`, 'zh-CN': (ward) => `查看更多${ward}房源` }

const relatedTitle: Record<string, string> = { ja: '似ている物件', en: 'Similar properties', 'zh-TW': '類似物件', 'zh-CN': '类似房源' }

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
  const { related, unitPrice } = await getRelatedListings({ id: listing.id, city: listing.city, propertyType: listing.propertyType, price: listing.price, buildingArea: listing.buildingArea, landArea: listing.landArea })
  const isFavorite = viewer ? await getIsFavoriteForViewer(viewer.id, id) : false

  const publicAddress = formatApprovedPublicAddress(listing.addressPublic)
  const monthly = parseMonthlyFigures(listing.descriptionJa)
  const grossYield = cardGrossYield(listing)
  const letRent = listing.currentStatus?.includes('賃貸中') ? monthly.rent : null
  const [rates, hazardPoint] = await Promise.all([getJpyRates(), publicAddress ? geocodeAddress(publicAddress) : Promise.resolve(null)])
  const approxPrice = formatApproxPrice(Number(listing.price) || 0, locale, rates)
  const lastEdited = parseDbTimestamp(listing.updatedAt)
  const updateDates = lastEdited ? listingUpdateDates({ autonomyValidUntil: parseDbTimestamp(listing.autonomyValidUntil), updatedAt: lastEdited }) : null
  const netYield = netYieldFromRent(letRent, monthly.fees, Number(listing.price) || null)
  const stations = normalizeTransitStations(
    listing.stations as { name: string; name_en?: string | null; line?: string | null; line_en?: string | null; walk_minutes?: number | null }[] | null
  )
  const features = (listing.features as string[]) || []
  const walkTimes = stations.map((station) => station.walk_minutes).filter((value): value is number => typeof value === 'number' && value > 0)
  const highlights = listingHighlights({ descriptionJa: listing.descriptionJa, features: listing.features, builtYear: listing.builtYear, propertyType: listing.propertyType, landRights: listing.landRights, walkMinutes: walkTimes.length ? Math.min(...walkTimes) : null })

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
    media: sortedMedia,
  }
  const pageUrl = localeAlternates(`/listings/${listing.id}`, locale).canonical
  const publishedAt = parseDbTimestamp(listing.publishedAt)?.toISOString()
  const modifiedAt = parseDbTimestamp(listing.updatedAt)?.toISOString()
  // The page is a for-sale listing; the property itself is the offered item.
  const listingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: buildListingTitle(formattedListing, locale),
    description: buildListingDescription(formattedListing, locale),
    url: pageUrl,
    inLanguage: getSchemaLanguage(locale),
    datePosted: publishedAt,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    image: formattedListing.media.map((item: { url: string }) => item.url),
    offers: formattedListing.price
      ? {
          '@type': 'Offer',
          priceCurrency: 'JPY',
          price: Number(formattedListing.price),
          availability: 'https://schema.org/InStock',
          businessFunction: 'http://purl.org/goodrelations/v1#Sell',
          url: pageUrl,
          seller: { '@type': 'RealEstateAgent', name: OPERATOR_NAME, alternateName: [OPERATOR_NAME_JA, SITE_NAME], url: absoluteUrl('/') },
          itemOffered: {
            '@type': schemaPropertyType(formattedListing.propertyType),
            name: buildListingTitle(formattedListing, locale),
            address: {
              '@type': 'PostalAddress',
              addressRegion: listing.prefecture || 'Tokyo',
              addressLocality: listing.city || undefined,
              streetAddress: publicAddress || undefined,
              addressCountry: 'JP',
            },
            floorSize: formattedListing.buildingArea
              ? { '@type': 'QuantitativeValue', value: formattedListing.buildingArea, unitCode: 'MTK' }
              : undefined,
            numberOfFloors: formattedListing.floorCount || undefined,
            yearBuilt: formattedListing.builtYear || undefined,
            additionalProperty: [
              formattedListing.propertyType ? { '@type': 'PropertyValue', name: 'Property type', value: formattedListing.propertyType } : null,
              formattedListing.currentStatus ? { '@type': 'PropertyValue', name: 'Current status', value: formattedListing.currentStatus } : null,
              formattedListing.landArea ? { '@type': 'PropertyValue', name: 'Land area', value: formattedListing.landArea, unitCode: 'MTK' } : null,
            ].filter(Boolean),
          },
        }
      : undefined,
  }
  const homeLabel: Record<string, string> = { ja: 'ホーム', en: 'Home', 'zh-TW': '首頁', 'zh-CN': '首页' }
  const wardSlug = listing.city ? WARD_SLUGS[listing.city] : undefined
  const breadcrumbItems = [
    { name: homeLabel[locale] ?? homeLabel.en, item: absoluteUrl(localizedPath('/', locale)) },
    wardSlug ? { name: wardLabel(listing.city!, locale), item: absoluteUrl(localizedPath(`/areas/${wardSlug}`, locale)) } : { name: 'Listings', item: absoluteUrl(localizedPath('/listings', locale)) },
    { name: buildListingTitle(formattedListing, locale), item: pageUrl },
  ]
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((entry, index) => ({ '@type': 'ListItem', position: index + 1, ...entry })),
  }

  return (
    <div className="container py-8 pb-24 lg:pb-8" data-public-listing={listing.id}>
      <QuickContact variant="bar" listingId={formattedListing.id} listingTitle={buildListingTitle(formattedListing, locale)} listingUrl={absoluteUrl(`/listings/${formattedListing.id}`)} />
      <JsonLd data={listingJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <ViewTracker listingId={listing.id} />
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 min-w-0">
          <ListingGallery media={formattedListing.media} title={buildListingHeading(formattedListing, locale)} />

          <div className="mt-8">
            {getMarketCategory(formattedListing) && (
              <Badge className="mb-4 bg-[#dbe8f4] text-[#142337] hover:bg-[#dbe8f4]">
                {getPortalCategoryLabel(locale, getMarketCategory(formattedListing)!)}
              </Badge>
            )}
            <h1 className="mb-3 text-xl font-semibold leading-snug text-[#1b293a] md:text-2xl">{buildListingHeading(formattedListing, locale)}</h1>
            {/* On phones the actions sit under the price; side by side they pushed the page wider than the screen. */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-3xl font-bold text-primary mb-2">
                  {formattedListing.price ? formatPrice(formattedListing.price, locale) : '-'}
                </p>
                {approxPrice && <p className="-mt-1 mb-2 text-sm font-semibold text-[#536274]" data-testid="approx-price">{approxPrice}</p>}
                {updateDates && <ListingUpdateDates dates={updateDates} locale={locale} />}
                {publicAddress && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{translateAddress(publicAddress, locale) || publicAddress}</span>
                    </div>
                    {listing.city && WARD_SLUGS[listing.city] && <Link href={`/areas/${WARD_SLUGS[listing.city]}`} className="ml-5 text-xs font-semibold text-[#274d7d] hover:underline">{wardMore[locale]?.(wardLabel(listing.city, locale)) ?? wardMore.en(wardLabel(listing.city, locale))} →</Link>}
                    {!hasDetailedPublicAddress(publicAddress) && (<p className="text-xs text-muted-foreground/70 flex items-center gap-1 ml-5">
                      <Info className="h-3 w-3 shrink-0" />
                      {t('addressPrivacyNote')}
                    </p>)}
                  </div>
                )}
                {stations.length > 0 && <StationAccess locale={locale} stations={stations.map((station) => ({ label: formatTransitAccessLabel(station, locale) || station.name || '', walkMinutes: station.walk_minutes ?? null }))} />}
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0 sm:flex-col sm:items-end">
                <FavoriteButton
                  listingId={formattedListing.id}
                  initialFavorite={isFavorite}
                  userId={userId}
                />
                <CompareToggle listingId={formattedListing.id} />
                <ShareListing title={buildListingHeading(formattedListing, locale)} url={absoluteUrl(localizedPath(`/listings/${formattedListing.id}`, locale))} />
              </div>
            </div>

            <a href={`/chats?listing=${formattedListing.id}&start=1`} rel="nofollow" className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[#cfded8] bg-[#f0f7f4] px-4 py-3 text-sm font-medium text-[#316957] lg:hidden">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {getTradeChatCopy(locale).start}
            </a>

            <ListingHighlightChips locale={locale} result={highlights} />

            <div id="property-facts" className="scroll-mt-4 md:scroll-mt-44">
              <ListingSpecs listing={{ propertyType: formattedListing.propertyType, price: formattedListing.price, builtYear: formattedListing.builtYear, builtMonth: formattedListing.builtMonth, structure: formattedListing.structure, floorCount: formattedListing.floorCount, landArea: formattedListing.landArea, buildingArea: formattedListing.buildingArea, zoning: formattedListing.zoning, currentStatus: formattedListing.currentStatus, yieldGross: formattedListing.yieldGross, landRights: listing.landRights }} monthly={monthly} grossYield={grossYield} netYield={netYield} />
            </div>

            {unitPrice && listing.city && <UnitPriceChart locale={locale} title={unitPriceCopy[locale]?.title ?? unitPriceCopy.en.title} note={unitPriceCopy[locale]?.note(unitPrice.count) ?? unitPriceCopy.en.note(unitPrice.count)} bars={[
              { label: unitPriceCopy[locale]?.self ?? unitPriceCopy.en.self, value: unitPrice.current, highlight: true },
              { label: (unitPriceCopy[locale] ?? unitPriceCopy.en).average(wardLabel(listing.city, locale), unitPrice.count), value: unitPrice.average, href: wardSlug ? `/areas/${wardSlug}` : undefined },
            ]} />}

            {formattedListing.price && Number(formattedListing.price) > 0 && <LoanSimulator price={Number(formattedListing.price)} monthlyFees={monthly.fees} monthlyRent={letRent} />}
            {formattedListing.price && Number(formattedListing.price) > 0 && <InitialCostSimulator price={Number(formattedListing.price)} />}
            <OverseasBuyingLink locale={locale} />

            {publicAddress && <ListingMap locale={locale} publicAddress={publicAddress} />}
            {publicAddress && <HazardLinks locale={locale} point={hazardPoint} />}

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
          <div className="sticky top-44 space-y-4">
            <QuickContact listingId={formattedListing.id} listingTitle={buildListingTitle(formattedListing, locale)} listingUrl={absoluteUrl(`/listings/${formattedListing.id}`)} />
            <PropertyChatLink listingId={formattedListing.id} />
            <ListingChat
              key={formattedListing.id}
              listingId={formattedListing.id}
              listingTitle={translateAddress(publicAddress, locale) || publicAddress || t('property')}
            />
            <div id="inquiry" className="scroll-mt-4 md:scroll-mt-44">
              <PropertyChatLink listingId={formattedListing.id} />
            </div>
            <ExclusiveCta listingId={formattedListing.id} userId={userId} />
          </div>
        </div>
      </div>
      <ListingViewTracker listing={{ id: formattedListing.id, title: buildListingHeading(formattedListing, locale), price: formattedListing.price ? formatPrice(formattedListing.price, locale) : '', image: getPrimaryListingImage(formattedListing), imageCaption: pickCoverImage(formattedListing.media)?.caption ?? null }} />
      {related.length > 0 && <section className="mt-12 border-t border-[#e5eaf0] pt-8" aria-labelledby="related-title" data-testid="related-listings">
        <h2 id="related-title" className="text-xl font-semibold">{relatedTitle[locale] ?? relatedTitle.en}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((item) => <ListingCard key={item.id} listing={withCardFacts(item)} userId={userId} />)}</div>
      </section>}
      {formattedListing.city && <div className="mt-12" data-testid="listing-page-alert"><ListingAlertForm ward={formattedListing.city} type={typeSlugFor(formattedListing.propertyType) ?? undefined} scopeLabel={[wardLabel(formattedListing.city, locale), translatePropertyType(formattedListing.propertyType || null, locale)].filter(Boolean).join(locale === 'en' ? ', ' : '・')} /></div>}
      <RecentlyViewed excludeId={formattedListing.id} />
    </div>
  )
}
