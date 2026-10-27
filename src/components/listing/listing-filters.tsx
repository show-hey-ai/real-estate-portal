'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { ChevronDown, Search, SlidersHorizontal, TrainFront, X } from 'lucide-react'
import { getPortalHomeCopy, getPortalPropertyTypes } from '@/lib/portal-copy'
import { type PublicSearchLocationIndex } from '@/lib/public-search'
import {
  SEARCH_FILTER_KEYS,
  type InventoryDistributions,
} from '@/lib/listing-search'
import { getSearchExperienceCopy } from '@/lib/search-experience-copy'
import { getTransitCopy } from '@/lib/transit/copy'
import type { TransitOptions } from '@/lib/transit/search'
import { translateCityName } from '@/lib/translate-basic'
import { LocationSearch } from './location-search'
import { SearchRange } from './search-range'
import { useListingSearch } from './use-listing-search'

interface ListingFiltersProps {
  locationIndex: PublicSearchLocationIndex
  transit: TransitOptions
  /** Names for older single line/station links ("line:…", "station:…"), translated on the server. */
  transitLabels?: Record<string, string>
  total: number
  distribution: InventoryDistributions
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

/** The chosen lines and stations (and older single line/station links), each removable. */
function TransitChoice({ transit, transitLabels, locale, searchParams, update }: {
  transit: TransitOptions
  transitLabels: Record<string, string>
  locale: string
  searchParams: URLSearchParams
  update: (updates: Record<string, string>) => void
}) {
  const copy = getTransitCopy(locale)
  const lineIds = (searchParams.get('lines') ?? '').split(',').filter(Boolean)
  const slugs = (searchParams.get('stations') ?? '').split(',').filter(Boolean)
  const stationLabels = new Map(transit.lines.flatMap((line) => line.stations.map((station): [string, string] => [station.value, station.label])))
  const without = (values: string[], value: string) => values.filter((item) => item !== value).join(',')
  const chips: { key: string; label: string; remove: Record<string, string> }[] = [
    ...lineIds.map((id) => ({ key: `lines:${id}`, label: transit.lines.find((line) => line.value === id)?.label ?? id, remove: { lines: without(lineIds, id) } })),
    ...slugs.map((slug) => ({ key: `stations:${slug}`, label: stationLabels.get(slug) ?? slug, remove: { stations: without(slugs, slug) } })),
    ...(searchParams.get('line') ? [{ key: 'line', label: transitLabels[`line:${searchParams.get('line')}`] ?? searchParams.get('line')!, remove: { line: '', station: '' } }] : []),
    ...(searchParams.get('station') ? [{ key: 'station', label: transitLabels[`station:${searchParams.get('station')}`] ?? searchParams.get('station')!, remove: { station: '' } }] : []),
  ]
  return <div className="space-y-2" data-testid="transit-choice">
    <h3 className="flex items-center gap-1.5 text-xs font-medium text-[#536d76]"><TrainFront aria-hidden="true" className="h-3.5 w-3.5" />{copy.entryTitle}</h3>
    {chips.length > 0 && <ul className="flex flex-wrap gap-1.5">
      {chips.map((chip) => <li key={chip.key}>
        <button type="button" onClick={() => update(chip.remove)} aria-label={copy.remove(chip.label)} className="inline-flex items-center gap-1 rounded-full bg-[#e4e9ef] px-2.5 py-1 text-xs font-semibold text-[#2d3d51]">{chip.label}<X aria-hidden="true" className="h-3 w-3" /></button>
      </li>)}
    </ul>}
    <Link href={`/lines${searchParams.toString() ? `?${searchParams.toString()}` : ''}`} className="flex h-10 items-center justify-center rounded-lg border border-[#cfd5dd] bg-white text-xs font-semibold text-[#274d7d] hover:bg-[#edf1f5]">{chips.length ? copy.change : copy.choose}</Link>
  </div>
}

export function ListingFilters({
  locationIndex,
  transit,
  transitLabels = {},
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
  const activeCount = SEARCH_FILTER_KEYS.filter((key) =>
    searchParams.get(key)
  ).length

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#d6dce3] bg-[#f8f9fb]"
      aria-busy={isPending}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="listing-search-controls"
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4 text-[#274d7d]" />
        <span className="flex-1 text-sm font-semibold text-[#2d3d51]">
          {homeCopy.moreFilters}
        </span>
        <span className="rounded-full bg-[#e4e9ef] px-2 py-0.5 text-xs text-[#274d7d]">
          {activeCount}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-[#626e7d] transition ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      <div
        id="listing-search-controls"
        className={`${isExpanded ? 'block' : 'hidden'} space-y-6 px-5 py-5 lg:block lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[#2b3c51]">
            {copy.allCriteria}
          </h2>
          <span className="rounded-full bg-[#e4e9ef] px-2.5 py-1 text-xs tabular-nums text-[#274d7d]">
            {total.toLocaleString(locale)} {copy.results}
          </span>
        </div>
        <LocationSearch
          locale={locale}
          locationIndex={locationIndex}
          transit={transit}
          onSelect={update}
        />
        <TransitChoice transit={transit} transitLabels={transitLabels} locale={locale} searchParams={new URLSearchParams(searchParams.toString())} update={update} />
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
                className={`rounded-lg border px-1 py-2.5 text-xs font-medium transition ${searchParams.get('category') === value ? 'border-[#274d7d] bg-[#274d7d] text-white' : 'border-[#d4d9e0] bg-white text-[#566271] hover:bg-[#edf1f5]'}`}
              >
                <span className="block">{label}</span>
                {distribution.categories && (
                  <span className={`mt-0.5 block text-[10px] tabular-nums ${searchParams.get('category') === value ? 'text-white/80' : 'text-[#7b848f]'}`}>
                    {distribution.categories[value]} {copy.results}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-[#dde2e7] pt-5">
          <SearchRange
            key={`price:${locale}:${searchParams.get('priceMin')}:${searchParams.get('priceMax')}`}
            locale={locale}
            kind="price"
            min={searchParams.get('priceMin')}
            max={searchParams.get('priceMax')}
            distribution={distribution.price}
            onApply={(min, max) => update({ priceMin: min, priceMax: max })}
          />
        </div>
        <div className="border-t border-[#dde2e7] pt-5">
          <SearchRange
            key={`area:${locale}:${searchParams.get('areaMin')}:${searchParams.get('areaMax')}`}
            locale={locale}
            kind="area"
            min={searchParams.get('areaMin')}
            max={searchParams.get('areaMax')}
            distribution={distribution.area}
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
          className="group border-t border-[#dde2e7] pt-4"
          open={Boolean(
            searchParams.get('type') ||
            searchParams.get('q') ||
            searchParams.get('ward')
          )}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold text-[#3e4e62] [&::-webkit-details-marker]:hidden">
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
                  className="shrink-0 rounded-lg bg-[#274d7d] px-3 text-white hover:bg-[#284160]"
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
          className="w-full rounded-lg border border-[#cfd5dd] bg-white py-2.5 text-xs font-semibold text-[#5f6c7b] hover:bg-[#edf1f5]"
        >
          {copy.clear}
        </button>
      </div>
    </section>
  )
}
