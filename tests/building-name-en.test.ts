import assert from 'node:assert/strict'
import test from 'node:test'
import { extractBuildingNameEn } from '../src/lib/building-name'

test('the English name is read from a "Name: " opening', () => {
  assert.equal(extractBuildingNameEn('City Terrace Yoyogi Koen: 42.10 m² 1LDK on the 4th floor.'), 'City Terrace Yoyogi Koen')
  assert.equal(extractBuildingNameEn('FL Residence Ikebukuro I: a 1K unit'), 'FL Residence Ikebukuro I')
  assert.equal(extractBuildingNameEn('Shibuya Co-op: 63.08 m²'), 'Shibuya Co-op')
})

test('names inside older sentence patterns are found too', () => {
  assert.equal(extractBuildingNameEn('A condominium unit in Chambre Komazawa, priced at JPY 20,350,000.'), 'Chambre Komazawa')
  assert.equal(extractBuildingNameEn('Morishita K-1 Building is a whole-building investment property with residential units.'), 'Morishita K-1 Building')
  assert.equal(extractBuildingNameEn('The Parkhouse Shibuya Nanpeidai. A 55 m² apartment.'), 'The Parkhouse Shibuya Nanpeidai')
})

test('descriptive or address-like openings are not names', () => {
  assert.equal(extractBuildingNameEn('A 75.96 m², 3LDK corner apartment on the fifth floor: south facing.'), null)
  assert.equal(extractBuildingNameEn('Condominium in Nakano: 70 m²'), null)
  assert.equal(extractBuildingNameEn('Tobu Nishiarai Station East Exit Sunlight Mansion B: 2DK'), null)
  assert.equal(extractBuildingNameEn('House Minami Aoyama, floor 2: vacant'), null)
  assert.equal(extractBuildingNameEn('Land in Setagaya, Tokyo: 120 m²'), null)
  assert.equal(extractBuildingNameEn(''), null)
  assert.equal(extractBuildingNameEn(null), null)
})

test('the English name is not used when it just repeats the ward and type', () => {
  assert.equal(extractBuildingNameEn('Whole building in Koto: 8 units'), null)
})

test('card facts carry both names and drop the descriptions', async () => {
  const { withCardFacts } = await import('../src/lib/card-facts')
  const card = withCardFacts({ descriptionJa: 'ライオンズ石神井公園。75㎡', descriptionEn: 'Lions Shakujii Koen: 75 m²', price: 1 })
  assert.equal(card.buildingName, 'ライオンズ石神井公園')
  assert.equal(card.buildingNameEn, 'Lions Shakujii Koen')
  assert.equal('descriptionEn' in card, false)
})
