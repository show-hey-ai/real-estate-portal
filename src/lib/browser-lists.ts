// Per-browser lists kept in localStorage: listings to compare, recently viewed listings and favorites.
// They hold public listing facts only and work without an account; signed-in members also keep
// recent listings and favorites in their account (see member-lists.ts).

export const COMPARE_KEY = 'ziyou-compare'
export const RECENT_KEY = 'ziyou-recent'
export const FAVORITES_KEY = 'ziyou-favorites'
export const COMPARE_LIMIT = 3
export const RECENT_LIMIT = 50
export const FAVORITES_LIMIT = 100
export const LISTS_CHANGED_EVENT = 'ziyou-lists-changed'

export interface RecentListing {
  id: string
  title: string
  price: string
  image: string | null
  imageCaption?: string | null
  viewedAt: number
}

export interface FavoriteEntry {
  id: string
  addedAt: number
}

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

function readJson(storage: StorageLike | null, key: string): unknown {
  try {
    return JSON.parse(storage?.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function write(storage: StorageLike | null, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // Private mode or a full quota: the lists are a convenience and may be unavailable.
  }
}

export function readCompare(storage: StorageLike | null): string[] {
  const value = readJson(storage, COMPARE_KEY)
  return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && ID_PATTERN.test(id)).slice(0, COMPARE_LIMIT) : []
}

/** Adds or removes a listing. Adding beyond the limit drops the oldest entry. */
export function toggleCompare(storage: StorageLike | null, id: string): string[] {
  if (!ID_PATTERN.test(id)) return readCompare(storage)
  const current = readCompare(storage)
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-COMPARE_LIMIT)
  write(storage, COMPARE_KEY, next)
  return next
}

export function isRecentListing(item: unknown): item is RecentListing {
  if (!item || typeof item !== 'object') return false
  const entry = item as Record<string, unknown>
  return typeof entry.id === 'string' && ID_PATTERN.test(entry.id)
    && typeof entry.title === 'string' && entry.title.length <= 300 && typeof entry.price === 'string' && entry.price.length <= 80
    && typeof entry.viewedAt === 'number' && Number.isFinite(entry.viewedAt)
    && (entry.image === null || (typeof entry.image === 'string' && /^https:\/\//.test(entry.image) && entry.image.length <= 1000))
}

export function readRecent(storage: StorageLike | null): RecentListing[] {
  const value = readJson(storage, RECENT_KEY)
  return Array.isArray(value) ? value.filter(isRecentListing).slice(0, RECENT_LIMIT) : []
}

export function writeRecent(storage: StorageLike | null, list: RecentListing[]): void {
  write(storage, RECENT_KEY, list.slice(0, RECENT_LIMIT))
}

export function readFavorites(storage: StorageLike | null): FavoriteEntry[] {
  const value = readJson(storage, FAVORITES_KEY)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is FavoriteEntry =>
    !!item && typeof item === 'object' && typeof item.id === 'string' && ID_PATTERN.test(item.id) && typeof item.addedAt === 'number',
  ).slice(0, FAVORITES_LIMIT)
}

export function writeFavorites(storage: StorageLike | null, list: FavoriteEntry[]): void {
  write(storage, FAVORITES_KEY, list.slice(0, FAVORITES_LIMIT))
}

/** Adds (newest first) or removes a favorite; returns whether the listing is now a favorite. */
export function toggleFavorite(storage: StorageLike | null, id: string, now = Date.now()): boolean {
  if (!ID_PATTERN.test(id)) return false
  const current = readFavorites(storage)
  const present = current.some((item) => item.id === id)
  writeFavorites(storage, present ? current.filter((item) => item.id !== id) : [{ id, addedAt: now }, ...current])
  return !present
}

/** Records a view, newest first, without duplicates. */
export function recordRecent(storage: StorageLike | null, listing: Omit<RecentListing, 'viewedAt'>, now = Date.now()): RecentListing[] {
  if (!ID_PATTERN.test(listing.id)) return readRecent(storage)
  const next = [{ ...listing, viewedAt: now }, ...readRecent(storage).filter((item) => item.id !== listing.id)].slice(0, RECENT_LIMIT)
  write(storage, RECENT_KEY, next)
  return next
}
