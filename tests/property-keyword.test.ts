import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePropertyKeyword } from '../src/lib/property-keyword'

test('known English and Chinese ward names resolve to stored Japanese areas', () => {
  for (const [keyword, ward] of [
    ['MINATO', '港区'], ['Shinjuku Ward', '新宿区'], ['Shibuya-ku', '渋谷区'],
    ['Ｓｈｉｎｊｕｋｕ', '新宿区'], ['澀谷區', '渋谷区'], ['涩谷区', '渋谷区'],
    ['江户川区', '江戸川区'], ['港区', '港区'],
  ]) assert.equal(normalizePropertyKeyword(keyword), ward)
})

test('specific or unknown address terms are not widened into ward searches', () => {
  assert.equal(normalizePropertyKeyword('港区港南3-7'), '港区港南3-7')
  assert.equal(normalizePropertyKeyword('Minato Tower'), 'Minato Tower')
  assert.equal(normalizePropertyKeyword('West Shinjuku'), 'West Shinjuku')
})

test('REST filter syntax is removed and query length is bounded', () => {
  const value = normalizePropertyKeyword('新宿%,(city.eq.港区)')
  assert.equal(value, '新宿cityeq港区')
  assert.equal(normalizePropertyKeyword('x'.repeat(100)).length, 80)
  assert.equal(normalizePropertyKeyword(undefined), '')
})
