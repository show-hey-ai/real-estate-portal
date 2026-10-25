// A signed-in member's lists are kept in the browser (as for every visitor) and in member_lists,
// so they follow the member across devices. These helpers validate and merge both copies.
import { FAVORITES_LIMIT, RECENT_LIMIT, isRecentListing, type FavoriteEntry, type RecentListing } from '@/lib/browser-lists'
import { SAVED_SEARCH_LIMIT, canonicalSearchQuery, type SavedSearch } from '@/lib/listing-search'
import { parseStoredProfile, type BuyerProfile } from '@/lib/buyer-profile'

export const MEMBER_RECENT_LIMIT = RECENT_LIMIT
export const MEMBER_SEARCH_LIMIT = SAVED_SEARCH_LIMIT
export const MEMBER_FAVORITE_LIMIT = FAVORITES_LIMIT

/** Browser events MemberSync listens for, so removals reach the account too. */
export const MEMBER_REMOVE_SEARCH_EVENT = 'ziyou-member-remove-search'
export const MEMBER_CLEAR_RECENT_EVENT = 'ziyou-member-clear-recent'
export const MEMBER_SYNCED_EVENT = 'ziyou-member-synced'
/** Which member this browser last synced, and when (ms). */
export const MEMBER_SYNC_KEY = 'ziyou-member-sync'

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

export interface MemberState {
  favorites: FavoriteEntry[]
  recent: RecentListing[]
  savedSearches: SavedSearch[]
  buyerProfile: BuyerProfile
}

export function sanitizeRecent(value: unknown): RecentListing[] {
  return Array.isArray(value) ? value.filter(isRecentListing) : []
}

export function sanitizeSavedSearches(value: unknown): SavedSearch[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const { query, savedAt } = entry as Record<string, unknown>
    if (typeof query !== 'string' || query.length > 1500 || typeof savedAt !== 'string' || !Number.isFinite(Date.parse(savedAt))) return []
    const canonical = canonicalSearchQuery(new URLSearchParams(query))
    return canonical ? [{ query: canonical, savedAt }] : []
  })
}

export function sanitizeFavorites(value: unknown): FavoriteEntry[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const { id, addedAt } = entry as Record<string, unknown>
    return typeof id === 'string' && ID_PATTERN.test(id) && typeof addedAt === 'number' && Number.isFinite(addedAt) ? [{ id, addedAt }] : []
  })
}

export function sanitizeProfile(value: unknown): BuyerProfile {
  return value && typeof value === 'object' ? parseStoredProfile(JSON.stringify(value)) : {}
}

/** One entry per listing, the latest view first. */
export function mergeRecent(...lists: RecentListing[][]): RecentListing[] {
  const latest = new Map<string, RecentListing>()
  for (const item of lists.flat()) {
    const seen = latest.get(item.id)
    if (!seen || item.viewedAt > seen.viewedAt) latest.set(item.id, item)
  }
  return [...latest.values()].sort((a, b) => b.viewedAt - a.viewedAt).slice(0, MEMBER_RECENT_LIMIT)
}

/** One entry per search, the latest save first; removed searches are dropped. */
export function mergeSavedSearches(lists: SavedSearch[][], removed: readonly string[] = []): SavedSearch[] {
  const canonical = (query: string) => canonicalSearchQuery(new URLSearchParams(query))
  const gone = new Set(removed.map(canonical))
  const latest = new Map<string, SavedSearch>()
  for (const item of lists.flat()) {
    const query = canonical(item.query)
    if (!query || gone.has(query)) continue
    const seen = latest.get(query)
    if (!seen || Date.parse(item.savedAt) > Date.parse(seen.savedAt)) latest.set(query, { query, savedAt: item.savedAt })
  }
  return [...latest.values()].sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt)).slice(0, MEMBER_SEARCH_LIMIT)
}

/** Answers given on this device fill in or replace the stored ones. */
export function mergeProfile(stored: BuyerProfile, incoming: BuyerProfile): BuyerProfile {
  return { ...stored, ...incoming }
}

/** What this device added since its last sync (everything, on its first sync for this member). */
export function changesSince<T>(items: T[], since: number, time: (item: T) => number): T[] {
  return items.filter((item) => time(item) > since)
}
