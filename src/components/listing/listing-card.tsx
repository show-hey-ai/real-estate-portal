'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Train, Eye, Flame, Sparkles, MessageCircle } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { translatePropertyType, translateAddress, translateRailwayLine, translateStationName } from '@/lib/translate-fields'
import { FavoriteIconButton } from './favorite-icon-button'

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

export function ListingCard({ listing, isFavorite = false, userId = null, showFavoriteButton = true }: ListingCardProps) {
  const t = useTranslations('listing')
  const tCard = useTranslations('card')
  const locale = useLocale()

  const mainImage = listing.media.find(m => m.category === 'EXTERIOR') || listing.media[0]
  const stations = listing.stations || []
  const primaryStation = stations[0]

  // 心理学的指標の計算
  const viewCount = listing.viewCount || 0
  const favoriteCount = listing.favoriteCount || 0
  const isPopular = viewCount > 100 || favoriteCount > 5
  const isNew = listing.publishedAt &&
    new Date(listing.publishedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const hasHighYield = listing.yieldGross && Number(listing.yieldGross) >= 6

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-all duration-200">
      <Link href={`/listings/${listing.id}`}>
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={listing.addressPublic || t('noImage')}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t('noImage')}
            </div>
          )}

          {/* バッジエリア - 左上 */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {listing.propertyType && (
              <Badge variant="secondary" className="bg-black/75 hover:bg-black/75 text-white text-xs">
                {translatePropertyType(listing.propertyType, locale) || listing.propertyType}
              </Badge>
            )}
            {isNew && (
              <Badge className="bg-emerald-500 hover:bg-emerald-500 text-white text-xs">
                <Sparkles className="h-3 w-3 mr-0.5" />
                {tCard('new')}
              </Badge>
            )}
            {isPopular && !isNew && (
              <Badge className="bg-orange-500 hover:bg-orange-500 text-white text-xs">
                <Flame className="h-3 w-3 mr-0.5" />
                {tCard('popular')}
              </Badge>
            )}
          </div>

          {/* 高利回りバッジ - 右上 */}
          {hasHighYield && (
            <Badge className="absolute top-2 right-2 bg-primary hover:bg-primary text-white text-xs">
              {tCard('highYield')}
            </Badge>
          )}

          {/* 閲覧数 - 下部 */}
          {viewCount > 0 && (
            <div className="absolute bottom-2 left-2 bg-black/60 rounded px-1.5 py-0.5">
              <span className="flex items-center gap-1 text-white text-xs">
                <Eye className="h-3 w-3" />
                {viewCount}
              </span>
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-3">
        {/* 1行目: 価格 + 利回り */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">
              {listing.price ? formatPrice(listing.price, locale) : '-'}
            </span>
            {listing.yieldGross && (
              <span className="text-sm font-semibold text-primary">
                {Number(listing.yieldGross).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Link href={`/listings/${listing.id}#inquiry`} onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <MessageCircle className="h-4 w-4" />
              </Button>
            </Link>
            {showFavoriteButton && (
              <FavoriteIconButton
                listingId={listing.id}
                initialFavorite={isFavorite}
                userId={userId}
                className="h-8 w-8"
              />
            )}
          </div>
        </div>

        {/* 2行目: エリア */}
        {listing.addressPublic && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{translateAddress(listing.addressPublic, locale) || listing.addressPublic}</span>
          </div>
        )}

        {/* 3行目: 駅徒歩 */}
        {primaryStation && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
            <Train className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">
              {(locale !== 'ja' && primaryStation.name_en) ? primaryStation.name_en : translateStationName(primaryStation.name, locale) || primaryStation.name}
              {primaryStation.walk_minutes && ` ${t('walkMinutes', { minutes: primaryStation.walk_minutes })}`}
            </span>
          </div>
        )}

        {/* 4行目: 築年 / 面積 をチップで */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {listing.builtYear && (
            <span className="bg-muted px-2 py-0.5 rounded">{locale === 'en' ? listing.builtYear : `${listing.builtYear}年`}</span>
          )}
          {listing.buildingArea && (
            <span className="bg-muted px-2 py-0.5 rounded">{Number(listing.buildingArea).toFixed(0)}㎡</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
