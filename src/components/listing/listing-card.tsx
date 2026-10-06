'use client'

import Image from 'next/image'
import { pickCoverImage } from '@/lib/cover-image'
import { parseDbTimestamp } from '@/lib/db-timestamp'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  CalendarDays,
  Building2,
  Eye,
  Flame,
  House,
  MapPin,
  Map,
  MessageCircle,
  Ruler,
  Sparkles,
  Train,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPortalPropertyTypes } from '@/lib/portal-copy'
import { getMarketCategory } from '@/lib/market-category'
import { getPortalCategoryLabel } from '@/lib/portal-copy'
import { formatPrice } from '@/lib/format'
import { formatApprovedPublicAddress } from '@/lib/address'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import { formatTransitAccessLabel, translateAddress, translateZoning } from '@/lib/translate-fields'
import { FavoriteIconButton } from './favorite-icon-button'
import { getTradeChatCopy } from '@/lib/trade-chat'

const NEW_LISTING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const NEW_LISTING_CUTOFF = Date.now() - NEW_LISTING_WINDOW_MS

interface Station {
  name: string
  name_en?: string | null
  line?: string | null
  line_en?: string | null
  walk_minutes?: number | null
}

interface ListingCardProps {
  listing: {
    id: string
    propertyType: string | null
    hospitalityCategory?: string | null
    price: bigint | null
    addressPublic: string | null
    stations?: Station[] | null
    builtYear: number | null
    buildingArea: number | null
    landArea?: number | null
    zoning?: string | null
    currentStatus?: string | null
    yieldGross?: number | null
    viewCount?: number | null
    favoriteCount?: number | null
    publishedAt?: Date | string | null
    media: {
      url: string
      category: string
    }[]
  }
  isFavorite?: boolean
  userId?: string | null
  showFavoriteButton?: boolean
  imagePriority?: boolean
}

export function ListingCard({
  listing,
  isFavorite = false,
  userId = null,
  showFavoriteButton = true,
  imagePriority = false,
}: ListingCardProps) {
  const t = useTranslations('listing')
  const tCard = useTranslations('card')
  const locale = useLocale()
  const propertyTypeLabel =
    getPortalPropertyTypes(locale).find((type) => type.value === listing.propertyType)
      ?.label || listing.propertyType
  const category = getMarketCategory(listing)

  const mainImage = pickCoverImage(listing.media)
  const safeAddress = formatApprovedPublicAddress(listing.addressPublic)
  const stations = normalizeTransitStations(listing.stations)
  const primaryStation = stations[0]
  const primaryTransitLabel = formatTransitAccessLabel(primaryStation, locale)

  const viewCount = listing.viewCount || 0
  const favoriteCount = listing.favoriteCount || 0
  const isPopular = viewCount > 100 || favoriteCount > 5
  const publishedAtTime = parseDbTimestamp(listing.publishedAt)?.getTime() ?? null
  const isNew = publishedAtTime != null && publishedAtTime > NEW_LISTING_CUTOFF

  return (
    <Card className="group overflow-hidden rounded-xl border-[#dbe2e9] bg-white py-0 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#e9f0f7]">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={safeAddress || t('noImage')}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={mainImage.category === 'FLOORPLAN' ? 'bg-white object-contain p-3 pt-12' : 'object-cover transition-transform duration-500 group-hover:scale-105'}
              priority={imagePriority}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#657487]">
              {t('noImage')}
            </div>
          )}

          {mainImage?.category !== 'FLOORPLAN' && <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(12,28,24,0.82)_100%)]" />}

          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
            <Badge className="rounded-[4px] bg-[#142337]/88 px-2 text-[11px] font-medium text-white hover:bg-[#142337]/88">
              {category === 'investment' ? <Building2 className="mr-1 h-3 w-3" /> : category === 'land' ? <Map className="mr-1 h-3 w-3" /> : <House className="mr-1 h-3 w-3" />}
              {category ? getPortalCategoryLabel(locale, category) : t('property')}
            </Badge>
            {propertyTypeLabel && (
              <Badge className="rounded-[4px] bg-[#dbe8f4] px-2 text-[11px] font-medium text-[#142337] hover:bg-[#dbe8f4]">
                {propertyTypeLabel}
              </Badge>
            )}
            {isNew && (
              <Badge className="rounded-[4px] bg-[#274d7d] px-2 text-[11px] text-white hover:bg-[#274d7d]">
                <Sparkles className="mr-1 h-3 w-3" />
                {tCard('new')}
              </Badge>
            )}
            {isPopular && !isNew && (
              <Badge className="rounded-[6px] bg-[#a85235] px-2 text-[11px] text-white hover:bg-[#a85235]">
                <Flame className="mr-1 h-3 w-3" />
                {tCard('popular')}
              </Badge>
            )}
          </div>

          {viewCount > 0 && (
            <div className="absolute bottom-3 left-3 rounded-[6px] bg-black/55 px-2 py-1">
              <span className="flex items-center gap-1 text-xs text-white">
                <Eye className="h-3 w-3" />
                {viewCount}
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#57769b]">{t('price')}</p>
            <p className="mt-1 text-xl font-semibold tracking-normal text-[#1b293a]">
              {listing.price ? formatPrice(listing.price, locale) : '-'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="h-11 w-11 rounded-lg text-[#657487] hover:bg-[#e9f0f7] hover:text-[#274d7d]"
                aria-label={getTradeChatCopy(locale).start}
              >
                <Link href={`/chats?listing=${listing.id}&start=1`}><MessageCircle aria-hidden="true" className="h-4 w-4" /></Link>
              </Button>
            {showFavoriteButton && (
              <FavoriteIconButton
                listingId={listing.id}
                initialFavorite={isFavorite}
                userId={userId}
                className="h-11 w-11 rounded-lg"
              />
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {safeAddress && (
            <div className="flex items-center gap-2 text-sm text-[#657487]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#57769b]" />
              <span className="truncate">{translateAddress(safeAddress, locale) || safeAddress}</span>
            </div>
          )}

          {primaryStation && primaryTransitLabel && (
            <div className="flex items-center gap-2 text-sm text-[#657487]">
              <Train className="h-3.5 w-3.5 shrink-0 text-[#57769b]" />
              <span className="truncate">
                {primaryTransitLabel}
                {primaryStation.walk_minutes &&
                  ` ${t('walkMinutes', { minutes: primaryStation.walk_minutes })}`}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-[4px] border border-[#dbe2e9] bg-[#f5f7f9] text-xs">
          <div className="border-r border-[#e1dac8] p-2">
            <div className="flex items-center gap-1 text-[#5c6560]">
              <Ruler className="h-3 w-3" />
              {listing.propertyType === '土地' ? t('landArea') : t('buildingArea')}
            </div>
            <p className="mt-1 font-semibold text-[#1b293a]">
              {(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea)
                ? `${Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea).toFixed(0)}㎡`
                : '-'}
            </p>
          </div>
          <div className="p-2">
            <div className="flex items-center gap-1 text-[#5c6560]">
              <CalendarDays className="h-3 w-3" />
              {listing.propertyType === '土地' ? t('zoning') : t('builtYear')}
            </div>
            <p className="mt-1 font-semibold text-[#1b293a]">
              {listing.propertyType === '土地'
                ? (translateZoning(listing.zoning || null, locale) || listing.zoning || '-')
                : (listing.builtYear ? (locale === 'en' ? listing.builtYear : `${listing.builtYear}年`) : '-')}
            </p>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
