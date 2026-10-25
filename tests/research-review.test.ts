import assert from 'node:assert/strict'
import test from 'node:test'
import { editorialHash, renewedResearchReview } from '../src/lib/autonomy/editorial-policy'

const references = [{ title: '国土交通省 不動産取引に関するお知らせ', url: 'https://www.mlit.go.jp/totikensangyo/const/1_6_bf_000013.html' }]
const locales = { ja: { references }, en: { references }, 'zh-TW': { references }, 'zh-CN': { references } }
const article = { slug: 'japan-buying-process-guide', sourceHash: 'a'.repeat(64), locales }
const review = { slug: article.slug, contentHash: editorialHash(locales), sourceHash: article.sourceHash, verifiedAt: '2026-10-05T00:00:00.000Z', validUntil: '2026-10-12T00:00:00.000Z', references }
const now = new Date('2026-10-25T00:00:00Z')
const allLive = () => true

test('an unchanged article whose official links are live gets a fresh seven-day review', () => {
  const renewed = renewedResearchReview(article, review, allLive, now)
  assert.ok(renewed)
  assert.equal(renewed.verifiedAt, now.toISOString())
  assert.equal(renewed.validUntil, '2026-11-01T00:00:00.000Z')
  assert.equal(renewed.contentHash, review.contentHash)
  assert.deepEqual(renewed.references, references)
})

test('edited text, changed sources or a dead link are left for a person to review', () => {
  assert.equal(renewedResearchReview({ ...article, locales: { ...locales, en: { references, title: 'edited' } } }, review, allLive, now), null)
  assert.equal(renewedResearchReview({ ...article, sourceHash: 'b'.repeat(64) }, review, allLive, now), null)
  assert.equal(renewedResearchReview(article, review, () => false, now), null)
  assert.equal(renewedResearchReview(article, { ...review, slug: 'other' }, allLive, now), null)
})

test('a review with more than two days left is not touched', () => {
  assert.equal(renewedResearchReview(article, { ...review, validUntil: '2026-10-28T00:00:00.000Z' }, allLive, now), null)
})
