import assert from 'node:assert/strict'
import test from 'node:test'
import { buildConfirmMail, buildDigestMail, criteriaFrom, criteriaLabel, matchesCriteria, newAlertToken, subscribeSchema } from '../src/lib/listing-alerts'

test('sign-up requires a valid email and explicit consent, and rejects bots', () => {
  assert.equal(subscribeSchema.safeParse({ email: ' Buyer@Example.com ', locale: 'ja', consent: true }).data?.email, 'buyer@example.com')
  assert.equal(subscribeSchema.safeParse({ email: 'not-an-email', consent: true }).success, false)
  assert.equal(subscribeSchema.safeParse({ email: 'a@example.com' }).success, false)
  assert.equal(subscribeSchema.safeParse({ email: 'a@example.com', consent: true, website: 'spam' }).success, false)
  assert.equal(subscribeSchema.safeParse({ email: 'a@example.com', consent: true, ward: '大阪市' }).success, false)
  assert.equal(subscribeSchema.safeParse({ email: 'a@example.com', consent: true, ward: '港区', type: 'condominium', budget: '20m-40m' }).success, true)
})

test('criteria keep only the filters that were given', () => {
  assert.deepEqual(criteriaFrom({ ward: '港区', type: undefined, budget: undefined }), { ward: '港区' })
  assert.deepEqual(criteriaFrom({}), {})
})

test('listings match ward, type and budget filters', () => {
  const listing = { id: 'a', city: '港区', propertyType: '区分マンション', price: 30_000_000 }
  assert.ok(matchesCriteria({}, listing))
  assert.ok(matchesCriteria({ ward: '港区', type: 'condominium', budget: '20m-40m' }, listing))
  assert.ok(!matchesCriteria({ ward: '中野区' }, listing))
  assert.ok(!matchesCriteria({ type: 'land' }, listing))
  assert.ok(!matchesCriteria({ budget: 'over-100m' }, listing))
})

test('criteria labels read naturally in each language', () => {
  assert.equal(criteriaLabel({}, 'ja'), '東京23区のすべての物件')
  assert.match(criteriaLabel({ ward: '港区', type: 'condominium' }, 'en'), /Minato.*Condominiums/)
})

test('every mail names the sender, address and contact; digests carry an unsubscribe link', () => {
  const confirm = buildConfirmMail('ja', { ward: '港区' }, 'https://example.test/alerts/confirm?token=t')
  assert.match(confirm.text, /alerts\/confirm\?token=t/)
  assert.match(confirm.text, /自由不動産合同会社/)
  assert.match(confirm.text, /柳橋/)
  const digest = buildDigestMail('en', {}, [{ title: 'Condominium in Minato', price: '¥20.8M', url: 'https://example.test/listings/a' }], 'https://example.test/alerts/unsubscribe?token=t')
  assert.equal(digest.subject, '[Welcome Home Tokyo] 1 new property')
  assert.match(digest.text, /Unsubscribe: https:\/\/example\.test\/alerts\/unsubscribe\?token=t/)
  assert.match(digest.text, /admin@ziyou-fudosan\.com/)
})

test('tokens are long and unguessable', () => {
  const token = newAlertToken()
  assert.ok(token.length >= 40)
  assert.notEqual(token, newAlertToken())
})
