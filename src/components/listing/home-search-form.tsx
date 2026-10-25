'use client'

import { formatPrice } from '@/lib/format'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPortalHomeCopy, getPortalPropertyTypes } from '@/lib/portal-copy'
import { cn } from '@/lib/utils'
import { type PublicSearchLocationIndex } from '@/lib/public-search'
import type { TransitOptions } from '@/lib/transit/search'
import { translateCityName } from '@/lib/translate-fields'

// "~¥30M" read as "about ¥30M", so the limit is spelled out in each language.
function maxPriceLabel(value: number, locale: string): string {
  if (locale === 'en') return `Up to ${formatPrice(value, 'en')}`
  if (locale === 'zh-TW') return `${formatPrice(value, locale)}以下`
  if (locale === 'zh-CN') return `${formatPrice(value, locale)}以下`
  return `${formatPrice(value, 'ja').replace('¥', '')}円以下`
}

interface HomeSearchFormProps {
  compact?: boolean
  locationIndex: PublicSearchLocationIndex
  transit: TransitOptions
}

const areaOptions = ['20', '50', '100', '200']
const priceOptions = ['30000000', '50000000', '100000000', '300000000']
const walkOptions = ['5', '10', '15']

export function HomeSearchForm({ compact = false, locationIndex, transit }: HomeSearchFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [line, setLine] = useState('')
  const [station, setStation] = useState('')
  const propertyTypes = getPortalPropertyTypes(locale)
  const copy = getPortalHomeCopy(locale)

  const stations = transit.lines.find((option) => option.value === line)?.stations ?? []

  const fieldClassName = cn(
    'rounded-[4px] border border-[#cbd5df] bg-white text-sm text-[#1b293a] outline-none transition focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15',
    compact ? 'h-10 px-2 md:w-[150px]' : 'h-11 px-3 md:w-[160px]'
  )

  return (
    <form data-testid="home-search-form" action="/listings" method="get" className={compact ? 'space-y-2' : 'space-y-4'}>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          name="q"
          maxLength={80}
          aria-label={t('search.keywordPlaceholder')}
          placeholder={t('search.keywordPlaceholder')}
          className={cn(
            'flex-1 rounded-[4px] border border-[#cbd5df] bg-white text-[#1b293a] outline-none transition placeholder:text-[#8b98a6] focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15',
            compact ? 'h-10 px-3 text-sm' : 'h-11 px-4'
          )}
        />
        <select name="ward" aria-label={t('search.allTokyo23Wards')} className={fieldClassName}>
          <option value="">{t('search.allTokyo23Wards')}</option>
          {locationIndex.wards.map((ward) => (
            <option key={ward} value={ward}>
              {translateCityName(ward, locale) || ward}
            </option>
          ))}
        </select>
        <select name="category" aria-label={copy.categoryTitle} className={cn(fieldClassName, compact ? 'md:w-32' : 'md:w-36')}>
          <option value="">{copy.categoryAll}</option>
          {copy.categories.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select name="priceMax" aria-label={t('search.priceRange')} className={cn(fieldClassName, compact ? 'md:w-28' : 'md:w-32')}>
          <option value="">{t('search.priceRange')}</option>
          {priceOptions.map((value) => (
            <option key={value} value={value}>
              {maxPriceLabel(Number(value), locale)}
            </option>
          ))}
        </select>
        <Button
          type="submit"
          size={compact ? 'default' : 'lg'}
          className={cn(
            'rounded-[4px] bg-[#274d7d] text-white hover:bg-[#18375f]',
            compact ? 'h-10' : 'h-11'
          )}
        >
          <Search className="mr-2 h-4 w-4" />
          {t('search.search')}
        </Button>
      </div>
      <details className="group">
        <summary className="flex w-fit cursor-pointer list-none items-center gap-2 text-sm font-medium text-[#46698e] [&::-webkit-details-marker]:hidden">{copy.moreFilters}<ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></summary>
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:flex-wrap">
        <select name="type" aria-label={t('search.allTypes')} className={fieldClassName}>
          <option value="">{t('search.allTypes')}</option>
          {propertyTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        {/* A chosen station narrows the line to that station, so only one of the two is sent. */}
        <select
          name={station ? undefined : 'lines'}
          aria-label={t('search.allLines')}
          value={line}
          onChange={(event) => {
            setLine(event.target.value)
            setStation('')
          }}
          className={fieldClassName}
        >
          <option value="">{t('search.allLines')}</option>
          {transit.lines.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          name="stations"
          aria-label={t('search.allStations')}
          value={station}
          onChange={(event) => setStation(event.target.value)}
          disabled={!line}
          className={fieldClassName}
        >
          <option value="">{line ? t('search.allStations') : t('search.selectLineFirst')}</option>
          {stations.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select name="walkMax" aria-label={t('search.walkMinutesAll')} className={fieldClassName}>
          <option value="">{t('search.walkMinutesAll')}</option>
          {walkOptions.map((value) => (
            <option key={value} value={value}>
              {t(`search.walkMinutes${value}`)}
            </option>
          ))}
        </select>

        <select name="areaMin" aria-label={t('search.buildingAreaAll')} className={cn(fieldClassName, compact ? 'md:w-28' : 'md:w-32')}>
          <option value="">{t('search.buildingAreaAll')}</option>
          {areaOptions.map((value) => (
            <option key={value} value={value}>
              {value}㎡+
            </option>
          ))}
        </select>

        </div>
      </details>
    </form>
  )
}
