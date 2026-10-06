'use client'

import { useTranslations, useLocale } from 'next-intl'
import { formatUnitPrice } from '@/lib/unit-price'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatArea } from '@/lib/format'
import { translatePropertyType, translateStructure, translateZoning, translateCurrentStatus } from '@/lib/translate-fields'
import { getMarketCategory } from '@/lib/market-category'

interface ListingSpecsProps {
  listing: {
    propertyType: string | null
    price?: bigint | number | string | null
    builtYear: number | null
    builtMonth: number | null
    structure: string | null
    floorCount: number | null
    landArea: { toString(): string } | null
    buildingArea: { toString(): string } | null
    zoning: string | null
    currentStatus: string | null
    yieldGross?: number | null
  }
}

export function ListingSpecs({ listing }: ListingSpecsProps) {
  const t = useTranslations('listing')
  const locale = useLocale()

  // 築年月フォーマット
  const formatBuiltDate = (year: number | null, month: number | null) => {
    if (!year) return null
    const age = new Date().getFullYear() - year
    if (locale === 'en') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const base = `${year} (${age} yrs old)`
      return month ? `${monthNames[month - 1]} ${base}` : base
    }
    if (locale === 'zh-TW') {
      const base = `${year}年（屋齡${age}年）`
      return month ? `${year}年${month}月（屋齡${age}年）` : base
    }
    if (locale === 'zh-CN') {
      const base = `${year}年（房龄${age}年）`
      return month ? `${year}年${month}月（房龄${age}年）` : base
    }
    // ja
    const base = `${year}年（築${age}年）`
    return month ? `${year}年${month}月（築${age}年）` : base
  }

  const specs = [
    { label: t('propertyType'), value: translatePropertyType(listing.propertyType, locale) },
    { label: t('builtYear'), value: formatBuiltDate(listing.builtYear, listing.builtMonth) },
    { label: t('structure'), value: translateStructure(listing.structure, locale) },
    { label: t('floorCount'), value: listing.floorCount ? t('floorCountValue', { count: listing.floorCount }) : null },
    { label: t('landArea'), value: listing.landArea ? formatArea(Number(listing.landArea)) : null },
    { label: t('buildingArea'), value: listing.buildingArea ? formatArea(Number(listing.buildingArea)) : null },
    { label: t('zoning'), value: translateZoning(listing.zoning, locale) },
    { label: t('currentStatus'), value: translateCurrentStatus(listing.currentStatus, locale) },
    { label: locale === 'ja' ? '㎡単価' : locale === 'en' ? 'Price per m²' : locale === 'zh-TW' ? '每平方公尺單價' : '每平方米单价', value: formatUnitPrice(Number(listing.price) || null, Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea) || null, locale) },
    ...(getMarketCategory(listing) === 'investment' && listing.yieldGross && Number(listing.yieldGross) > 0
      ? [{ label: locale === 'ja' ? '表面利回り' : locale === 'en' ? 'Gross yield' : locale === 'zh-TW' ? '表面投報率' : '表面收益率', value: `${Number(listing.yieldGross)}%` }]
      : []),
  ].filter((spec) => spec.value)

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('overview')}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-4">
          {specs.map((spec) => (
            <div key={spec.label} className="space-y-1">
              <dt className="text-sm text-muted-foreground">{spec.label}</dt>
              <dd className="font-medium">{spec.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
