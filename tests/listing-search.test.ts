import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canonicalSearchQuery,
  matchesListingDetails,
  priceDistribution,
  readSavedSearches,
} from '../src/lib/listing-search'

const listing = {
  propertyType: '区分マンション',
  buildingArea: 51.25,
  landArea: null,
  stations: [
    { name: '新宿', line: 'JR山手線', walk_minutes: 15 },
    { name: '新宿三丁目', line: '東京メトロ丸ノ内線', walk_minutes: 3 },
  ],
}

test('walk limit applies to the requested station, and stations can be searched without choosing a line', () => {
  assert.equal(
    matchesListingDetails(listing, { station: '新宿駅', walkMax: '5' }),
    false
  )
  assert.equal(
    matchesListingDetails(listing, { station: '新宿三丁目', walkMax: '5' }),
    true
  )
  assert.equal(
    matchesListingDetails(listing, {
      station: '新宿駅',
      line: '山手線',
      walkMax: '15',
    }),
    true
  )
})

test('area bounds use the appropriate factual area, preserve decimal limits, and exclude unknown measurements', () => {
  assert.equal(
    matchesListingDetails(listing, { areaMin: '51.25', areaMax: '51.25' }),
    true
  )
  assert.equal(matchesListingDetails(listing, { areaMax: '50' }), false)
  assert.equal(
    matchesListingDetails(
      { ...listing, buildingArea: null },
      { areaMax: '100' }
    ),
    false
  )
  assert.equal(
    matchesListingDetails(
      { ...listing, propertyType: '土地', landArea: 90 },
      { areaMin: '80', areaMax: '100' }
    ),
    true
  )
  assert.equal(
    matchesListingDetails(listing, { areaMin: '100', areaMax: '20' }),
    false
  )
})

test('saved searches keep only criteria and are safely restored as internal queries', () => {
  const query = canonicalSearchQuery(
    new URLSearchParams(
      'ward=墨田区&areaMax=50.5&page=4&sort=price_asc&returnTo=https://example.com&priceMin=Infinity'
    )
  )
  assert.equal(new URLSearchParams(query).get('areaMax'), '50.5')
  assert.equal(new URLSearchParams(query).has('page'), false)
  assert.equal(new URLSearchParams(query).has('returnTo'), false)
  assert.equal(new URLSearchParams(query).has('priceMin'), false)
  const entries = readSavedSearches(
    JSON.stringify([
      { query, savedAt: '2026-10-03T00:00:00Z' },
      { query, savedAt: '2026-10-03T00:01:00Z' },
      {
        query: 'returnTo=https://example.com',
        savedAt: '2026-10-03T00:02:00Z',
      },
    ])
  )
  assert.equal(entries.length, 1)
  assert.deepEqual(readSavedSearches('invalid'), [])
})

test('price distribution is based on measured asking prices, omits sparse data and accounts for its upper endpoint', () => {
  assert.equal(priceDistribution([100, 200, null]), null)
  const distribution = priceDistribution([100, 200, 300, 400, 500, null])!
  assert.equal(distribution.count, 5)
  assert.equal(
    distribution.bins.reduce((total, bin) => total + bin.count, 0),
    5
  )
  assert.equal(distribution.bins.at(-1)?.count, 1)
  assert.equal(priceDistribution([100, 100, 100, 100, 100])?.bins[0].count, 5)
})
