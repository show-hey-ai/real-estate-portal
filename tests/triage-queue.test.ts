import test from 'node:test'
import assert from 'node:assert/strict'
import { triageRows } from '../scripts/triage-queue'

const now = new Date('2026-10-07T12:00:00Z')

test('denied and consent rows with evidence are held without further review', () => {
  const { rows, changed } = triageRows([
    { sourceId: '1', stage: 'screened-awaiting-full-review', screeningVerdict: 'denied', screeningEvidence: ['※インターネット掲載不可'] },
    { sourceId: '2', stage: 'screened-awaiting-full-review', screeningVerdict: 'consent', screeningEvidence: ['広告掲載の際は要連絡'] },
  ], now)
  assert.equal(changed, 2)
  assert.deepEqual(rows.map((row) => row.stage), ['held-screening-denied', 'held-screening-consent'])
  assert.equal(rows[0].triagedAt, now.toISOString())
  assert.deepEqual(rows[0].screeningEvidence, ['※インターネット掲載不可'])
})

test('permitted, unclear, no-mention and already-progressed rows are left alone', () => {
  const input = [
    { sourceId: '3', stage: 'screened-awaiting-full-review', screeningVerdict: 'permitted', screeningEvidence: ['広告可'] },
    { sourceId: '4', stage: 'screened-awaiting-full-review', screeningVerdict: 'unclear', screeningEvidence: ['自社HP可', '承諾書必須'] },
    { sourceId: '5', stage: 'screened-awaiting-full-review', screeningVerdict: 'no_mention', screeningEvidence: [] },
    { sourceId: '6', stage: 'current-source-captured-awaiting-full-review', screeningVerdict: 'denied', screeningEvidence: ['広告不可'] },
    { sourceId: '7', stage: 'published-and-verified', screeningVerdict: 'consent', screeningEvidence: ['要連絡'] },
  ]
  const { rows, changed } = triageRows(input, now)
  assert.equal(changed, 0)
  assert.deepEqual(rows, input)
})

test('a denied row without recorded evidence stays open for a person to check', () => {
  const { changed } = triageRows([{ sourceId: '8', stage: 'screened-awaiting-full-review', screeningVerdict: 'denied', screeningEvidence: [] }], now)
  assert.equal(changed, 0)
})
