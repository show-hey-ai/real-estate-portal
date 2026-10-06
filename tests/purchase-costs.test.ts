import assert from 'node:assert/strict'
import test from 'node:test'
import { brokerageFeeMax, estimateInitialCosts, stampDuty } from '../src/lib/purchase-costs'

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

test('a cash purchase needs the whole price plus fees, with no loan costs', () => {
  const costs = estimateInitialCosts({ price: 30_000_000, downPaymentRate: 0.2, useLoan: false, on: DURING_RELIEF })
  assert.equal(costs.ownFunds, 30_000_000)
  assert.equal(costs.loanFee, 0)
  assert.deepEqual(costs.other, { low: 600_000, high: 900_000 })
  assert.equal(costs.fees.low, 1_056_000 + 10_000 + 600_000)
  assert.equal(costs.cashNeeded.high, 30_000_000 + 1_056_000 + 10_000 + 900_000)
})

test('with a loan the buyer pays the down payment, fees and the lender fee', () => {
  const costs = estimateInitialCosts({ price: 30_000_000, downPaymentRate: 0.2, useLoan: true, on: DURING_RELIEF })
  assert.equal(costs.ownFunds, 6_000_000)
  assert.equal(costs.loanAmount, 24_000_000)
  assert.equal(costs.loanFee, 528_000)
  assert.equal(costs.cashNeeded.low, 6_000_000 + 1_056_000 + 10_000 + 528_000 + 600_000)
})

test('contract-day cash is the deposit, stamp duty and half the brokerage; the rest is due at settlement', () => {
  const costs = estimateInitialCosts({ price: 30_000_000, downPaymentRate: 0.2, useLoan: true, on: DURING_RELIEF })
  assert.equal(costs.atContract, 1_500_000 + 10_000 + 528_000)
  assert.equal(costs.atSettlement.low + costs.atContract, costs.cashNeeded.low)
  const noDown = estimateInitialCosts({ price: 30_000_000, downPaymentRate: 0, useLoan: true, on: DURING_RELIEF })
  assert.equal(noDown.atContract, 10_000 + 528_000)
  assert.equal(estimateInitialCosts({ price: 7_800_000, downPaymentRate: 0.2, useLoan: false, on: DURING_RELIEF }).lowPriceRule, true)
})
