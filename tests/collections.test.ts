import assert from 'node:assert/strict'
import test from 'node:test'
import { BUDGET_SLUGS, TYPE_COLLECTIONS, budgetBand, budgetSlugFor, inBudget, isTypeSlug, typeSlugFor } from '../src/lib/collections'
import { PRICE_BANDS } from '../src/lib/price-bands'
import { PUBLIC_PROPERTY_TYPES } from '../src/lib/market-category'

test('every public property type belongs to exactly one type collection', () => {
  for (const type of PUBLIC_PROPERTY_TYPES) {
    assert.equal(Object.values(TYPE_COLLECTIONS).filter((collection) => (collection.types as readonly string[]).includes(type)).length, 1, type)
    assert.ok(typeSlugFor(type))
  }
  assert.equal(typeSlugFor('ホテル'), null)
  assert.equal(isTypeSlug('condominium'), true)
  assert.equal(isTypeSlug('toString'), false)
})

test('budget slugs map one-to-one to price bands', () => {
  assert.equal(BUDGET_SLUGS.length, PRICE_BANDS.length)
  for (const slug of BUDGET_SLUGS) assert.equal(budgetSlugFor(budgetBand(slug)!), slug)
  assert.equal(budgetBand('cheap'), null)
})

test('budget membership uses an inclusive minimum and exclusive maximum', () => {
  const band = budgetBand('20m-40m')!
  assert.equal(inBudget(20_000_000, band), true)
  assert.equal(inBudget(40_000_000, band), false)
  assert.equal(inBudget(null, band), false)
  assert.equal(inBudget(385_000_000, budgetBand('over-100m')!), true)
})
