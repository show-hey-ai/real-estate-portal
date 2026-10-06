'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import { getPortalHomeCopy, getPortalPropertyTypes } from '@/lib/portal-copy'
import {
  getStationsForLine,
  normalizeRailwayLine,
  type PublicSearchLocationIndex,
} from '@/lib/public-search'
import {
  SEARCH_FILTER_KEYS,
  type PriceDistribution,
} from '@/lib/listing-search'
import { getSearchExperienceCopy } from '@/lib/search-experience-copy'
import {
  translateCityName,
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'
import { LocationSearch } from './location-search'
import { SearchRange } from './search-range'
import { useListingSearch } from './use-listing-search'

interface ListingFiltersProps {
  locationIndex: PublicSearchLocationIndex
  total: number
  distribution: PriceDistribution | null
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: [string, string][]
  onChange: (value: string) => void
}) {
  return (
    <label className="block space-y-2 text-xs font-medium text-[#536d76]">
      <span>{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full min-w-0 rounded-lg border border-[#ccd8dc] bg-white px-2.5 text-sm font-normal text-[#304951] outline-none focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15"
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ListingFilters({
  locationIndex,
  total,
  distribution,
}: ListingFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const locale = useLocale()
  const t = useTranslations('search')
  const copy = getSearchExperienceCopy(locale)
  const homeCopy = getPortalHomeCopy(locale)
  const { searchParams, isPending, update, navigate } = useListingSearch()
  const propertyTypes = getPortalPropertyTypes(locale)
  const selectedLine = normalizeRailwayLine(searchParams.get('line'))
  const stationOptions = selectedLine
    ? getStationsForLine(locationIndex, selectedLine)
    : [...new Set(Object.values(locationIndex.stationsByLine).flat())].sort(
        (a, b) => a.localeCompare(b, 'ja')
      )
  const activeCount = SEARCH_FILTER_KEYS.filter((key) =>
    searchParams.get(key)
  ).length

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#d6e3df] bg-[#f8fbfa]"
      aria-busy={isPending}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="listing-search-controls"
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-[#39786e]" />
        <span className="flex-1 text-sm font-semibold text-[#2d5148]">
          {homeCopy.moreFilters}
        </span>
        <span className="rounded-full bg-[#e4efe9] px-2 py-0.5 text-xs text-[#39786e]">
          {activeCount}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#627d72] transition ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id="listing-search-controls"
        className={`${isExpanded ? 'block' : 'hidden'} space-y-6 px-5 py-5 lg:block lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#2b5147]">
            {copy.allCriteria}
          </h2>
          <span className="rounded-full bg-[#e4efe9] px-2.5 py-1 text-xs tabular-nums text-[#39786e]">
            {total.toLocaleString(locale)} {copy.results}
          </span>
        </div>
        <LocationSearch
          locale={locale}
          locationIndex={locationIndex}
          onSelect={update}
        />
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-[#536d76]">
            {homeCopy.categoryTitle}
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {homeCopy.categories.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={searchParams.get('category') === value}
                onClick={() =>
                  update({
                    category:
                      searchParams.get('category') === value ? '' : value,
                  })
                }
                className={`rounded-lg border px-1 py-2.5 text-xs font-medium transition ${searchParams.get('category') === value ? 'border-[#39786e] bg-[#39786e] text-white' : 'border-[#d4e0dc] bg-white text-[#567168] hover:bg-[#edf5f1]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-[#dde7e2] pt-5">
          <SearchRange
            key={`price:${locale}:${searchParams.get('priceMin')}:${searchParams.get('priceMax')}`}
            locale={locale}
            kind="price"
            min={searchParams.get('priceMin')}
            max={searchParams.get('priceMax')}
            distribution={distribution}
            onApply={(min, max) => update({ priceMin: min, priceMax: max })}
          />
        </div>
        <div className="border-t border-[#dde7e2] pt-5">
          <SearchRange
            key={`area:${locale}:${searchParams.get('areaMin')}:${searchParams.get('areaMax')}`}
            locale={locale}
            kind="area"
            min={searchParams.get('areaMin')}
            max={searchParams.get('areaMax')}
            onApply={(min, max) => update({ areaMin: min, areaMax: max })}
          />
        </div>
        <FilterSelect
          label={copy.walk}
          value={searchParams.get('walkMax') || ''}
          onChange={(value) => update({ walkMax: value })}
          options={[
            ['', t('walkMinutesAll')],
            ...[5, 10, 15, 20, 30].map((minutes): [string, string] => [
              String(minutes),
              `${minutes} ${copy.minutes}`,
            ]),
          ]}
        />
        <details
          className="group border-t border-[#dde7e2] pt-4"
          open={Boolean(
            searchParams.get('type') ||
            searchParams.get('q') ||
            searchParams.get('ward') ||
            selectedLine ||
            searchParams.get('station')
          )}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-[#3e6258] [&::-webkit-details-marker]:hidden">
            {copy.details}
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-4">
            <FilterSelect
              label={copy.type}
              value={searchParams.get('type') || ''}
              onChange={(value) => update({ type: value })}
              options={[
                ['', t('allTypes')],
                ...propertyTypes.map((type): [string, string] => [
                  type.value,
                  type.label,
                ]),
              ]}
            />
            <FilterSelect
              label={copy.ward}
              value={searchParams.get('ward') || ''}
              onChange={(value) => update({ ward: value })}
              options={[
                ['', t('allTokyo23Wards')],
                ...locationIndex.wards.map((ward): [string, string] => [
                  ward,
                  translateCityName(ward, locale) || ward,
                ]),
              ]}
            />
            <FilterSelect
              label={copy.line}
              value={selectedLine}
              onChange={(value) => update({ line: value, station: '' })}
              options={[
                ['', t('allLines')],
                ...locationIndex.lines.map((line): [string, string] => [
                  line,
                  translateRailwayLine(line, locale) || line,
                ]),
              ]}
            />
            <FilterSelect
              label={copy.station}
              value={searchParams.get('station') || ''}
              onChange={(value) => update({ station: value })}
              options={[
                ['', t('allStations')],
                ...stationOptions.map((station): [string, string] => [
                  station,
                  translateStationName(station, locale) || station,
                ]),
              ]}
            />
            <form
              onSubmit={(event) => {
                event.preventDefault()
                update({
                  q: String(new FormData(event.currentTarget).get('q') || ''),
                })
              }}
            >
              <label
                htmlFor="listing-keyword"
                className="mb-2 block text-xs font-medium text-[#536d76]"
              >
                {copy.keyword}
              </label>
              <div className="flex gap-2">
                <input
                  id="listing-keyword"
                  name="q"
                  key={searchParams.get('q')}
                  defaultValue={searchParams.get('q') || ''}
                  maxLength={80}
                  placeholder={t('keyword')}
                  className="h-10 w-full min-w-0 rounded-lg border border-[#ccd8dc] bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-[#274d7d]/15"
                />
                <button
                  type="submit"
                  aria-label={t('search')}
                  className="shrink-0 rounded-lg bg-[#39786e] px-3 text-white hover:bg-[#286054]"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </details>
        <button
          type="button"
          onClick={() => navigate('')}
          className="w-full rounded-lg border border-[#cfddd6] bg-white py-2.5 text-xs font-semibold text-[#5f7b70] hover:bg-[#edf5f1]"
        >
          {copy.clear}
        </button>
      </div>
    </section>
  )
}
