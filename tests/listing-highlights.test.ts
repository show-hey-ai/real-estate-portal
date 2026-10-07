import assert from 'node:assert/strict'
import test from 'node:test'
import { listingHighlights } from '../src/lib/listing-highlights'

test('good points come from features, description and facts', () => {
  const result = listingHighlights({ features: ['1DK', '7階角部屋', 'エレベーターあり'], descriptionJa: '南東向き。オートロック・宅配ボックスあり。', builtYear: 2002, walkMinutes: 3 })
  assert.deepEqual(result.highlights, ['nearStation', 'newSeismic', 'corner', 'autoLock', 'deliveryBox', 'sunny'])
  assert.deepEqual(result.cautions, [])
})

test('planned renovation is not reported as done', () => {
  assert.deepEqual(listingHighlights({ descriptionJa: 'リノベーションは2026年10月末完成予定で、現在完成済みとは扱いません。最上階。' }).highlights, ['topFloor', 'renovationPlanned'])
  assert.deepEqual(listingHighlights({ descriptionJa: '2026年7月末リノベーション完成。' }).highlights, ['renovated'])
})

test('pets are only a good point when allowed', () => {
  assert.ok(listingHighlights({ features: ['ペット可（細則あり）'] }).highlights.includes('pets'))
  assert.ok(!listingHighlights({ descriptionJa: 'ペット飼育・事務所利用不可。' }).highlights.includes('pets'))
  assert.ok(!listingHighlights({ features: ['ペット不可'] }).highlights.includes('pets'))
})

test('points to check are listed plainly', () => {
  const result = listingHighlights({ features: ['再建築不可', 'サブリース契約承継必須', 'エレベーターなし', '管理組合未成立'], descriptionJa: '管理は自主管理。オーナーチェンジ・内見不可。', builtYear: 1972, landRights: '借地権', walkMinutes: 18 })
  assert.deepEqual(result.cautions, ['noRebuild', 'subleaseRequired', 'oldSeismic', 'noElevator', 'selfManaged', 'noAssociation', 'noViewing', 'leasehold', 'farFromStation'])
})

test('land has no earthquake standard', () => {
  assert.deepEqual(listingHighlights({ propertyType: '土地', builtYear: 1970 }).cautions, [])
})

test('walking time falls back to the description', () => {
  const result = listingHighlights({ descriptionJa: '表参道駅徒歩3分、外苑前駅徒歩8分。' })
  assert.equal(result.walkMinutes, 3)
  assert.ok(result.highlights.includes('nearStation'))
})

test('freehold land rights are a good point', () => {
  assert.ok(listingHighlights({ landRights: '所有権' }).highlights.includes('freehold'))
  assert.ok(!listingHighlights({ landRights: '借地権' }).highlights.includes('freehold'))
})
