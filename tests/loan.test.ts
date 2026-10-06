import assert from 'node:assert/strict'
import test from 'node:test'
import { estimateLoan } from '../src/lib/loan'

test('a level-payment mortgage matches the standard formula', () => {
  const result = estimateLoan({ price: 59_800_000, downPaymentRate: 0.2, annualRatePercent: 1, years: 35 })
  assert.equal(result.downPayment, 11_960_000)
  assert.equal(result.principal, 47_840_000)
  assert.equal(result.monthlyPayment, 135_045)
  assert.ok(result.totalInterest > 8_800_000 && result.totalInterest < 8_900_000)
})

test('zero interest divides evenly and full cash needs no payment', () => {
  assert.equal(estimateLoan({ price: 12_000_000, downPaymentRate: 0, annualRatePercent: 0, years: 10 }).monthlyPayment, 100_000)
  assert.deepEqual(estimateLoan({ price: 10_000_000, downPaymentRate: 1, annualRatePercent: 1, years: 35 }), { downPayment: 10_000_000, principal: 0, monthlyPayment: 0, totalInterest: 0 })
})
