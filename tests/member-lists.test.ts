import assert from 'node:assert/strict'
import test from 'node:test'
import { readFavorites, toggleFavorite } from '../src/lib/browser-lists'
import {
  MEMBER_RECENT_LIMIT, MEMBER_SEARCH_LIMIT, changesSince, mergeProfile, mergeRecent, mergeSavedSearches,
  sanitizeFavorites, sanitizeProfile, sanitizeRecent, sanitizeSavedSearches,
} from '../src/lib/member-lists'

const view = (id: string, viewedAt: number) => ({ id: `listing-${id}`, title: `L${id}`, price: '¥1M', image: null, viewedAt })

function memoryStorage() {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value) } }
}

test('history from two devices keeps one entry per listing, latest view first, up to the limit', () => {
  const phone = [view('a', 10), view('b', 30)]
  const computer = [view('a', 40), view('c', 20)]
  assert.deepEqual(mergeRecent(phone, computer).map((item) => [item.id, item.viewedAt]), [['listing-a', 40], ['listing-b', 30], ['listing-c', 20]])
  const many = Array.from({ length: MEMBER_RECENT_LIMIT + 5 }, (_, index) => view(String(index), index))
  assert.equal(mergeRecent(many).length, MEMBER_RECENT_LIMIT)
})

test('saved searches merge by search, drop removed ones and keep the limit', () => {
  const merged = mergeSavedSearches([
    [{ query: 'ward=港区', savedAt: '2026-10-20T00:00:00Z' }],
    [{ query: 'ward=港区', savedAt: '2026-10-25T00:00:00Z' }, { query: 'type=戸建', savedAt: '2026-10-21T00:00:00Z' }],
  ], ['type=戸建'])
  assert.equal(merged.length, 1)
  assert.equal(merged[0].savedAt, '2026-10-25T00:00:00Z')
  const many = Array.from({ length: MEMBER_SEARCH_LIMIT + 3 }, (_, index) => ({ query: `priceMin=${(index + 1) * 1000000}`, savedAt: new Date(2026, 9, 1, 0, index).toISOString() }))
  assert.equal(mergeSavedSearches([many]).length, MEMBER_SEARCH_LIMIT)
})

test('answers given on this device fill in or replace the stored buyer answers', () => {
  assert.deepEqual(mergeProfile({ buyer: 'individual', funding: 'cash' }, { funding: 'loan' }), { buyer: 'individual', funding: 'loan' })
})

test('only what changed after the last sync is sent', () => {
  assert.deepEqual(changesSince([view('a', 5), view('b', 15)], 10, (item) => item.viewedAt).map((item) => item.id), ['listing-b'])
})

test('anything malformed from a browser is dropped before it is stored', () => {
  assert.deepEqual(sanitizeRecent([view('a', 1), { id: 'x', title: 1 }, null, { ...view('b', 2), image: 'javascript:alert(1)' }]).map((item) => item.id), ['listing-a'])
  assert.deepEqual(sanitizeSavedSearches([{ query: 'ward=港区', savedAt: 'not a date' }, { query: 'ward=港区', savedAt: '2026-10-25T00:00:00Z' }]).length, 1)
  assert.deepEqual(sanitizeFavorites([{ id: 'listing-abc', addedAt: 1 }, { id: '../../etc', addedAt: 2 }, { id: 'listing-def' }]), [{ id: 'listing-abc', addedAt: 1 }])
  assert.deepEqual(sanitizeProfile({ buyer: 'individual', nationality: 'martian', extra: 'x' }), { buyer: 'individual' })
  assert.deepEqual(sanitizeProfile('nope'), {})
})

test('favorites work in the browser without an account', () => {
  const storage = memoryStorage()
  assert.equal(toggleFavorite(storage, 'listing-abc', 100), true)
  assert.equal(toggleFavorite(storage, 'listing-def', 200), true)
  assert.deepEqual(readFavorites(storage).map((item) => item.id), ['listing-def', 'listing-abc'])
  assert.equal(toggleFavorite(storage, 'listing-abc', 300), false)
  assert.deepEqual(readFavorites(storage), [{ id: 'listing-def', addedAt: 200 }])
  assert.equal(toggleFavorite(storage, 'bad id!', 400), false)
})
