import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { BuyerCriteriaForm } from '../src/components/buyer/buyer-criteria-form'
import { criteriaSchema } from '../src/lib/buyer-matching-policy'
import { buyerSearchReturnPath, currentComparisonIds, toggleComparison } from '../src/lib/buyer-search-ui'

test('authentication continues to a recognized purpose without carrying private criteria in the URL', () => {
  for (const purpose of ['investment', 'residential', 'land']) assert.equal(buyerSearchReturnPath(purpose), `/match?purpose=${purpose}`)
  for (const value of ['', '//external.invalid', 'investment&budget=100', 'invalid']) assert.equal(buyerSearchReturnPath(value), '/match')
})

test('a withdrawn property frees a comparison slot and cannot be reselected', () => {
  const available = ['a', 'b', 'c', 'd']
  assert.deepEqual(currentComparisonIds(['withdrawn', 'a', 'b'], available), ['a', 'b'])
  assert.deepEqual(toggleComparison(['withdrawn', 'a', 'b'], available, 'c', true), ['a', 'b', 'c'])
  assert.deepEqual(toggleComparison(['a'], available, 'withdrawn', true), ['a'])
})

test('comparison selection is distinct, capped at three and reversible', () => {
  const available = ['a', 'b', 'c', 'd']
  assert.deepEqual(toggleComparison(['a', 'b', 'c'], available, 'd', true), ['a', 'b', 'c'])
  assert.deepEqual(toggleComparison(['a', 'a'], available, 'a', true), ['a'])
  assert.deepEqual(toggleComparison(['a', 'b', 'c'], available, 'b', false), ['a', 'c'])
})

test('collapsed advanced fields retain saved values and yen display units in all four languages', () => {
  const criteria = criteriaSchema.parse({purpose: 'investment', budgetMax: 80000000, minArea: 51.5, minBuiltYear: 2001, maxWalkMinutes: 8, minGrossYield: 4.5, financing: 'loan', wards: ['文京区']})
  for (const locale of ['ja', 'en', 'zh-TW', 'zh-CN']) {
    const html = renderToStaticMarkup(createElement(BuyerCriteriaForm, {locale, criteria, disabled: false, onChange: () => {}}))
    assert.match(html, /value="8000"/)
    for (const value of ['51.5', '2001', '8', '4.5']) assert(html.includes(`value="${value}"`))
    assert.match(html, /option value="loan" selected=""/)
    assert.match(html, /<details[^>]*data-testid="buyer-advanced-criteria"/)
    assert.doesNotMatch(html, /<details[^>]*\bopen=/)
  }
})
