import assert from 'node:assert/strict'
import test from 'node:test'
import { compareUnitPrice, formatUnitPrice } from '../src/lib/unit-price'

test('unit prices are shown per m² and, in Japanese, per tsubo', () => {
  assert.equal(formatUnitPrice(59_800_000, 75.4, 'ja'), '79.3万円/㎡（坪262.2万円）')
  assert.equal(formatUnitPrice(59_800_000, 75.4, 'en'), '¥793,103/m²')
  assert.equal(formatUnitPrice(59_800_000, 75.4, 'zh-TW'), '79.3萬日圓/㎡')
})

test('missing or zero values give no unit price', () => {
  assert.equal(formatUnitPrice(null, 75, 'ja'), null)
  assert.equal(formatUnitPrice(59_800_000, 0, 'ja'), null)
})

test('a listing is compared with the average of other listings of the same kind', () => {
  const current = { id: 'a', propertyType: '区分マンション', price: 60_000_000, buildingArea: 60, landArea: null }
  const peers = [
    current,
    { id: 'b', propertyType: '区分マンション', price: 40_000_000, buildingArea: 50, landArea: null },
    { id: 'c', propertyType: '戸建', price: 60_000_000, buildingArea: 100, landArea: 80 },
    { id: 'd', propertyType: '土地', price: 90_000_000, buildingArea: null, landArea: 100 },
  ]
  assert.deepEqual(compareUnitPrice(current, peers), { current: 1_000_000, average: 700_000, count: 2 })
})

test('no comparison is shown with fewer than three listings or without an area', () => {
  const current = { id: 'a', propertyType: '区分マンション', price: 60_000_000, buildingArea: 60, landArea: null }
  assert.equal(compareUnitPrice(current, [current, { id: 'b', propertyType: '区分マンション', price: 1, buildingArea: 1, landArea: null }]), null)
  assert.equal(compareUnitPrice({ ...current, buildingArea: null }, []), null)
})
