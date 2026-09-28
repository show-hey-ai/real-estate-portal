import assert from 'node:assert/strict'
import test from 'node:test'
import { formatPrice } from '../src/lib/format'

test('published sale prices retain the exact advertised amount', () => {
  assert.equal(formatPrice(185_000_000, 'ja'), '¥1億8,500万')
  assert.equal(formatPrice(185_000_000, 'en'), '¥185M')
  assert.equal(formatPrice(123_456_789, 'ja'), '¥1億2,345万6,789円')
  assert.equal(formatPrice(123_456_789, 'en'), '¥123,456,789')
})
