import assert from 'node:assert/strict'
import test from 'node:test'
import { formatUnitPrice } from '../src/lib/unit-price'

test('unit prices are shown per m² and, in Japanese, per tsubo', () => {
  assert.equal(formatUnitPrice(59_800_000, 75.4, 'ja'), '79.3万円/㎡（坪262.2万円）')
  assert.equal(formatUnitPrice(59_800_000, 75.4, 'en'), '¥793,103/m²')
  assert.equal(formatUnitPrice(59_800_000, 75.4, 'zh-TW'), '79.3萬日圓/㎡')
})

test('missing or zero values give no unit price', () => {
  assert.equal(formatUnitPrice(null, 75, 'ja'), null)
  assert.equal(formatUnitPrice(59_800_000, 0, 'ja'), null)
})
