'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPortalHomeCopy, getPortalPropertyTypes } from '@/lib/portal-copy'
import { cn } from '@/lib/utils'
import {
  getStationsForLine,
  normalizeRailwayLine,
  type PublicSearchLocationIndex,
} from '@/lib/public-search'
import {
  translateCityName,
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'

interface HomeSearchFormProps {
  compact?: boolean
  locationIndex: PublicSearchLocationIndex
}

const areaOptions = ['20', '50', '100', '200']
const priceOptions = ['30000000', '50000000', '100000000', '300000000']
const walkOptions = ['5', '10', '15']

export function HomeSearchForm({ compact = false, locationIndex }: HomeSearchFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [line, setLine] = useState('')
  const [station, setStation] = useState('')
  const propertyTypes = getPortalPropertyTypes(locale)
  const copy = getPortalHomeCopy(locale)

  const stations = getStationsForLine(locationIndex, line)

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
          placeholder={t('search.keywordPlaceholder')}
          className={cn(
            'flex-1 rounded-[4px] border border-[#cbd5df] bg-white text-[#1b293a] outline-none transition placeholder:text-[#8b98a6] focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15',
            compact ? 'h-10 px-3 text-sm' : 'h-11 px-4'
          )}
        />
        <select name="ward" className={fieldClassName}>
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
        <select name="priceMax" className={cn(fieldClassName, compact ? 'md:w-28' : 'md:w-32')}>
          <option value="">{t('search.priceRange')}</option>
          {priceOptions.map((value) => (
            <option key={value} value={value}>
              {value === '30000000' ? (locale === 'en' ? '~¥30M' : '~3,000万') : null}
              {value === '50000000' ? (locale === 'en' ? '~¥50M' : '~5,000万') : null}
              {value === '100000000' ? (locale === 'en' ? '~¥100M' : '~1億') : null}
              {value === '300000000' ? (locale === 'en' ? '~¥300M' : '~3億') : null}
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
        <select name="type" className={fieldClassName}>
          <option value="">{t('search.allTypes')}</option>
          {propertyTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        <select
          name="line"
          value={line}
          onChange={(event) => {
            setLine(normalizeRailwayLine(event.target.value))
            setStation('')
          }}
          className={fieldClassName}
        >
          <option value="">{t('search.allLines')}</option>
          {locationIndex.lines.map((option) => (
            <option key={option} value={option}>
              {translateRailwayLine(option, locale) || option}
            </option>
          ))}
        </select>

        <select
          name="station"
          value={station}
          onChange={(event) => setStation(event.target.value)}
          disabled={!line}
          className={fieldClassName}
        >
          <option value="">{line ? t('search.allStations') : t('search.selectLineFirst')}</option>
          {stations.map((station) => (
            <option key={station} value={station}>
              {translateStationName(station, locale) || station}
            </option>
          ))}
        </select>

        <select name="walkMax" className={fieldClassName}>
          <option value="">{t('search.walkMinutesAll')}</option>
          {walkOptions.map((value) => (
            <option key={value} value={value}>
              {t(`search.walkMinutes${value}`)}
            </option>
          ))}
        </select>

        <select name="areaMin" className={cn(fieldClassName, compact ? 'md:w-28' : 'md:w-32')}>
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
