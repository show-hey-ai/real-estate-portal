import assert from 'node:assert/strict'
import test from 'node:test'
import { extractBuildingName } from '../src/lib/building-name'

test('building names are taken from the opening of the Japanese description', () => {
  assert.equal(extractBuildingName('ライオンズグローベル石神井公園。75.40㎡の3LDK'), 'ライオンズグローベル石神井公園')
  assert.equal(extractBuildingName('富士見マンションの区分マンション。価格は'), '富士見マンション')
  assert.equal(extractBuildingName('キョウエイハイツ田町。空室'), 'キョウエイハイツ田町')
  assert.equal(extractBuildingName('ハウス南青山2階。賃貸中'), 'ハウス南青山')
  assert.equal(extractBuildingName('前野台住宅1号棟。空室'), '前野台住宅1号棟')
  assert.equal(extractBuildingName('オープンレジデンシア文京六義園の2階、1LDKのオーナーチェンジ物件。'), 'オープンレジデンシア文京六義園')
  assert.equal(extractBuildingName('森下K-1ビル。一棟'), '森下K-1ビル')
})

test('address-only or descriptive openings are not treated as names', () => {
  assert.equal(extractBuildingName('足立区竹の塚1丁目の区分マンション。'), null)
  assert.equal(extractBuildingName('墨田区京島1丁目の木造2階建て中古戸建。'), null)
  assert.equal(extractBuildingName(''), null)
  assert.equal(extractBuildingName(null), null)
})

test('station and walking-time phrases are not building names', () => {
  assert.equal(extractBuildingName('北池袋駅徒歩9分、2009年築の区分マンション。'), null)
  assert.equal(extractBuildingName('池袋駅徒歩13分。75.96㎡の3LDK。'), null)
})

test('the public address supplies the name when the description starts with access notes', async () => {
  const { buildingNameFromAddress, buildingNameOf } = await import('../src/lib/building-name')
  assert.equal(buildingNameFromAddress('東京都板橋区中丸町9-3 カテリーナ池袋西プラザタワー501号室'), 'カテリーナ池袋西プラザタワー')
  assert.equal(buildingNameFromAddress('東京都豊島区上池袋3丁目35-15 LE-LION IKEBUKURO COMFORT1401号室'), 'LE-LION IKEBUKURO COMFORT')
  assert.equal(buildingNameFromAddress('東京都豊島区東池袋5丁目1-4 ベルメゾン池袋1階部分'), 'ベルメゾン池袋')
  assert.equal(buildingNameFromAddress('東京都中野区中野5丁目24-16 502号室'), null)
  assert.equal(buildingNameFromAddress('東京都江東区東砂1丁目3番24号402号室'), null)
  assert.equal(buildingNameFromAddress('東京都港区南青山5丁目5-11 2階'), null)
  assert.equal(buildingNameFromAddress('東京都江東区森下三丁目'), null)
  assert.equal(buildingNameOf({ descriptionJa: '池袋駅徒歩13分。75.96㎡の3LDK。', addressPublic: '東京都豊島区南長崎4丁目42-4 マイキャッスル東長崎503号室' }), 'マイキャッスル東長崎')
  assert.equal(buildingNameOf({ descriptionJa: 'ライオンズグローベル石神井公園。75.40㎡', addressPublic: '東京都練馬区下石神井3丁目1-1 201号室' }), 'ライオンズグローベル石神井公園')
})
