import assert from 'node:assert/strict'
import test from 'node:test'
import { parseDbTimestamp } from '../src/lib/db-timestamp'

test('zone-less database timestamps are read as UTC', () => {
  assert.equal(parseDbTimestamp('2026-10-06T01:51:48.849')?.toISOString(), '2026-10-06T01:51:48.849Z')
})

test('timestamps that already carry a zone are kept', () => {
  assert.equal(parseDbTimestamp('2026-10-06T10:51:48+09:00')?.toISOString(), '2026-10-06T01:51:48.000Z')
  assert.equal(parseDbTimestamp('2026-10-06T01:51:48.849Z')?.toISOString(), '2026-10-06T01:51:48.849Z')
})

test('empty or invalid values return null', () => {
  assert.equal(parseDbTimestamp(null), null)
  assert.equal(parseDbTimestamp('not a date'), null)
})
