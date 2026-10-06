import assert from 'node:assert/strict'
import test from 'node:test'
import { grossYieldFromRent, parseMonthlyFigures } from '../src/lib/monthly-costs'

test('reads rent, management fee and repair reserve written as 「は月額」 sentences', () => {
  assert.deepEqual(parseMonthlyFigures('ゼロ号棟。空室ではありません。賃料は月額108,000円、管理費は月額11,280円、修繕積立金は月額13,700円です。'), { rent: 108_000, managementFee: 11_280, repairReserve: 13_700, fees: 24_980 })
})

test('reads compact forms and the 「月額賃料」 order', () => {
  assert.deepEqual(parseMonthlyFigures('管理費13,000円・修繕積立金16,000円／月。'), { rent: null, managementFee: 13_000, repairReserve: 16_000, fees: 29_000 })
  assert.equal(parseMonthlyFigures('賃貸中で月額賃料195,000円。').rent, 195_000)
  assert.equal(parseMonthlyFigures('家賃・共益費は月額54,800円。').rent, 54_800)
})

test('a stated total of fees is used as is', () => {
  assert.deepEqual(parseMonthlyFigures('賃料は月額89,000円。管理費等の合計は月額18,124円。'), { rent: 89_000, managementFee: null, repairReserve: null, fees: 18_124 })
  assert.equal(parseMonthlyFigures('管理費・修繕積立金の合計は月額7,650円').fees, 7_650)
})

test('rent that includes the management fee is still the rent', () => {
  const figures = parseMonthlyFigures('賃料は管理費を含め月額78,000円。管理費は月額9,700円、修繕積立金は月額7,100円。')
  assert.equal(figures.rent, 78_000)
  assert.equal(figures.managementFee, 9_700)
})

test('unlabelled amounts and missing descriptions give nothing', () => {
  assert.deepEqual(parseMonthlyFigures('その他月額24,160円。'), { rent: null, managementFee: null, repairReserve: null, fees: null })
  assert.deepEqual(parseMonthlyFigures(null), { rent: null, managementFee: null, repairReserve: null, fees: null })
})

test('gross yield is annual rent over price, to one decimal', () => {
  assert.equal(grossYieldFromRent(108_000, 20_800_000), 6.2)
  assert.equal(grossYieldFromRent(null, 20_800_000), null)
  assert.equal(grossYieldFromRent(108_000, 0), null)
})
