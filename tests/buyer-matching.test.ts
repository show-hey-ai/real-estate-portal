import test from 'node:test'
import assert from 'node:assert/strict'
import { criteriaSchema, matchListing, searchPlans, matchingVersion } from '../src/lib/buyer-matching-policy'

const criteria = () => criteriaSchema.parse({ purpose: 'residential', budgetMax: 80000000, wards: ['文京区'], propertyTypes: ['condo'], occupancy: 'vacant', minArea: 40, maxWalkMinutes: 10 })
const listing = () => ({ id: 'fixture', propertyType: '区分マンション', price: 60000000, priceCurrency: 'JPY', city: '文京区', currentStatus: '空室', buildingArea: 50, landArea: null, builtYear: 2005, yieldGross: null, stations: [{ walk_minutes: 7 }] })
test('criteria rejects identity injection, invalid ranges and unsupported areas', () => {
  assert(!criteriaSchema.safeParse({ ...criteria(), buyerSubject: 'forged' }).success)
  assert(!criteriaSchema.safeParse({ ...criteria(), budgetMin: 90000000 }).success)
  assert(!criteriaSchema.safeParse({ ...criteria(), wards: ['大阪市'] }).success)
})
test('matching explains confirmed fit, contradictory facts, and unknowns independently', () => {
  const fit = matchListing(criteria(), listing(), [])
  assert.equal(fit.status, 'aligned')
  assert(fit.checks.some(c => c.key === 'budget' && c.result === 'match'))
  const difference = matchListing(criteria(), { ...listing(), price: 90000000, currentStatus: '賃貸中' }, [])
  assert.equal(difference.status, 'outside')
  assert(difference.checks.some(c => c.key === 'occupancy' && c.result === 'miss'))
  const unknown = matchListing(criteria(), { ...listing(), price: null, currentStatus: null }, [])
  assert.equal(unknown.status, 'needs_check')
  assert(unknown.checks.some(c => c.key === 'budget' && c.result === 'unknown'))
})
test('unknown financing and delivery never become approval or occupancy promises', () => {
  const result = matchListing({ ...criteria(), financing: 'loan', timing: 'soon' }, listing(), [])
  assert(result.unconfirmed.includes('financing'))
  assert(result.unconfirmed.includes('handover'))
  assert.equal(matchingVersion, 'buyer-matching-v1')
})
test('explicit ratings can reorder nearby matches but never remove budget mismatches', () => {
  const liked = [{ listingId: 'prior', rating: 5, city: '文京区', propertyType: '区分マンション' }]
  assert(matchListing(criteria(), listing(), liked).preferenceBonus > 0)
  assert.equal(matchListing(criteria(), { ...listing(), price: 90000000 }, liked).status, 'outside')
})
test('REINS plans use bounded criteria in ten-thousand-yen units and preserve post-filters', () => {
  const plans = searchPlans(criteria(), [])
  assert.equal(plans[0].env.REINS_PRICE_MAX, '8000')
  assert.equal(plans[0].env.REINS_CITY, '文京区')
  assert.equal(plans[0].env.REINS_PROPERTY_TYPE, '売マンション')
  assert.equal(plans[0].env.REINS_EXCLUDE_OWNER_CHANGE, 'true')
  assert(plans[0].postFilters.includes('minArea'))
  assert(!JSON.stringify(plans).includes('buyerSubject'))
})
test('no forced 50-million-yen floor, pause remains explicit and preference stays in allowed scope', () => {
  const c = criteriaSchema.parse({ purpose: 'investment', budgetMax: 15000000, wards: ['北区'], propertyTypes: ['house'], active: false })
  const plans = searchPlans(c, [{ listingId: 'old', rating: 5, city: '港区', propertyType: '戸建' }])
  assert.equal(plans[0].env.REINS_PRICE_MAX, '1500')
  assert.equal(plans[0].env.REINS_PRICE_MIN, '')
  assert.equal(plans[0].env.REINS_CITY, '北区')
  assert.equal(c.active, false)
})

test('unknown locations cannot imply shared geographical preferences', () => {
  const unknown={...listing(),city:null}
  const liked=[{listingId:'prior',rating:5,city:null,propertyType:'区分マンション'}]
  assert.equal(matchListing(criteria(),unknown,liked).preferenceBonus,0)
})
