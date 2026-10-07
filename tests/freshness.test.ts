import assert from 'node:assert/strict'
import test from 'node:test'
import { CHECK_VALIDITY_MS, listingUpdateDates, validUntilAfterCheck } from '../src/lib/freshness'

const DAY = 24 * 3600_000
const checkedAt = new Date('2026-10-07T05:00:00Z')

test('one check keeps a listing visible for the weekly interval plus a grace day', () => {
  assert.equal(CHECK_VALIDITY_MS, 8 * DAY)
  assert.deepEqual(validUntilAfterCheck(checkedAt), new Date('2026-10-15T05:00:00Z'))
})

test('display dates: updated on the check day, next update a week later', () => {
  const dates = listingUpdateDates({ autonomyValidUntil: validUntilAfterCheck(checkedAt), updatedAt: new Date('2026-09-01T00:00:00Z') })
  assert.deepEqual(dates, { updatedOn: checkedAt, nextUpdateOn: new Date('2026-10-14T05:00:00Z') })
})

test('manually managed listings show only when they were last edited', () => {
  const updatedAt = new Date('2026-10-01T00:00:00Z')
  assert.deepEqual(listingUpdateDates({ autonomyValidUntil: null, updatedAt }), { updatedOn: updatedAt, nextUpdateOn: null })
})

test('listings still on the old daily validity show that check and its 24-hour deadline', () => {
  const validUntil = new Date('2026-10-08T05:11:00Z')
  assert.deepEqual(listingUpdateDates({ autonomyValidUntil: validUntil, updatedAt: new Date('2026-10-01T00:00:00Z') }), {
    updatedOn: new Date('2026-10-07T05:11:00Z'),
    nextUpdateOn: validUntil,
  })
})
