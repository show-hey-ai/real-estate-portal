import assert from 'node:assert/strict'
import test from 'node:test'
import { COMPARE_LIMIT, RECENT_LIMIT, readCompare, readRecent, recordRecent, toggleCompare } from '../src/lib/browser-lists'

function memory() {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) }
}

test('compare toggles listings and keeps only the newest three', () => {
  const storage = memory()
  for (const id of ['aaaaaaaa', 'bbbbbbbb', 'cccccccc', 'dddddddd']) toggleCompare(storage, id)
  assert.deepEqual(readCompare(storage), ['bbbbbbbb', 'cccccccc', 'dddddddd'])
  assert.equal(readCompare(storage).length, COMPARE_LIMIT)
  assert.deepEqual(toggleCompare(storage, 'cccccccc'), ['bbbbbbbb', 'dddddddd'])
})

test('invalid ids and corrupted storage are ignored', () => {
  const storage = memory()
  assert.deepEqual(toggleCompare(storage, '<script>'), [])
  storage.setItem('ziyou-compare', 'not json')
  assert.deepEqual(readCompare(storage), [])
  assert.deepEqual(readCompare(null), [])
})

test('recent views are newest first, deduplicated and capped', () => {
  const storage = memory()
  for (let index = 0; index < RECENT_LIMIT + 2; index++) recordRecent(storage, { id: `listing-${index}`, title: `L${index}`, price: '¥1M', image: null }, index)
  recordRecent(storage, { id: 'listing-3', title: 'L3', price: '¥1M', image: 'https://example.com/a.png' }, 99)
  const recent = readRecent(storage)
  assert.equal(recent.length, RECENT_LIMIT)
  assert.equal(recent[0].id, 'listing-3')
  assert.equal(recent.filter((item) => item.id === 'listing-3').length, 1)
})

test('recent entries with unsafe images are dropped', () => {
  const storage = memory()
  storage.setItem('ziyou-recent', JSON.stringify([{ id: 'aaaaaaaa', title: 't', price: 'p', image: 'javascript:alert(1)', viewedAt: 1 }]))
  assert.deepEqual(readRecent(storage), [])
})
