import assert from 'node:assert/strict'
import test from 'node:test'
import { cardLayout, withCardFacts } from '../src/lib/card-facts'

test('the floor plan type is read from the Japanese description', () => {
  assert.equal(cardLayout('キャピタルマークタワー。専有面積87.03㎡、14階・西向きの2LDK。'), '2LDK')
  assert.equal(cardLayout('ホープ錦糸町。専有面積12.81㎡、3階の1R。'), '1R')
  assert.equal(cardLayout('南東向き3SLDK、角住戸。'), '3SLDK')
})

test('no floor plan type when the description names none or several', () => {
  assert.equal(cardLayout('一棟ビル。RC造5階建。'), null)
  assert.equal(cardLayout('2LDKと3LDKの2戸をまとめて売却。'), null)
  assert.equal(cardLayout('SRC造、地上12階。'), null)
  assert.equal(cardLayout(null), null)
})

test('card facts carry the floor plan type but not the description', () => {
  const facts = withCardFacts({ descriptionJa: '代々木公園。42.00㎡、2階の1LDK。', descriptionEn: null, price: 1, currentStatus: null }, 'ja')
  assert.equal(facts.layout, '1LDK')
  assert.equal('descriptionJa' in facts, false)
})

test('card facts carry the address and nearest station already in the page language', () => {
  const listing = {
    descriptionJa: null, descriptionEn: null, price: 1,
    addressPublic: '東京都渋谷区神宮前',
    stations: [{ line: '東京メトロ銀座線', name: '表参道', walk_minutes: 4 }],
  }
  const ja = withCardFacts(listing, 'ja')
  const en = withCardFacts(listing, 'en')
  const tw = withCardFacts(listing, 'zh-TW')
  assert.match(ja.addressLabel ?? '', /渋谷区/)
  assert.match(en.addressLabel ?? '', /Shibuya/)
  assert.match(tw.addressLabel ?? '', /澀谷區/)
  assert.match(ja.accessLabel ?? '', /表参道/)
  assert.match(en.accessLabel ?? '', /Omotesando/)
  assert.match(tw.accessLabel ?? '', /東京地鐵/)
  assert.equal(withCardFacts({ descriptionJa: null, price: 1 }, 'en').accessLabel, null)
})
