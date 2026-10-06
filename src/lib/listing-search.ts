import { getMarketCategory, type MarketListingFacts } from './market-category'
import { matchesTransitFilters } from './public-search'

export const SEARCH_FILTER_KEYS = [
  'q',
  'category',
  'type',
  'ward',
  'line',
  'station',
  'prefecture',
  'priceMin',
  'priceMax',
  'areaMin',
  'areaMax',
  'walkMax',
] as const
export type SearchFilterKey = (typeof SEARCH_FILTER_KEYS)[number]
export type SearchCriteria = Partial<Record<SearchFilterKey | 'sort', string>>
export const SAVED_SEARCH_STORAGE_KEY = 'ziyou:searches:v1'

export function searchNumber(
  value: string | undefined,
  kind: 'price' | 'area' | 'walk'
): number | null {
  if (!value) return null
  const pattern =
    kind === 'area'
      ? /^\d{1,6}(?:\.\d{1,2})?$/u
      : kind === 'price'
        ? /^\d{1,12}$/u
        : /^\d{1,3}$/u
  return pattern.test(value) ? Number(value) : null
}

/** Save only public search criteria, never arbitrary URLs, page offsets or listing data. */
export function canonicalSearchQuery(input: URLSearchParams): string {
  const output = new URLSearchParams()
  for (const key of SEARCH_FILTER_KEYS) {
    const value = input.get(key)?.trim().slice(0, 120)
    if (!value) continue
    if (key.startsWith('price') && searchNumber(value, 'price') === null)
      continue
    if (key.startsWith('area') && searchNumber(value, 'area') === null) continue
    if (key === 'walkMax' && searchNumber(value, 'walk') === null) continue
    output.set(key, value)
  }
  const sort = input.get('sort')
  if (sort === 'price_asc' || sort === 'price_desc') output.set('sort', sort)
  return output.toString()
}

interface SearchableListing extends MarketListingFacts {
  buildingArea: number | string | null
  landArea: number | string | null
  stations:
    | {
        name?: string | null
        line?: string | null
        walk_minutes?: number | null
      }[]
    | null
}

/** Walk time must belong to the selected station/line, rather than a different nearby station. */
export function matchesListingDetails(
  listing: SearchableListing,
  criteria: SearchCriteria
): boolean {
  if (criteria.category && getMarketCategory(listing) !== criteria.category)
    return false
  const minArea = searchNumber(criteria.areaMin, 'area')
  const maxArea = searchNumber(criteria.areaMax, 'area')
  if (minArea !== null || maxArea !== null) {
    const rawArea =
      listing.propertyType === '土地' ? listing.landArea : listing.buildingArea
    if (rawArea === null) return false
    const area = Number(rawArea)
    if (
      !Number.isFinite(area) ||
      (minArea !== null && area < minArea) ||
      (maxArea !== null && area > maxArea)
    )
      return false
  }
  const maxWalk = searchNumber(criteria.walkMax, 'walk')
  if (maxWalk === null)
    return matchesTransitFilters(
      listing.stations,
      criteria.line,
      criteria.station
    )
  return (listing.stations || []).some(
    (station) =>
      station.walk_minutes != null &&
      station.walk_minutes >= 0 &&
      station.walk_minutes <= maxWalk &&
      matchesTransitFilters([station], criteria.line, criteria.station)
  )
}

export interface PriceDistribution {
  count: number
  min: number
  max: number
  bins: { from: number; to: number; count: number }[]
}

/** These are visible listing asking prices, not transactions or a market-wide valuation. */
export function priceDistribution(
  values: (number | string | null)[]
): PriceDistribution | null {
  const prices = values
    .filter((value) => value !== null)
    .map(Number)
    .filter((value) => Number.isFinite(value) && value > 0)
  if (prices.length < 5) return null
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const width = max === min ? 1 : (max - min) / 12
  const bins = Array.from({ length: max === min ? 1 : 12 }, (_, index) => ({
    from: min + index * width,
    to: min + (index + 1) * width,
    count: 0,
  }))
  for (const price of prices)
    bins[Math.min(bins.length - 1, Math.floor((price - min) / width))].count++
  return { count: prices.length, min, max, bins }
}

export interface SavedSearch {
  query: string
  savedAt: string
}

export function readSavedSearches(raw: string | null): SavedSearch[] {
  if (!raw || raw.length > 16_000) return []
  try {
    const entries: unknown = JSON.parse(raw)
    if (!Array.isArray(entries)) return []
    const seen = new Set<string>()
    return entries.slice(0, 8).flatMap((entry) => {
      if (
        !entry ||
        typeof entry.query !== 'string' ||
        entry.query.length > 1500 ||
        typeof entry.savedAt !== 'string' ||
        !Number.isFinite(Date.parse(entry.savedAt))
      )
        return []
      const query = canonicalSearchQuery(new URLSearchParams(entry.query))
      if (!query || seen.has(query)) return []
      seen.add(query)
      return [{ query, savedAt: entry.savedAt }]
    })
  } catch {
    return []
  }
}
