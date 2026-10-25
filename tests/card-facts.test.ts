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
  const facts = withCardFacts({ descriptionJa: '代々木公園。42.00㎡、2階の1LDK。', descriptionEn: null, price: 1, currentStatus: null })
  assert.equal(facts.layout, '1LDK')
  assert.equal('descriptionJa' in facts, false)
})
