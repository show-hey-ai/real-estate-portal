import assert from 'node:assert/strict'
import test from 'node:test'
import { geocodeQuery, hazardMapUrl, parseGsiResult } from '../src/lib/geocode'
import { formatApproxPrice, parseRates } from '../src/lib/fx'

test('the geocode query drops the unit number', () => {
  assert.equal(geocodeQuery('東京都中野区中野5丁目24-16 502号室'), '東京都中野区中野5丁目24-16')
  assert.equal(geocodeQuery('東京都江東区森下三丁目'), '東京都江東区森下三丁目')
})

test('GSI results become coordinates only inside Tokyo', () => {
  assert.deepEqual(parseGsiResult([{ geometry: { coordinates: [139.668991, 35.709782] } }]), { lat: 35.709782, lng: 139.668991 })
  assert.equal(parseGsiResult([{ geometry: { coordinates: [135.5, 34.7] } }]), null)
  assert.equal(parseGsiResult([]), null)
  assert.equal(parseGsiResult({ error: 'x' }), null)
})

test('the hazard map opens at the property, or at the portal without a location', () => {
  assert.equal(hazardMapUrl({ lat: 35.709782, lng: 139.668991 }), 'https://disaportal.gsi.go.jp/maps/?ll=35.709782,139.668991&z=16&base=pale')
  assert.equal(hazardMapUrl(null), 'https://disaportal.gsi.go.jp/maps/')
})

test('foreign-currency prices follow the language and round to three figures', () => {
  const rates = parseRates({ result: 'success', rates: { USD: 0.00633, TWD: 0.200968, CNY: 0.042499 } })
  assert.equal(formatApproxPrice(20_800_000, 'en', rates), '≈ US$132,000')
  assert.equal(formatApproxPrice(20_800_000, 'zh-TW', rates), '約 NT$4,180,000')
  assert.equal(formatApproxPrice(20_800_000, 'zh-CN', rates), '约 人民币884,000元')
  assert.equal(formatApproxPrice(20_800_000, 'ja', rates), null)
  assert.equal(formatApproxPrice(20_800_000, 'en', null), null)
  assert.equal(parseRates({ result: 'error' }), null)
})
