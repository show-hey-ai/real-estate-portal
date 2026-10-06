import assert from 'node:assert/strict'
import test from 'node:test'
import { PRICE_BANDS, countPriceBands, priceBandLabel, priceBandQuery } from '../src/lib/price-bands'

test('prices fall into exactly one band, boundaries going to the higher band', () => {
  assert.deepEqual(countPriceBands([6_500_000, 20_000_000, 23_800_000, 59_800_000, 60_000_000, 385_000_000, null]), [1, 2, 1, 1, 1])
})

test('band queries keep the search maximum below the next band', () => {
  assert.equal(priceBandQuery(PRICE_BANDS[0]), 'priceMax=19999999')
  assert.equal(priceBandQuery(PRICE_BANDS[1]), 'priceMin=20000000&priceMax=39999999')
  assert.equal(priceBandQuery(PRICE_BANDS[4]), 'priceMin=100000000')
})

test('band labels read naturally in each language', () => {
  assert.equal(priceBandLabel(PRICE_BANDS[0], 'ja'), '〜2,000万')
  assert.equal(priceBandLabel(PRICE_BANDS[3], 'ja'), '6,000万–1億')
  assert.equal(priceBandLabel(PRICE_BANDS[4], 'zh-CN'), '1亿〜')
  assert.equal(priceBandLabel(PRICE_BANDS[0], 'en'), 'Under ¥20M')
})
