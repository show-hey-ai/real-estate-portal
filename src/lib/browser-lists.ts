// Per-browser lists kept in localStorage: listings to compare and recently viewed listings.
// They hold public listing facts only and work without an account.

export const COMPARE_KEY = 'ziyou-compare'
export const RECENT_KEY = 'ziyou-recent'
export const COMPARE_LIMIT = 3
export const RECENT_LIMIT = 8
export const LISTS_CHANGED_EVENT = 'ziyou-lists-changed'

export interface RecentListing {
  id: string
  title: string
  price: string
  image: string | null
  imageCaption?: string | null
  viewedAt: number
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

export function readRecent(storage: StorageLike | null): RecentListing[] {
  const value = readJson(storage, RECENT_KEY)
  if (!Array.isArray(value)) return []
  return value.filter((item): item is RecentListing =>
    !!item && typeof item === 'object' && typeof item.id === 'string' && ID_PATTERN.test(item.id)
    && typeof item.title === 'string' && typeof item.price === 'string' && typeof item.viewedAt === 'number'
    && (item.image === null || (typeof item.image === 'string' && /^https:\/\//.test(item.image))),
  ).slice(0, RECENT_LIMIT)
}

/** Records a view, newest first, without duplicates. */
export function recordRecent(storage: StorageLike | null, listing: Omit<RecentListing, 'viewedAt'>, now = Date.now()): RecentListing[] {
  if (!ID_PATTERN.test(listing.id)) return readRecent(storage)
  const next = [{ ...listing, viewedAt: now }, ...readRecent(storage).filter((item) => item.id !== listing.id)].slice(0, RECENT_LIMIT)
  write(storage, RECENT_KEY, next)
  return next
}
