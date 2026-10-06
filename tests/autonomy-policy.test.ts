import assert from 'node:assert/strict'
import test from 'node:test'
import { budgetAllows, defaultPolicy, policySchema, retryTime, scheduleKey, tokyoMonthStart } from '../src/lib/autonomy/policy'

test('a Tokyo month starts at midnight JST, including a UTC date in the previous month', () => {
  assert.equal(tokyoMonthStart(new Date('2026-10-01T00:00:00+09:00')).toISOString(), '2026-09-30T15:00:00.000Z')
  assert.equal(tokyoMonthStart(new Date('2026-09-30T14:59:59Z')).toISOString(), '2026-08-31T15:00:00.000Z')
})

test('periodic jobs share an idempotency key within their schedule slot', () => {
  assert.equal(scheduleKey('observe', new Date('2026-10-01T01:01:00Z'), 60), scheduleKey('observe', new Date('2026-10-01T01:59:00Z'), 60))
  assert.notEqual(scheduleKey('observe', new Date('2026-10-01T01:59:00Z'), 60), scheduleKey('observe', new Date('2026-10-01T02:01:00Z'), 60))
})

test('reservations must fit the budget and unknown commitments cannot be treated as zero', () => {
  assert.equal(budgetAllows(100, 80, 20), true)
  assert.equal(budgetAllows(100, 81, 20), false)
  assert.equal(budgetAllows(0, 0, 100), false)
  assert.equal(budgetAllows(100, Number.NaN, 20), false)
})

test('retries back off and operating scope cannot be expanded using extra fields', () => {
  const now = new Date('2026-10-01T00:00:00Z')
  assert.equal(retryTime(now, 1).getTime() - now.getTime(), 60_000)
  assert.equal(retryTime(now, 3).getTime() - now.getTime(), 240_000)
  assert.equal(policySchema.safeParse({ ...defaultPolicy, executeShell: true }).success, false)
  assert.equal(policySchema.safeParse({ ...defaultPolicy, maxAttempts: 100 }).success, false)
})
