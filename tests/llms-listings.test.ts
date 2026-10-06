import assert from 'node:assert/strict'
import test from 'node:test'
import { formatLlmsListing } from '../src/lib/llms-listings'

test('listing lines state type, ward, asking price, area and year in English', () => {
  assert.equal(
    formatLlmsListing({ id: 'a', propertyType: '区分マンション', city: '港区', price: '59800000', buildingArea: '44.2', landArea: null, builtYear: 1980 }, 'https://x/listings/a'),
    '- [Condominium in Minato, Tokyo](https://x/listings/a): asking JPY 59,800,000, 44.2 m² floor area, built 1980',
  )
})

test('land uses land area and missing facts are omitted', () => {
  const line = formatLlmsListing({ id: 'b', propertyType: '土地', city: null, price: null, buildingArea: null, landArea: 120, builtYear: null }, 'https://x/listings/b')
  assert.match(line, /in Tokyo\]/)
  assert.match(line, /120 m² land/)
  assert.doesNotMatch(line, /JPY|built/)
})
