import assert from 'node:assert/strict'
import test from 'node:test'
import { netYieldFromRent, seismicStandard } from '../src/lib/seismic'

test('completion years map to the 1981 earthquake standard with an ambiguous band', () => {
  assert.equal(seismicStandard(2002), 'new')
  assert.equal(seismicStandard(1984), 'new')
  assert.equal(seismicStandard(1983), 'check')
  assert.equal(seismicStandard(1981), 'check')
  assert.equal(seismicStandard(1980), 'old')
  assert.equal(seismicStandard(1969), 'old')
  assert.equal(seismicStandard(null), null)
})

test('net yield subtracts monthly fees from rent before annualising', () => {
  assert.equal(netYieldFromRent(113_000, 20_860, 20_800_000), 5.3)
  assert.equal(netYieldFromRent(54_800, null, 6_500_000), 10.1)
  assert.equal(netYieldFromRent(null, 20_000, 20_800_000), null)
})
