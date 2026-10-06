import assert from 'node:assert/strict'
import test from 'node:test'
import { englishStreet, parseChome } from '../src/lib/english-address'
import { translateAddress, translateRailwayLine, translateZoning } from '../src/lib/translate-fields'

test('chome numbers read Arabic, full-width and kanji forms', () => {
  assert.equal(parseChome('5'), 5)
  assert.equal(parseChome('５'), 5)
  assert.equal(parseChome('三'), 3)
  assert.equal(parseChome('十二'), 12)
})

test('streets are written in English order with romanised town names', () => {
  assert.equal(englishStreet('中野区', '中野5丁目24-16 211号室'), 'Unit 211, 5-24-16 Nakano')
  assert.equal(englishStreet('文京区', '本駒込6丁目5-11'), '6-5-11 Honkomagome')
  assert.equal(englishStreet('港区', '南青山5丁目5-11 2階'), '2F, 5-5-11 Minamiaoyama')
  assert.equal(englishStreet('中央区', '日本橋小舟町9-10'), '9-10 Nihombashikobunacho')
  assert.equal(englishStreet('江東区', '森下三丁目'), '3-chome Morishita')
  assert.equal(englishStreet('豊島区', '南長崎4丁目42-4 マイキャッスル東長崎503号室'), 'Unit 503, 4-42-4 Minaminagasaki')
})

test('full English addresses include the ward and Tokyo', () => {
  assert.equal(translateAddress('東京都中野区中野5丁目24-16 211号室', 'en'), 'Unit 211, 5-24-16 Nakano, Nakano, Tokyo')
  assert.equal(translateAddress('東京都中野区中野5丁目24-16 211号室', 'ja'), '東京都中野区中野5丁目24-16 211号室')
})

test('zoning written with kanji numerals and newer lines translate', () => {
  assert.equal(translateZoning('第一種低層住居専用地域', 'en'), 'Category I Exclusively Low-rise Residential')
  assert.equal(translateRailwayLine('東武大師線', 'en'), 'Tobu Daishi Line')
})

test('town names starting with kanji numerals keep their first character', () => {
  assert.equal(englishStreet('港区', '三田3丁目5-27'), '3-5-27 Mita')
})
