import assert from 'node:assert/strict'
import test from 'node:test'
import { findSearchOpportunities, searchWindow, summarizeSearch } from '../src/lib/autonomy/search-policy'

const host = 'https://portal.example.com'
const row = (page: string, impressions: number, clicks: number, position: number) => ({ keys: [`${host}${page}`], impressions, clicks, ctr: impressions ? clicks / impressions : 0, position })

test('the search window ends three days ago in Tokyo and covers 28 days', () => {
  assert.deepEqual(searchWindow(new Date('2026-10-06T23:30:00Z')), { startDate: '2026-09-07', endDate: '2026-10-04' })
})

test('totals weight the average position by impressions', () => {
  const summary = summarizeSearch([row('/a', 30, 1, 2), row('/b', 10, 0, 10)])
  assert.equal(summary.impressions, 40)
  assert.equal(summary.clicks, 1)
  assert.equal(summary.position, 4)
  assert.equal(summary.ctr, 0.025)
})

test('pages close to the first page and pages with weak CTR become opportunities, with their top queries', () => {
  const pages = [row('/guide', 58, 0, 12.4), row('/', 40, 1, 3.2), row('/tiny', 3, 0, 9), row('/deep', 50, 0, 41)]
  const queries = [
    { keys: [`${host}/guide`, 'personal vs company japan property'], impressions: 30, clicks: 0, ctr: 0, position: 11 },
    { keys: [`${host}/guide`, 'japan property company'], impressions: 20, clicks: 0, ctr: 0, position: 14 },
    { keys: [`${host}/`, 'ziyou real estate'], impressions: 25, clicks: 1, ctr: 0.04, position: 2 },
  ]
  const result = findSearchOpportunities(pages, queries, host)
  assert.deepEqual(result.map((item) => [item.path, item.reason]), [['/guide', 'near_first_page'], ['/', 'low_ctr']])
  assert.deepEqual(result[0].topQueries, ['personal vs company japan property', 'japan property company'])
})

test('nothing is suggested when there is too little data', () => {
  assert.deepEqual(findSearchOpportunities([row('/a', 5, 0, 12)], [], host), [])
})
