'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
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

const propertyTypes = [
  { value: '区分マンション', labelKey: 'types.mansion' },
  { value: '一棟アパート', labelKey: 'types.apartment' },
  { value: '一棟マンション', labelKey: 'types.building' },
  { value: '戸建', labelKey: 'types.house' },
  { value: '土地', labelKey: 'types.land' },
]

const areaOptions = ['20', '50', '100', '200']
const priceOptions = ['30000000', '50000000', '100000000', '300000000']
const walkOptions = ['5', '10', '15']

export function HomeSearchForm({ compact = false, locationIndex }: HomeSearchFormProps) {
  const t = useTranslations()
  const locale = useLocale()
  const [line, setLine] = useState('')
  const [station, setStation] = useState('')

  const stations = getStationsForLine(locationIndex, line)

  const fieldClassName = cn(
    'rounded-md border border-input bg-background text-sm',
    compact ? 'h-10 px-2 md:w-[150px]' : 'h-11 px-3 md:w-[160px]'
  )

  return (
    <form action="/listings" method="get" className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          name="q"
          placeholder={t('search.keywordPlaceholder')}
          className={cn(
            'flex-1 rounded-md border border-input bg-background',
            compact ? 'h-10 px-3 text-sm' : 'h-11 px-4'
          )}
        />
        <select name="type" className={cn(fieldClassName, compact ? 'md:w-32' : 'md:w-36')}>
          <option value="">{t('search.allTypes')}</option>
          {propertyTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {t(`listing.${type.labelKey}`)}
            </option>
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
      </div>

      <div className="flex flex-col md:flex-row md:flex-wrap gap-2">
        <select name="ward" className={fieldClassName}>
          <option value="">{t('search.allTokyo13Wards')}</option>
          {locationIndex.wards.map((ward) => (
            <option key={ward} value={ward}>
              {translateCityName(ward, locale) || ward}
            </option>
          ))}
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

        <Button
          type="submit"
          size={compact ? 'default' : 'lg'}
          className={cn(compact ? 'h-10 md:ml-auto' : 'h-11 md:ml-auto')}
        >
          <Search className="mr-2 h-4 w-4" />
          {t('search.search')}
        </Button>
      </div>
    </form>
  )
}
