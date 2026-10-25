'use client'

import { useEffect } from 'react'
import { LISTS_CHANGED_EVENT, readFavorites, readRecent, writeFavorites, writeRecent, type FavoriteEntry } from '@/lib/browser-lists'
import { SAVED_SEARCH_CHANGE_EVENT, SAVED_SEARCH_STORAGE_KEY, readSavedSearches } from '@/lib/listing-search'
import { PROFILE_CHANGED_AT_KEY, PROFILE_CHANGE_EVENT, PROFILE_STORAGE_KEY, parseStoredProfile } from '@/lib/buyer-profile'
import {
  MEMBER_CLEAR_RECENT_EVENT, MEMBER_REMOVE_SEARCH_EVENT, MEMBER_SYNCED_EVENT, MEMBER_SYNC_KEY,
  changesSince, mergeRecent, mergeSavedSearches, type MemberState,
} from '@/lib/member-lists'

const DEBOUNCE_MS = 1500

function storage(): Storage | null {
  try { return window.localStorage } catch { return null }
}

function lastSync(store: Storage, userId: string): number {
  try {
    const marker = JSON.parse(store.getItem(MEMBER_SYNC_KEY) ?? 'null') as { user?: unknown; at?: unknown } | null
    return marker?.user === userId && typeof marker.at === 'number' ? marker.at : 0
  } catch {
    return 0
  }
}

/** Favorites from the account, plus any this browser added while the request was in flight. */
function mergeFavorites(account: FavoriteEntry[], local: FavoriteEntry[], since: number): FavoriteEntry[] {
  const fresh = changesSince(local, since, (item) => item.addedAt).filter((item) => !account.some((entry) => entry.id === item.id))
  return [...fresh, ...account]
}

/**
 * For signed-in members: sends what this browser added since its last sync to the account, then
 * copies the account's lists back, so favorites, history, saved searches and buyer answers match
 * on every device. Mounted only for signed-in visitors.
 */
export function MemberSync({ userId }: { userId: string }) {
  useEffect(() => {
    let applying = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let running: Promise<void> = Promise.resolve()

    async function sync(extra: Record<string, unknown> = {}, onlyIfChanged = false) {
      const store = storage()
      if (!store) return
      const since = lastSync(store, userId)
      const startedAt = Date.now()
      const changes = {
        favorites: changesSince(readFavorites(store), since, (item) => item.addedAt),
        recent: changesSince(readRecent(store), since, (item) => item.viewedAt),
        savedSearches: changesSince(readSavedSearches(store.getItem(SAVED_SEARCH_STORAGE_KEY)), since, (item) => Date.parse(item.savedAt)),
        ...(Number(store.getItem(PROFILE_CHANGED_AT_KEY) ?? 0) > since ? { buyerProfile: parseStoredProfile(store.getItem(PROFILE_STORAGE_KEY)) } : {}),
        ...extra,
      }
      const changed = Object.keys(extra).length > 0 || changes.favorites.length > 0 || changes.recent.length > 0 || changes.savedSearches.length > 0 || 'buyerProfile' in changes
      if (onlyIfChanged && !changed) return
      const res = await fetch('/api/member/lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }).catch(() => null)
      if (!res?.ok) return
      const state = await res.json() as MemberState
      applying = true
      try {
        writeFavorites(store, mergeFavorites(state.favorites, readFavorites(store), startedAt))
        writeRecent(store, mergeRecent(state.recent, changesSince(readRecent(store), startedAt, (item) => item.viewedAt)))
        const newSearches = changesSince(readSavedSearches(store.getItem(SAVED_SEARCH_STORAGE_KEY)), startedAt, (item) => Date.parse(item.savedAt))
        store.setItem(SAVED_SEARCH_STORAGE_KEY, JSON.stringify(mergeSavedSearches([state.savedSearches, newSearches])))
        if (Object.keys(state.buyerProfile).length && Number(store.getItem(PROFILE_CHANGED_AT_KEY) ?? 0) <= startedAt) store.setItem(PROFILE_STORAGE_KEY, JSON.stringify(state.buyerProfile))
        store.setItem(MEMBER_SYNC_KEY, JSON.stringify({ user: userId, at: startedAt }))
        for (const name of [LISTS_CHANGED_EVENT, SAVED_SEARCH_CHANGE_EVENT, PROFILE_CHANGE_EVENT, MEMBER_SYNCED_EVENT]) window.dispatchEvent(new Event(name))
      } catch {
        // Storage may be full or blocked; the account copy is still saved.
      } finally {
        applying = false
      }
    }

    // One request at a time, in order.
    const queue = (extra?: Record<string, unknown>, onlyIfChanged = false) => { running = running.then(() => sync(extra, onlyIfChanged)) }
    const onChange = () => {
      if (applying) return
      clearTimeout(timer)
      timer = setTimeout(() => queue(undefined, true), DEBOUNCE_MS)
    }
    const onRemoveSearch = (event: Event) => {
      const query = (event as CustomEvent<unknown>).detail
      if (typeof query === 'string') queue({ removedSearches: [query] })
    }
    const onClearRecent = () => queue({ clearRecent: true })

    queue()
    for (const name of [LISTS_CHANGED_EVENT, SAVED_SEARCH_CHANGE_EVENT, PROFILE_CHANGE_EVENT]) window.addEventListener(name, onChange)
    window.addEventListener(MEMBER_REMOVE_SEARCH_EVENT, onRemoveSearch)
    window.addEventListener(MEMBER_CLEAR_RECENT_EVENT, onClearRecent)
    return () => {
      clearTimeout(timer)
      for (const name of [LISTS_CHANGED_EVENT, SAVED_SEARCH_CHANGE_EVENT, PROFILE_CHANGE_EVENT]) window.removeEventListener(name, onChange)
      window.removeEventListener(MEMBER_REMOVE_SEARCH_EVENT, onRemoveSearch)
      window.removeEventListener(MEMBER_CLEAR_RECENT_EVENT, onClearRecent)
    }
  }, [userId])
  return null
}
