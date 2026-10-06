import assert from 'node:assert/strict'
import test from 'node:test'
import { formatPublicAddress, formatApprovedPublicAddress, hasDetailedPublicAddress } from '../src/lib/address'
import { translateAddress } from '../src/lib/translate-fields'

const full = '東京都台東区谷中3丁目2-2 サンライズ千駄木201号室'

test('confirmed advertising allows the verified lot, building and unit; other inventory stays reduced', () => {
  assert.equal(formatPublicAddress(full, { adAllowed: true, adConsentRequired: false }).publicAddress, full)
  for (const permission of [undefined, { adAllowed: false }, { adAllowed: true, adConsentRequired: true }]) {
    assert.equal(formatPublicAddress(full, permission).publicAddress, '東京都台東区谷中3丁目')
  }
  assert.equal(hasDetailedPublicAddress(full), true)
  assert.equal(hasDetailedPublicAddress('東京都台東区谷中3丁目'), false)
})

test('approved public address rendering rejects internal placeholders and contact details', () => {
  for (const input of ['SECRET-ROOM', '東京都台東区谷中3丁目 電話03-1234-5678', '東京都台東区谷中3丁目 broker@example.com']) {
    assert.equal(formatApprovedPublicAddress(input), null)
  }
})

test('all portal languages preserve the verified street and unit instead of reducing to the ward', () => {
  for (const locale of ['ja', 'zh-TW', 'zh-CN']) {
    const translated = translateAddress(full, locale)
    assert.ok(translated?.includes('3丁目2-2'))
    assert.ok(translated?.includes('201号室'))
  }
  // English writes the same street and unit in English order (e.g. "Unit 201, 3-2-2 Yanaka").
  const english = translateAddress(full, 'en')
  assert.ok(english?.includes('3-2-2'))
  assert.ok(english?.includes('Unit 201'))
})


test('full disclosure retains the separator between the lot and unit numbers', () => {
  const address = '東京都中野区中野5丁目24-16 502号室'
  assert.equal(formatPublicAddress(address, { adAllowed: true }).publicAddress, address)
  assert.equal(formatApprovedPublicAddress(address), address)
})
