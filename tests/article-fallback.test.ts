import assert from 'node:assert/strict'
import test from 'node:test'
import { articleFallbackPath } from '../src/lib/article-fallback'

test('a hidden ward article sends readers to that ward page in the same language', () => {
  assert.equal(articleFallbackPath('tokyo-shinjuku-property-selection', 'en'), '/areas/shinjuku')
  assert.equal(articleFallbackPath('tokyo-shinjuku-property-selection', 'ja'), '/areas/shinjuku?lang=ja')
  assert.equal(articleFallbackPath('tokyo-koto-property-selection', 'zh-CN'), '/areas/koto?lang=zh-CN')
})

test('hidden guide articles go to the closest evergreen page', () => {
  assert.equal(articleFallbackPath('japan-market-guide', 'en'), '/buy-property-in-tokyo')
  assert.equal(articleFallbackPath('japan-buying-process-guide', 'zh-TW'), '/buying-guide?lang=zh-TW')
  assert.equal(articleFallbackPath('japan-brokerage-guide', 'en'), '/buying-guide')
  assert.equal(articleFallbackPath('tokyo-condominiums-property-selection', 'en'), '/types/condominium')
  assert.equal(articleFallbackPath('tokyo-wards-property-selection', 'ja'), '/areas?lang=ja')
})

test('anything else falls back to the article index', () => {
  assert.equal(articleFallbackPath('tokyo-atlantis-property-selection', 'en'), '/articles')
  assert.equal(articleFallbackPath('unknown', 'ja'), '/articles?lang=ja')
})
