import assert from 'node:assert/strict'
import test from 'node:test'
import { formatYenWords } from '../src/lib/yen-words'

test('prices use 億 and 万 in Japanese and Chinese', () => {
  assert.equal(formatYenWords(385_000_000, 'ja'), '3億8,500万円')
  assert.equal(formatYenWords(59_800_000, 'ja'), '5,980万円')
  assert.equal(formatYenWords(200_000_000, 'ja'), '2億円')
  assert.equal(formatYenWords(385_000_000, 'zh-TW'), '3億8,500萬日圓')
  assert.equal(formatYenWords(385_000_000, 'zh-CN'), '3亿8,500万日元')
})

test('English keeps the full yen amount and odd amounts are not rounded away', () => {
  assert.equal(formatYenWords(385_000_000, 'en'), 'JPY 385,000,000')
  assert.equal(formatYenWords(12_345_678, 'ja'), '12,345,678円')
})
