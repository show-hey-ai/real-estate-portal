import assert from 'node:assert/strict'
import test from 'node:test'
import { browseQuery, cashMonthlyFlow, clampPrice, grossYieldPercent } from '../src/lib/simulator'

test('gross yield is annual rent over price, in percent', () => {
  assert.equal(grossYieldPercent(50_000_000, 200_000), 4.8)
  assert.equal(grossYieldPercent(50_000_000, 0), null)
  assert.equal(grossYieldPercent(0, 200_000), null)
})

test('cash purchases: monthly flow is rent minus fees, only when letting', () => {
  assert.equal(cashMonthlyFlow(200_000, 25_000), 175_000)
  assert.equal(cashMonthlyFlow(0, 25_000), null)
})

test('typed prices stay within what the calculations handle', () => {
  assert.equal(clampPrice(-5), 0)
  assert.equal(clampPrice(Number.NaN), 0)
  assert.equal(clampPrice(1e13), 10_000_000_000)
  assert.equal(clampPrice(49_999_999.6), 50_000_000)
})

test('"see properties at this price" searches ±20% to the nearest million yen', () => {
  assert.equal(browseQuery(50_000_000), 'priceMin=40000000&priceMax=60000000')
  assert.equal(browseQuery(33_300_000), 'priceMin=26000000&priceMax=40000000')
  assert.equal(browseQuery(0), '')
})
