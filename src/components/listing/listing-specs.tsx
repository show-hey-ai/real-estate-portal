'use client'

import { useTranslations, useLocale } from 'next-intl'
import { formatUnitPrice } from '@/lib/unit-price'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatArea } from '@/lib/format'
import { translatePropertyType, translateStructure, translateZoning, translateCurrentStatus } from '@/lib/translate-fields'
import type { MonthlyFigures } from '@/lib/monthly-costs'
import { seismicStandard } from '@/lib/seismic'

const monthlyCopy = {
  ja: { seismic: '耐震基準（築年からの目安）', seismicValue: { new: '新耐震基準（1981年6月以降の基準）', check: '新旧の境目（建築確認日の確認が必要）', old: '旧耐震基準の可能性（耐震診断の有無を確認）' }, netYield: '実質利回り（管理費等控除後・概算）', management: '管理費（月額）', repair: '修繕積立金（月額）', fees: '管理費等（月額）', rent: '賃料（月額）', yield: '表面利回り', yen: (value: number) => `${value.toLocaleString('ja-JP')}円` },
  en: { seismic: 'Earthquake standard (from built year)', seismicValue: { new: 'New standard (June 1981 or later)', check: 'Borderline: check the building permit date', old: 'Likely pre-1981 standard: ask about seismic checks' }, netYield: 'Net yield (after fees, estimate)', management: 'Management fee (monthly)', repair: 'Repair reserve (monthly)', fees: 'Management fees (monthly)', rent: 'Rent (monthly)', yield: 'Gross yield', yen: (value: number) => `¥${value.toLocaleString('en-US')}` },
  'zh-TW': { seismic: '耐震基準（依屋齡推估）', seismicValue: { new: '新耐震基準（1981年6月以後）', check: '新舊交界（需確認建築許可日期）', old: '可能為舊耐震基準（請確認耐震診斷）' }, netYield: '實質投報率（扣除管理費等・概算）', management: '管理費（月）', repair: '修繕公積金（月）', fees: '管理費等（月）', rent: '租金（月）', yield: '表面投報率', yen: (value: number) => `${value.toLocaleString('ja-JP')}日圓` },
  'zh-CN': { seismic: '耐震标准（按房龄推估）', seismicValue: { new: '新耐震标准（1981年6月以后）', check: '新旧交界（需确认建筑许可日期）', old: '可能为旧耐震标准（请确认抗震诊断）' }, netYield: '实际收益率（扣除管理费等・估算）', management: '管理费（月）', repair: '修缮基金（月）', fees: '管理费等（月）', rent: '租金（月）', yield: '表面收益率', yen: (value: number) => `${value.toLocaleString('ja-JP')}日元` },
} as const

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
  /** Monthly figures read from the description; see parseMonthlyFigures. */
  monthly?: MonthlyFigures
  /** Gross yield to show, stored or computed from the stated rent. */
  grossYield?: number | null
  netYield?: number | null
}

export function ListingSpecs({ listing, monthly, grossYield, netYield }: ListingSpecsProps) {
  const t = useTranslations('listing')
  const locale = useLocale()
  const text = monthlyCopy[locale as keyof typeof monthlyCopy] ?? monthlyCopy.en
  const seismic = listing.propertyType === '土地' ? null : seismicStandard(listing.builtYear)

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
    { label: text.seismic, value: seismic ? text.seismicValue[seismic] : null },
    { label: t('structure'), value: translateStructure(listing.structure, locale) },
    { label: t('floorCount'), value: listing.floorCount ? t('floorCountValue', { count: listing.floorCount }) : null },
    { label: t('landArea'), value: listing.landArea ? formatArea(Number(listing.landArea)) : null },
    { label: t('buildingArea'), value: listing.buildingArea ? formatArea(Number(listing.buildingArea)) : null },
    { label: t('zoning'), value: translateZoning(listing.zoning, locale) },
    { label: t('currentStatus'), value: translateCurrentStatus(listing.currentStatus, locale) },
    { label: locale === 'ja' ? '㎡単価' : locale === 'en' ? 'Price per m²' : locale === 'zh-TW' ? '每平方公尺單價' : '每平方米单价', value: formatUnitPrice(Number(listing.price) || null, Number(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea) || null, locale) },
    ...(monthly?.managementFee ? [{ label: text.management, value: text.yen(monthly.managementFee) }] : []),
    ...(monthly?.repairReserve ? [{ label: text.repair, value: text.yen(monthly.repairReserve) }] : []),
    ...(monthly?.fees && !monthly.managementFee && !monthly.repairReserve ? [{ label: text.fees, value: text.yen(monthly.fees) }] : []),
    ...(monthly?.rent && listing.currentStatus?.includes('賃貸中') ? [{ label: text.rent, value: text.yen(monthly.rent) }] : []),
    ...(grossYield ? [{ label: text.yield, value: `${grossYield}%` }] : []),
    ...(netYield ? [{ label: text.netYield, value: `${netYield}%` }] : []),
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
