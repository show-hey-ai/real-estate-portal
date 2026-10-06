import assert from 'node:assert/strict'
import test from 'node:test'
import { brokerageFeeMax, estimatePurchaseCosts, stampDuty } from '../src/lib/purchase-costs'

const DURING_RELIEF = new Date('2026-10-06T12:00:00+09:00')
const AFTER_RELIEF = new Date('2027-04-01T00:00:00+09:00')

test('brokerage maximum follows the three statutory tiers including consumption tax', () => {
  assert.equal(brokerageFeeMax(2_000_000), 110_000)
  assert.equal(brokerageFeeMax(4_000_000), 198_000)
  assert.equal(brokerageFeeMax(30_000_000), 1_056_000)
  assert.equal(brokerageFeeMax(0), 0)
})

test('stamp duty uses the reduced table until the relief ends, then the standard table', () => {
  assert.equal(stampDuty(23_800_000, DURING_RELIEF), 10_000)
  assert.equal(stampDuty(59_800_000, DURING_RELIEF), 30_000)
  assert.equal(stampDuty(385_000_000, DURING_RELIEF), 60_000)
  assert.equal(stampDuty(50_000_000, DURING_RELIEF), 10_000)
  assert.equal(stampDuty(23_800_000, AFTER_RELIEF), 20_000)
  assert.equal(stampDuty(5_000, DURING_RELIEF), 0)
})

test('the estimate adds brokerage, stamp duty and a 3–5% range for other costs', () => {
  const costs = estimatePurchaseCosts(30_000_000, DURING_RELIEF)
  assert.equal(costs.otherLow, 900_000)
  assert.equal(costs.otherHigh, 1_500_000)
  assert.equal(costs.totalLow, 1_056_000 + 10_000 + 900_000)
  assert.equal(costs.totalHigh, 1_056_000 + 10_000 + 1_500_000)
  assert.equal(costs.lowPriceRule, false)
  assert.equal(estimatePurchaseCosts(7_800_000, DURING_RELIEF).lowPriceRule, true)
})
