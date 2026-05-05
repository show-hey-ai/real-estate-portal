'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  BadgeCheck,
  CalendarDays,
  Eye,
  Flame,
  Hotel,
  MapPin,
  MessageCircle,
  Ruler,
  ShieldCheck,
  Sparkles,
  Train,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  getHospitalityCardCopy,
  getHospitalityCategoryLabel,
  getHospitalityPropertyTypeOptions,
} from '@/lib/hospitality-copy'
import { formatPrice } from '@/lib/format'
import { formatPublicAddress } from '@/lib/address'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import { formatTransitAccessLabel, translateAddress } from '@/lib/translate-fields'
import { FavoriteIconButton } from './favorite-icon-button'

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
    yieldGross: number | null
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
}

export function ListingCard({
  listing,
  isFavorite = false,
  userId = null,
  showFavoriteButton = true,
}: ListingCardProps) {
  const t = useTranslations('listing')
  const tCard = useTranslations('card')
  const locale = useLocale()
  const cardCopy = getHospitalityCardCopy(locale)
  const propertyTypeLabel =
    getHospitalityPropertyTypeOptions(locale).find((type) => type.value === listing.propertyType)
      ?.label || listing.propertyType
  const hospitalityCategoryLabel = getHospitalityCategoryLabel(listing.hospitalityCategory, locale)

  const mainImage = listing.media.find((m) => m.category === 'EXTERIOR') || listing.media[0]
  const safeAddress = formatPublicAddress(listing.addressPublic).publicAddress || listing.addressPublic
  const stations = normalizeTransitStations(listing.stations)
  const primaryStation = stations[0]
  const primaryTransitLabel = formatTransitAccessLabel(primaryStation, locale)

  const viewCount = listing.viewCount || 0
  const favoriteCount = listing.favoriteCount || 0
  const isPopular = viewCount > 100 || favoriteCount > 5
  const publishedAtTime = listing.publishedAt ? new Date(listing.publishedAt).getTime() : null
  const isNew = publishedAtTime != null && publishedAtTime > NEW_LISTING_CUTOFF

  return (
    <Card className="group overflow-hidden rounded-[8px] border-[#d9d2bd] bg-[#fffdf8] py-0 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[5/4] overflow-hidden bg-[#e8e0cf]">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={safeAddress || t('noImage')}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 420px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[#647069]">
              {t('noImage')}
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(12,28,24,0.82)_100%)]" />

          <div className="absolute left-3 top-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
            {hospitalityCategoryLabel ? (
              <Badge className="rounded-[6px] bg-[#0c2a22] px-2 text-[11px] font-semibold text-amber-200 hover:bg-[#0c2a22]">
                <BadgeCheck className="mr-1 h-3 w-3" />
                {hospitalityCategoryLabel}
              </Badge>
            ) : (
              <Badge className="rounded-[6px] bg-[#10231e]/88 px-2 text-[11px] font-medium text-white hover:bg-[#10231e]/88">
                <Hotel className="mr-1 h-3 w-3" />
                {cardCopy.candidate}
              </Badge>
            )}
            {propertyTypeLabel && (
              <Badge className="rounded-[6px] bg-[#d8a64a] px-2 text-[11px] font-medium text-[#13201c] hover:bg-[#d8a64a]">
                {propertyTypeLabel}
              </Badge>
            )}
            {isNew && (
              <Badge className="rounded-[6px] bg-[#2f6d58] px-2 text-[11px] text-white hover:bg-[#2f6d58]">
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
            <p className="text-xs font-semibold text-[#a17426]">{cardCopy.review}</p>
            <p className="mt-1 text-xl font-semibold tracking-normal text-[#19231f]">
              {listing.price ? formatPrice(listing.price, locale) : '-'}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`/listings/${listing.id}#inquiry`} onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-[8px] text-[#647069] hover:bg-[#eee7d8] hover:text-[#2f6d58]"
                aria-label={t('inquiry')}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
            {showFavoriteButton && (
              <FavoriteIconButton
                listingId={listing.id}
                initialFavorite={isFavorite}
                userId={userId}
                className="h-8 w-8 rounded-[8px]"
              />
            )}
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {safeAddress && (
            <div className="flex items-center gap-2 text-sm text-[#647069]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#2f6d58]" />
              <span className="truncate">{translateAddress(safeAddress, locale) || safeAddress}</span>
            </div>
          )}

          {primaryStation && primaryTransitLabel && (
            <div className="flex items-center gap-2 text-sm text-[#647069]">
              <Train className="h-3.5 w-3.5 shrink-0 text-[#2f6d58]" />
              <span className="truncate">
                {primaryTransitLabel}
                {primaryStation.walk_minutes &&
                  ` ${t('walkMinutes', { minutes: primaryStation.walk_minutes })}`}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-[8px] border border-[#e1dac8] bg-[#f7f3e9] text-xs">
          <div className="border-r border-[#e1dac8] p-2">
            <div className="flex items-center gap-1 text-[#7a837d]">
              <ShieldCheck className="h-3 w-3" />
              {cardCopy.yield}
            </div>
            <p className="mt-1 font-semibold text-[#19231f]">
              {listing.yieldGross ? `${Number(listing.yieldGross).toFixed(1)}%` : '-'}
            </p>
          </div>
          <div className="border-r border-[#e1dac8] p-2">
            <div className="flex items-center gap-1 text-[#7a837d]">
              <Ruler className="h-3 w-3" />
              {cardCopy.area}
            </div>
            <p className="mt-1 font-semibold text-[#19231f]">
              {listing.buildingArea ? `${Number(listing.buildingArea).toFixed(0)}㎡` : '-'}
            </p>
          </div>
          <div className="p-2">
            <div className="flex items-center gap-1 text-[#7a837d]">
              <CalendarDays className="h-3 w-3" />
              {t('builtYear')}
            </div>
            <p className="mt-1 font-semibold text-[#19231f]">
              {listing.builtYear ? (locale === 'en' ? listing.builtYear : `${listing.builtYear}年`) : '-'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[#4d5c55]">
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#e8efe8] px-2 py-1">
            <BadgeCheck className="h-3 w-3 text-[#2f6d58]" />
            {cardCopy.license}
          </span>
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#efe7d4] px-2 py-1">
            {cardCopy.opening}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
