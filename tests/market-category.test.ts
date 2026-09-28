import assert from 'node:assert/strict'
import test from 'node:test'
import { getMarketCategory, isPublicPropertyType } from '../src/lib/market-category'

test('groups land separately from the buyer purpose', () => {
  assert.equal(getMarketCategory({ propertyType: '土地', yieldGross: 5 }), 'land')
})

test('places owner-occupied homes under residential and tenanted units under investment', () => {
  assert.equal(getMarketCategory({ propertyType: '区分マンション', currentStatus: '居住中' }), 'residential')
  assert.equal(getMarketCategory({ propertyType: '戸建', currentStatus: '空家' }), 'residential')
  assert.equal(getMarketCategory({ propertyType: '区分マンション', currentStatus: 'オーナーチェンジ（賃貸中）' }), 'investment')
  assert.equal(getMarketCategory({ propertyType: '区分マンション', currentStatus: '賃貸借契約中' }), 'investment')
  assert.equal(getMarketCategory({ propertyType: '戸建', yieldGross: '4.2' }), 'investment')
})

test('includes whole buildings and offices but leaves unknown types for review', () => {
  for (const propertyType of ['一棟マンション', '一棟アパート', '一棟ビル', '店舗・事務所']) {
    assert.equal(getMarketCategory({ propertyType }), 'investment')
    assert.equal(isPublicPropertyType(propertyType), true)
  }
  assert.equal(getMarketCategory({ propertyType: 'その他' }), null)
  assert.equal(isPublicPropertyType('その他'), false)
})
