import assert from 'node:assert/strict'
import test from 'node:test'
import { GUIDE_ORDER, getRelatedGuideArticles } from '../src/content/guides'

test('related guides share tags with the article and never include it', () => {
  const related = getRelatedGuideArticles('japan-earthquake-standards-1981', 'en')
  assert.equal(related.length, 2)
  assert.equal(related[0].slug, 'tokyo-earthquake-flood-risk-check')
  assert.ok(related.every((article) => article.slug !== 'japan-earthquake-standards-1981'))
})

test('without shared tags, related guides follow the reading order and wrap to the start', () => {
  const slug = 'personal-vs-company-japan-property'
  assert.equal(GUIDE_ORDER.at(-1), slug)
  const related = getRelatedGuideArticles(slug, 'ja', 2)
  assert.deepEqual(related.map((article) => article.slug), GUIDE_ORDER.slice(0, 2))
})

test('an unknown slug still returns guides', () => {
  assert.equal(getRelatedGuideArticles('no-such-guide', 'en').length, 2)
})
