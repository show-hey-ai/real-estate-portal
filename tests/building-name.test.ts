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
