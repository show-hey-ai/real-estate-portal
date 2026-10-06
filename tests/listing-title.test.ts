import assert from 'node:assert/strict'
import test from 'node:test'
import { buildListingTitle } from '../src/lib/site-config'

const listing = { propertyType: '区分マンション', price: 59_800_000, addressPublic: '東京都練馬区下石神井3丁目1-1 201号室', city: '練馬区', buildingArea: '75.40' }

test('English titles name the ward and size instead of a Japanese street address', () => {
  const title = buildListingTitle(listing, 'en')
  assert.match(title, /^Condominium in Nerima, Tokyo \| 75\.4 m² \| /)
  assert.doesNotMatch(title, /丁目|号室/)
})

test('Japanese titles keep the published address', () => {
  assert.match(buildListingTitle(listing, 'ja'), /下石神井3丁目1-1 201号室/)
})

test('English land titles use land area and fall back to Tokyo without a ward', () => {
  assert.match(buildListingTitle({ propertyType: '土地', price: 80_000_000, landArea: 120, city: null }, 'en'), /^Land in Tokyo \| 120 m² \| /)
})
