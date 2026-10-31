import assert from 'node:assert/strict'
import test from 'node:test'
import { extractBuildingNameEn } from '../src/lib/building-name'

test('the English name is read from a "Name: " opening', () => {
  assert.equal(extractBuildingNameEn('City Terrace Yoyogi Koen: 42.10 m² 1LDK on the 4th floor.'), 'City Terrace Yoyogi Koen')
  assert.equal(extractBuildingNameEn('FL Residence Ikebukuro I: a 1K unit'), 'FL Residence Ikebukuro I')
  assert.equal(extractBuildingNameEn('Shibuya Co-op: 63.08 m²'), 'Shibuya Co-op')
  assert.equal(extractBuildingNameEn('High Town Ikegami No.2: a 3LDK unit'), 'High Town Ikegami No.2')
  assert.equal(extractBuildingNameEn('Sun Heights Kamiikedai. A 60 m² unit: vacant.'), null)
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
  assert.equal(extractBuildingNameEn('Oji 1-chome condominium: a tenanted investment property'), null)
  assert.equal(extractBuildingNameEn('Toa Shintomi Mansion: 40 m²'), 'Toa Shintomi Mansion')
  assert.equal(extractBuildingNameEn('シティプラザ若林: 16.73 m², 1R'), null)
  assert.equal(extractBuildingNameEn(''), null)
  assert.equal(extractBuildingNameEn(null), null)
})

test('the English name is not used when it just repeats the ward and type', () => {
  assert.equal(extractBuildingNameEn('Whole building in Koto: 8 units'), null)
})

test('card facts carry both names and drop the descriptions', async () => {
  const { withCardFacts } = await import('../src/lib/card-facts')
  const card = withCardFacts({ descriptionJa: 'ライオンズ石神井公園。75㎡', descriptionEn: 'Lions Shakujii Koen: 75 m²', price: 1 }, 'en')
  assert.equal(card.buildingName, 'ライオンズ石神井公園')
  assert.equal(card.buildingNameEn, 'Lions Shakujii Koen')
  assert.equal('descriptionEn' in card, false)
})

test('Chinese pages show the romanised name when the Japanese one is in kana', async () => {
  const { buildingNameFor } = await import('../src/lib/building-name')
  assert.equal(buildingNameFor('zh-CN', 'ブランズタワー芝浦', 'Brillia Tower Shibaura'), 'Brillia Tower Shibaura')
  assert.equal(buildingNameFor('zh-TW', '第18宮廷マンション', 'Kyutei Mansion No 18'), 'Kyutei Mansion No 18')
  assert.equal(buildingNameFor('zh-CN', '品川東急大厦', 'Shinagawa Tokyu Building'), '品川東急大厦')
  assert.equal(buildingNameFor('zh-CN', 'ブランズタワー芝浦', null), 'ブランズタワー芝浦')
  assert.equal(buildingNameFor('ja', 'ブランズタワー芝浦', 'Brillia Tower Shibaura'), 'ブランズタワー芝浦')
  assert.equal(buildingNameFor('en', 'ブランズタワー芝浦', 'Brillia Tower Shibaura'), 'Brillia Tower Shibaura')
  assert.equal(buildingNameFor('en', 'ブランズタワー芝浦', null), null)
})
