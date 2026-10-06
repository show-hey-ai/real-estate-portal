'use client'

import { useMemo, useState, useSyncExternalStore } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Bookmark, Check, SlidersHorizontal, X } from 'lucide-react'
import {
  SEARCH_FILTER_KEYS,
  SAVED_SEARCH_STORAGE_KEY,
  canonicalSearchQuery,
  readSavedSearches,
  type SearchFilterKey,
} from '@/lib/listing-search'
import {
  getSearchExperienceCopy,
  formatSearchPrice,
} from '@/lib/search-experience-copy'
import { getPortalCategoryLabel } from '@/lib/portal-copy'
import { isMarketCategory } from '@/lib/market-category'
import {
  translateCityName,
  translatePropertyType,
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'
import { useListingSearch } from './use-listing-search'

const changeEvent = 'ziyou-searches-change'
function subscribe(callback: () => void) {
  function changed(event: StorageEvent) {
    if (event.key === SAVED_SEARCH_STORAGE_KEY || event.key === null) callback()
  }
  window.addEventListener('storage', changed)
  window.addEventListener(changeEvent, callback)
  return () => {
    window.removeEventListener('storage', changed)
    window.removeEventListener(changeEvent, callback)
  }
}
function snapshot() {
  try {
    return localStorage.getItem(SAVED_SEARCH_STORAGE_KEY)
  } catch {
    return null
  }
}
function serverSnapshot() {
  return null
}

function criterionLabel(key: SearchFilterKey, value: string, locale: string) {
  const copy = getSearchExperienceCopy(locale)
  if (key === 'category' && isMarketCategory(value))
    return getPortalCategoryLabel(locale, value)
  if (key === 'ward') return translateCityName(value, locale) || value
  if (key === 'line') return translateRailwayLine(value, locale) || value
  if (key === 'station') return translateStationName(value, locale) || value
  if (key === 'type') return translatePropertyType(value, locale) || value
  if (key.startsWith('price'))
    return `${formatSearchPrice(Number(value), locale)} ${key === 'priceMin' ? copy.from : copy.to}`
  if (key.startsWith('area'))
    return `${value}m² ${key === 'areaMin' ? copy.from : copy.to}`
  if (key === 'walkMax') return `${copy.walk} ${value} ${copy.minutes}`
  return value
}

export function SearchResultsToolbar({
  total,
  page,
  perPage,
}: {
  total: number
  page: number
  perPage: number
}) {
  const locale = useLocale()
  const t = useTranslations('search')
  const copy = getSearchExperienceCopy(locale)
  const { searchParams, isPending, navigate, update } = useListingSearch()
  const canonical = canonicalSearchQuery(
    new URLSearchParams(searchParams.toString())
  )
  const criteria = SEARCH_FILTER_KEYS.flatMap((key) => {
    const value = new URLSearchParams(canonical).get(key)
    return value
      ? [{ key, value, label: criterionLabel(key, value, locale) }]
      : []
  })
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const saved = useMemo(() => readSavedSearches(raw), [raw])
  const [showSaved, setShowSaved] = useState(false)
  const [notice, setNotice] = useState('')
  function persist(next: typeof saved) {
    try {
      localStorage.setItem(SAVED_SEARCH_STORAGE_KEY, JSON.stringify(next))
      window.dispatchEvent(new Event(changeEvent))
      return true
    } catch {
      setNotice(copy.storageError)
      return false
    }
  }
  function save() {
    if (!criteria.length) return
    if (
      persist(
        [
          { query: canonical, savedAt: new Date().toISOString() },
          ...saved.filter((item) => item.query !== canonical),
        ].slice(0, 8)
      )
    ) {
      setNotice(copy.savedNotice)
      setShowSaved(true)
    }
  }
  function savedLabel(query: string) {
    const params = new URLSearchParams(query)
    return SEARCH_FILTER_KEYS.flatMap((key) => {
      const value = params.get(key)
      return value ? [criterionLabel(key, value, locale)] : []
    }).join(' · ')
  }
  const currentSaved = saved.some((item) => item.query === canonical)
  return (
    <div
      className="mb-6 space-y-4"
      data-testid="search-results-toolbar"
      aria-busy={isPending}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce6e5] pb-5">
        <div
          role="status"
          aria-live="polite"
          className="flex items-baseline gap-2"
        >
          <span className="text-4xl font-medium tracking-tight text-[#214b43]">
            {total.toLocaleString(locale)}
          </span>
          <span className="text-sm text-[#687e83]">
            {copy.results}
            {criteria.length > 0 && (
              <span className="ml-2 text-xs">/ {copy.matches}</span>
            )}
          </span>
        </div>
        <label className="flex items-center gap-2 text-xs text-[#657b82]">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="sr-only">{copy.sort}</span>
          <select
            aria-label={copy.sort}
            value={searchParams.get('sort') || 'newest'}
            onChange={(event) => update({ sort: event.target.value })}
            className="h-10 max-w-full rounded-lg border border-[#d6e2e1] bg-white px-3 text-sm text-[#304950] outline-none focus:ring-2 focus:ring-[#274d7d]/15"
          >
            <option value="newest">{t('sortNewest')}</option>
            <option value="price_asc">{t('sortPriceAsc')}</option>
            <option value="price_desc">{t('sortPriceDesc')}</option>
          </select>
        </label>
      </div>
      {criteria.length > 0 && (
        <div aria-label={copy.criteria} className="flex flex-wrap gap-2">
          {criteria.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              onClick={() =>
                update({
                  [key]: '',
                  ...(key === 'line' ? { station: '' } : {}),
                })
              }
              aria-label={`${copy.remove}: ${label}`}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#d7e5df] bg-[#f0f7f4] px-3 py-1.5 text-xs text-[#316353]"
            >
              <span className="break-words text-left">{label}</span>
              <X className="h-3 w-3 shrink-0" />
            </button>
          ))}
          <button
            type="button"
            onClick={() => navigate('')}
            className="px-2 text-xs text-[#6a7e84] underline underline-offset-4"
          >
            {copy.clear}
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!criteria.length}
          onClick={save}
          className="inline-flex items-center gap-2 rounded-lg border border-[#c9dcd5] px-3 py-2 text-xs font-medium text-[#2e6256] transition hover:bg-[#edf5f1] disabled:opacity-40"
        >
          {currentSaved ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
          {copy.save}
        </button>
        <button
          type="button"
          onClick={() => setShowSaved(!showSaved)}
          aria-expanded={showSaved}
          aria-controls="saved-searches"
          className="inline-flex items-center gap-2 px-3 py-2 text-xs text-[#6a7e84]"
        >
          {copy.saved}
          <span className="rounded-full bg-[#edf2f3] px-2 py-0.5 text-[10px]">
            {saved.length}
          </span>
        </button>
        {total > 0 && (page - 1) * perPage < total && (
          <span className="ml-auto text-xs text-[#809097]">
            {copy.range} {Math.min(total, (page - 1) * perPage + 1)}–
            {Math.min(total, page * perPage)}
          </span>
        )}
      </div>
      {showSaved && (
        <div
          id="saved-searches"
          className="space-y-2 rounded-xl border border-[#d9e5e1] bg-[#f7faf9] p-4"
        >
          <p className="text-xs text-[#73878b]">{copy.browserOnly}</p>
          {!saved.length && (
            <p className="text-sm text-[#667e83]">{copy.savedEmpty}</p>
          )}
          {saved.map((item) => (
            <div
              key={item.query}
              className="flex items-center gap-2 rounded-lg border border-[#e0e9e4] bg-white"
            >
              <button
                type="button"
                onClick={() => {
                  navigate(item.query)
                  setNotice('')
                }}
                className="min-w-0 flex-1 break-words px-3 py-3 text-left text-xs leading-5 text-[#335b50]"
              >
                {savedLabel(item.query)}
              </button>
              <button
                type="button"
                aria-label={`${copy.deleteSaved}: ${savedLabel(item.query)}`}
                onClick={() =>
                  persist(saved.filter((entry) => entry.query !== item.query))
                }
                className="mr-2 shrink-0 rounded-md p-2 text-[#7c8e90] hover:bg-[#eef4f1]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {notice && (
        <p role="status" className="text-xs text-[#39786e]">
          {notice}
        </p>
      )}
    </div>
  )
}
