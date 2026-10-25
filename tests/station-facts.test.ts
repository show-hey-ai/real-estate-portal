import assert from 'node:assert/strict'
import test from 'node:test'
import { lineById } from '../src/lib/transit'
import { directHubs, stationMarket, stopsBetween } from '../src/lib/transit/station-facts'

const row = (id: string, price: number, area: number, walk: number | null, layout: string, propertyType = '区分マンション') => ({
  id, propertyType, price, buildingArea: area, landArea: null, descriptionJa: `物件${id}。${area}㎡の${layout}。`,
  stations: [{ name: '渋谷', walk_minutes: walk }, { name: '恵比寿', walk_minutes: 12 }],
})

test('stops follow the line, including the Yamanote loop', () => {
  const yamanote = lineById('jr-yamanote')!
  assert.equal(stopsBetween(yamanote, '渋谷', '新宿'), 3)
  assert.equal(stopsBetween(yamanote, '東京', '品川'), 6)
  assert.equal(stopsBetween(yamanote, '品川', '池袋'), 12)
  assert.equal(stopsBetween(yamanote, '渋谷', '銀座'), null)
})

test('major stations reachable without changing trains, nearest first by the quickest line', () => {
  const hubs = directHubs('渋谷')
  assert.deepEqual(hubs.slice(0, 2).map((hub) => [hub.hub, hub.line.id, hub.stops]), [['新宿', 'jr-saikyo', 1], ['池袋', 'jr-saikyo', 2]])
  assert.ok(hubs.some((hub) => hub.hub === '銀座' && hub.line.id === 'metro-ginza' && hub.stops === 8))
  assert.ok(!hubs.some((hub) => hub.hub === '渋谷'))
  assert.ok(hubs.length <= 6)
})

test('the market near a station: price range, medians, layouts and walking times', () => {
  const rows = [
    row('a', 50_000_000, 25, 3, '1K'),
    row('b', 80_000_000, 40, 7, '1LDK'),
    row('c', 120_000_000, 60, 12, '2LDK'),
    row('d', 90_000_000, 45, null, '1LDK'),
    { ...row('e', 200_000_000, 0, 4, '土地'), propertyType: '土地', buildingArea: null, landArea: 100 },
    { id: 'far', propertyType: '区分マンション', price: 1, buildingArea: 10, landArea: null, stations: [{ name: '新宿', walk_minutes: 2 }] },
  ]
  const market = stationMarket(rows, '渋谷')!
  assert.equal(market.count, 5)
  assert.equal(market.priceMin, 50_000_000)
  assert.equal(market.priceMax, 200_000_000)
  assert.equal(market.priceMedian, 90_000_000)
  // Land is left out of the price per m²: 2.0M, 2.0M, 2.0M, 2.0M per m².
  assert.equal(market.unitPriceMedian, 2_000_000)
  assert.deepEqual(market.layouts[0], { layout: '1LDK', count: 2 })
  assert.deepEqual(market.walk, { within5: 2, within10: 1, beyond10: 2 })
})

test('no market without listings, and no medians from one or two listings', () => {
  assert.equal(stationMarket([], '渋谷'), null)
  const small = stationMarket([row('a', 50_000_000, 25, 3, '1K'), row('b', 80_000_000, 40, 7, '1LDK')], '渋谷')!
  assert.equal(small.priceMedian, null)
  assert.equal(small.unitPriceMedian, null)
  assert.equal(small.priceMin, 50_000_000)
})
