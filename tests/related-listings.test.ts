import assert from 'node:assert/strict'
import test from 'node:test'
import { rankRelatedListings } from '../src/lib/related-listings'

const current = { id: 'a', city: '港区', propertyType: '区分マンション', price: 60_000_000 }
const candidates = [
  { id: 'a', city: '港区', propertyType: '区分マンション', price: 60_000_000 },
  { id: 'far-type', city: '台東区', propertyType: '戸建', price: 300_000_000 },
  { id: 'same-ward-near', city: '港区', propertyType: '区分マンション', price: 62_000_000 },
  { id: 'same-ward-pricey', city: '港区', propertyType: '区分マンション', price: 385_000_000 },
  { id: 'other-ward-near', city: '中央区', propertyType: '区分マンション', price: 59_000_000 },
]

test('the current listing is excluded and the best matches come first', () => {
  assert.deepEqual(rankRelatedListings(current, candidates).map((item) => item.id), ['same-ward-near', 'same-ward-pricey', 'other-ward-near'])
})

test('ties are broken by price proximity and the limit is respected', () => {
  assert.deepEqual(rankRelatedListings({ ...current, city: null }, candidates, 2).map((item) => item.id), ['other-ward-near', 'same-ward-near'])
})
