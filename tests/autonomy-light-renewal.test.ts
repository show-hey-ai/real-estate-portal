import assert from 'node:assert/strict'
import test from 'node:test'
import { baselineFromReceipt, lightRenewalDecision, type FullCheckBaseline, type LightRenewalInput } from '../src/lib/autonomy/light-renewal'
import { firstPublicationDate, makeImportReceipt } from '../src/lib/autonomy/publication'
import type { ReinsDetail } from '../src/lib/reins-detail'

const now = new Date('2026-10-08T00:00:00Z')
const hours = (count: number) => new Date(now.getTime() + count * 3600_000)
const listing = { status: 'PUBLISHED', sourcePropertyId: '100100100100', price: 59_800_000, autonomyValidUntil: hours(3) }
const baseline: FullCheckBaseline = { capturedAt: hours(-21), adField: '広告可', changedOn: '令和8年10月6日', factsUnchanged: true }
const detail: ReinsDetail = { sourcePropertyId: '100100100100', price: 59_800_000, adField: '広告可', dealStatus: '', changedOn: '令和8年10月6日', imageNames: [] }
const input = (overrides: Partial<LightRenewalInput> = {}): LightRenewalInput => ({ listing, baseline, detail, checkedAt: hours(-1), now, ...overrides })

test('an unchanged REINS page keeps the listing for a week plus a grace day after the check', () => {
  assert.deepEqual(lightRenewalDecision(input()), { action: 'extend', validUntil: hours(-1 + 24 * 8) })
})

test('the monthly full check is a hard limit', () => {
  const lateBaseline = { ...baseline, capturedAt: hours(-24 * 30 + 5) }
  assert.deepEqual(lightRenewalDecision(input({ baseline: lateBaseline })), { action: 'extend', validUntil: hours(5) })
  const due = lightRenewalDecision(input({ baseline: { ...baseline, capturedAt: hours(-24 * 30 - 1) } }))
  assert.equal(due.action, 'full_check')
})

test('any change on REINS or in our facts needs the full check instead', () => {
  const cases: Partial<LightRenewalInput>[] = [
    { detail: { ...detail, price: 57_800_000 } },
    { detail: { ...detail, price: null } },
    { detail: { ...detail, adField: '不可' } },
    { detail: { ...detail, changedOn: '令和8年10月7日' } },
    { baseline: { ...baseline, factsUnchanged: false } },
    { baseline: null },
  ]
  for (const overrides of cases) assert.equal(lightRenewalDecision(input(overrides)).action, 'full_check', JSON.stringify(overrides))
})

test('without a saved baseline the REINS field must allow us and the change date must predate the full check', () => {
  const unknown = { ...baseline, adField: null, changedOn: null }
  assert.equal(lightRenewalDecision(input({ baseline: unknown })).action, 'extend')
  assert.equal(lightRenewalDecision(input({ baseline: unknown, detail: { ...detail, changedOn: '令和8年10月6日' } })).action, 'extend')
  // The full check ran on 10/7 (JST); a change dated that same day cannot be ordered, so it counts as a change.
  assert.equal(lightRenewalDecision(input({ baseline: unknown, detail: { ...detail, changedOn: '令和8年10月7日' } })).action, 'full_check')
  assert.equal(lightRenewalDecision(input({ baseline: unknown, detail: { ...detail, changedOn: null } })).action, 'full_check')
  assert.equal(lightRenewalDecision(input({ baseline: unknown, detail: { ...detail, adField: '広告可（要連絡）' } })).action, 'full_check')
})

test('a sales status that is missing or not plainly open needs the full check', () => {
  assert.equal(lightRenewalDecision(input({ detail: { ...detail, dealStatus: null } })).action, 'full_check')
  assert.equal(lightRenewalDecision(input({ detail: { ...detail, dealStatus: '公開中' } })).action, 'extend')
  assert.equal(lightRenewalDecision(input({ detail: { ...detail, dealStatus: '要確認' } })).action, 'full_check')
  assert.equal(lightRenewalDecision(input({ detail: { ...detail, dealStatus: '取下げ' } })).action, 'withdraw')
})

test('a purchase application or pause hides the listing now', () => {
  const decision = lightRenewalDecision(input({ detail: { ...detail, dealStatus: '書面による購入申込みあり' } }))
  assert.equal(decision.action, 'withdraw')
})

test('stale, future or mismatched pages and expired or manual listings are not extended', () => {
  assert.equal(lightRenewalDecision(input({ checkedAt: hours(-7) })).action, 'skip')
  assert.equal(lightRenewalDecision(input({ checkedAt: hours(1) })).action, 'skip')
  assert.equal(lightRenewalDecision(input({ detail: { ...detail, sourcePropertyId: '100100100199' } })).action, 'skip')
  assert.equal(lightRenewalDecision(input({ listing: { ...listing, autonomyValidUntil: null } })).action, 'skip')
  assert.equal(lightRenewalDecision(input({ listing: { ...listing, status: 'ARCHIVED' } })).action, 'skip')
  assert.equal(lightRenewalDecision(input({ listing: { ...listing, autonomyValidUntil: hours(-1) } })).action, 'full_check')
  assert.equal(lightRenewalDecision(input({ listing: { ...listing, autonomyValidUntil: hours(24 * 8 + 5) } })).action, 'skip')
})

test('the baseline is read from the full check receipt, across overlapping evidence chunks', () => {
  const snapshot = ['- generic: 物件番号', '- generic: "100100100100"', '- generic: 変更年月日', '- generic: 令和 8年10月 6日', '- generic: 広告転載区分', '- generic: 広告可'].join('\n')
  const facts = { propertyType: '区分マンション', price: 59_800_000 }
  const receipt = makeImportReceipt(facts, {
    sourceHash: 'a'.repeat(64),
    ad: { status: 'ALLOWED', can_publish: true, confidence: 0.99, verified_allowed: true, positive_evidence: ['広告転載区分：広告可'], blocking_evidence: [], verifier_blocking_texts: [] },
    confidence: { overall: 0.99, price: 0.99, address: 0.99 },
    evidence: [{ field_name: 'source_text', raw_text: `${'本文。'.repeat(1300)}\n${snapshot}`, confidence: 0.99 }],
  }, hours(-21))
  assert.ok(receipt.evidence.length > 1)
  const read = baselineFromReceipt(receipt, receipt.factsHash)
  assert.deepEqual(read, { capturedAt: hours(-21), adField: '広告可', changedOn: '令和8年10月6日', factsUnchanged: true })
  assert.equal(baselineFromReceipt(receipt, 'b'.repeat(64))?.factsUnchanged, false)
  assert.equal(baselineFromReceipt({ ...receipt, capturedAt: 'not a date' }, receipt.factsHash), null)
})

test('a re-published listing keeps its first publication date', () => {
  const first = new Date('2026-10-01T00:00:00Z')
  assert.equal(firstPublicationDate(first, now), first)
  assert.equal(firstPublicationDate(null, now), now)
})
