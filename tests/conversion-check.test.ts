import assert from 'node:assert/strict'
import test from 'node:test'
import { conversionCheckUrl, isConversionCandidate } from '../src/lib/conversion-check'

test('the apply link carries the public address and listing URL in the visitor language', () => {
  const href = new URL(conversionCheckUrl({
    locale: 'zh-TW',
    publicAddress: '東京都台東区柳橋1丁目',
    listingUrl: 'https://portal.ziyou-fudosan.com/zh-TW/listings/abc',
    baseUrl: 'https://survey.example',
  }))
  assert.equal(href.origin + href.pathname, 'https://survey.example/zh-TW/apply')
  assert.equal(href.searchParams.get('address'), '東京都台東区柳橋1丁目')
  assert.equal(href.searchParams.get('propertyUrl'), 'https://portal.ziyou-fudosan.com/zh-TW/listings/abc')
})

test('an unknown locale falls back to English and a missing address is left out', () => {
  const href = new URL(conversionCheckUrl({ locale: 'ko', listingUrl: 'https://x/listings/1', baseUrl: 'https://survey.example' }))
  assert.equal(href.pathname, '/en/apply')
  assert.equal(href.searchParams.has('address'), false)
})

test('only whole buildings, houses and shops are offered the check', () => {
  for (const t of ['戸建', '一棟マンション', '一棟アパート', '一棟ビル', '店舗・事務所']) assert.equal(isConversionCandidate(t), true, t)
  for (const t of ['区分マンション', '土地', null, undefined]) assert.equal(isConversionCandidate(t), false, String(t))
})
