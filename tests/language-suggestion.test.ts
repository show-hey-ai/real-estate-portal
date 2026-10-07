import assert from 'node:assert/strict'
import test from 'node:test'
import { suggestedLocale } from '../src/components/common/language-suggestion'

test('browser languages map to site languages', () => {
  assert.equal(suggestedLocale(['ja-JP']), 'ja')
  assert.equal(suggestedLocale(['zh-TW', 'en']), 'zh-TW')
  assert.equal(suggestedLocale(['zh-HK']), 'zh-TW')
  assert.equal(suggestedLocale(['zh-Hant-TW']), 'zh-TW')
  assert.equal(suggestedLocale(['zh-CN']), 'zh-CN')
  assert.equal(suggestedLocale(['zh']), 'zh-CN')
  assert.equal(suggestedLocale(['en-US']), 'en')
  assert.equal(suggestedLocale(['ko-KR']), 'en')
  assert.equal(suggestedLocale([]), 'en')
})
