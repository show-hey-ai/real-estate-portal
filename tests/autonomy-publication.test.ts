import assert from 'node:assert/strict'
import test from 'node:test'
import { listingFactsHash, makeImportReceipt, publicationIssues, sourcePrices, translationIssues } from '../src/lib/autonomy/publication'
import { isPageIndexable } from '../src/lib/autonomy/page-verification'

test('public release verification rejects indexing exclusions in headers and reordered robot metadata', () => {
  const published = '<main data-public-listing="example">Public property</main>'
  assert.equal(isPageIndexable(published, 'index, follow'), true)
  for (const directive of ['noindex', 'googlebot: NOINDEX, follow', 'none']) assert.equal(isPageIndexable(published, directive), false)
  for (const meta of ['<meta name="robots" content="noindex, follow">', "<meta content='none' name='ROBOTS'>", '<meta name=googlebot content=noindex>']) assert.equal(isPageIndexable(meta + published, null), false)
  assert.equal(isPageIndexable('<meta name="description" content="none of these imply market prices">' + published, null), true)
})

const now = new Date('2026-10-02T00:00:00Z')
const facts = {
  propertyType: '区分マンション', price: 68000000, prefecture: '東京都', city: '目黒区',
  addressPublic: '東京都目黒区目黒1丁目', addressPrivate: '東京都目黒区目黒1丁目2番3号',
  adAllowed: true, adConsentRequired: false, hospitalityCategory: null,
  sourcePropertyId: '100123456789',
  sourcePdfUrl: 'https://example.test/source.pdf', descriptionJa: '物件説明', descriptionEn: 'Property description', descriptionZhTw: '物件說明', descriptionZhCn: '房产说明',
}
const receipt = makeImportReceipt(facts, {
  sourceHash: 'a'.repeat(64),
  ad: { status: 'ALLOWED', can_publish: true, confidence: 0.99, verified_allowed: true, positive_evidence: ['自社HP掲載可'], blocking_evidence: [], verifier_blocking_texts: [] },
  confidence: { overall: 0.99, price: 0.99, address: 0.99 },
  evidence: [{ field_name: 'price', raw_text: '価格6,800万円', confidence: 0.99 }, { field_name: 'address_full', raw_text: facts.addressPrivate, confidence: 0.99 }, { field_name: 'reins_property_id', raw_text: 'REINS物件番号100123456789', confidence: 0.99 }, { field_name: 'source_text', raw_text: '自社HP掲載可。売買物件資料。', confidence: 0.99 }],
}, now)

test('verified original facts pass without a per-listing approval', () => {
  assert.deepEqual(publicationIssues(facts, receipt, now), [])
  assert.equal(listingFactsHash({ ...facts, price: BigInt(facts.price) }), receipt.factsHash)
})

test('source-verified town-only addresses can be published without exposing lot or unit numbers', () => {
  const townFacts = { ...facts, city: '中央区', addressPublic: '東京都中央区日本橋小舟町', addressPrivate: '東京都中央区日本橋小舟町9-10' }
  const townReceipt = { ...receipt, factsHash: listingFactsHash(townFacts), evidence: [receipt.evidence[0], { field_name: 'address_full', raw_text: townFacts.addressPrivate, confidence: 0.99 }, receipt.evidence[2], receipt.evidence[3]] }
  assert.deepEqual(publicationIssues(townFacts, townReceipt, now), [])
  for (const addressPublic of ['東京都中央区日本橋小舟町9番10号', '東京都中央区日本橋小舟町101号室', '東京都中央区日本橋小舟町サンクタス日本橋小舟町', '東京都中央区日本橋小舟町九の十サンクタス日本橋小舟町']) {
    const variant = { ...townFacts, addressPublic }
    assert.match(publicationIssues(variant, { ...townReceipt, factsHash: listingFactsHash(variant) }, now).join(' '), /exactly match|source evidence/)
  }
})

test('the final release gate accepts a linked own-site exception but rejects restricted and uncertain evidence', () => {
  const withText = (text: string) => ({ ...receipt, ad: { ...receipt.ad, positive_evidence: [text] } })
  assert.deepEqual(publicationIssues(facts, withText('広告掲載不可。ただし自社HPのみ掲載可'), now), [])
  assert.deepEqual(publicationIssues(facts, withText('広告転載区分：一部可（インターネット）'), now), [])
  for (const text of ['広告可否は未確認', '広告可（紙媒体に限る）', '広告掲載可（SUUMO限定）', '広告掲載不可。ただし自社HP可。当物件の広告は認めません']) {
    assert.match(publicationIssues(facts, withText(text), now).join(' '), /explicit permission statement/i)
  }
})

test('changed facts, ambiguous prices, stale evidence and advertising contradictions fail closed', () => {
  assert.match(publicationIssues({ ...facts, price: 69000000 }, receipt, now).join(' '), /facts changed|Price does not match/)
  assert.match(publicationIssues(facts, { ...receipt, ad: { ...receipt.ad, blocking_evidence: ['広告不可'] } }, now).join(' '), /Advertising permission/)
  assert.match(publicationIssues(facts, receipt, new Date(now.getTime() + 25 * 3600_000)).join(' '), /expired/)
  const ambiguous = { ...receipt, evidence: [{ field_name: 'price', raw_text: '旧価格7000万円、現価格6800万円', confidence: 0.99 }, receipt.evidence[1]] }
  assert.match(publicationIssues(facts, ambiguous, now).join(' '), /unambiguous/)
})

test('missing verification, address privacy failures and low-confidence facts cannot be auto-published', () => {
  assert.match(publicationIssues(facts, { ...receipt, ad: { ...receipt.ad, verified_allowed: false } }, now).join(' '), /independent/)
  assert.match(publicationIssues({ ...facts, addressPublic: facts.addressPrivate }, receipt, now).join(' '), /facts changed/)
  assert.match(publicationIssues(facts, { ...receipt, confidence: { ...receipt.confidence, price: 0.9 } }, now).join(' '), /confidence/)
})

test('source amounts are checked in yen, including full-width numerals and decimal billions', () => {
  assert.deepEqual(sourcePrices('価格６，８００万円'), [68000000])
  assert.deepEqual(sourcePrices('価格1.25億円'), [125000000])
  assert.deepEqual(sourcePrices('価格1億2,800万円'), [128000000])
  assert.deepEqual(sourcePrices('1億円'), [100000000])
  assert.deepEqual(sourcePrices('住所1丁目'), [])
})

test('translation cannot introduce new numerical claims or guaranteed returns', () => {
  assert.deepEqual(translationIssues({ ...facts, descriptionJa: '価格6800万円、63㎡', buildingArea: 63, descriptionEn: 'JPY 68,000,000, 63 sqm' }), [])
  assert.match(translationIssues({ ...facts, descriptionEn: 'Guaranteed return of 99%' }).join(' '), /numeric claim|guarantee/)
})

test('translated tags are immutable checked facts and public prose cannot expose the private address', () => {
  const tagged = { ...facts, featuresEn: ['Guaranteed return 99%'] }
  const taggedReceipt = { ...receipt, factsHash: listingFactsHash(tagged) }
  assert.match(publicationIssues(tagged, taggedReceipt, now).join(' '), /numeric claim|guarantee/)
  assert.notEqual(listingFactsHash({ ...tagged, featuresEn: ['Guaranteed return 999%'] }), taggedReceipt.factsHash)
  const exposed = { ...facts, descriptionJa: `住所: ${facts.addressPrivate}` }
  assert.match(publicationIssues(exposed, { ...receipt, factsHash: listingFactsHash(exposed) }, now).join(' '), /private address/)
  for (const descriptionJa of ['目黒1丁目2番3号の物件です', 'Meguro 1-2-3 property']) {
    const variant = { ...facts, descriptionJa }
    assert.match(publicationIssues(variant, { ...receipt, factsHash: listingFactsHash(variant) }, now).join(' '), /private (address|lot)/)
  }
})


test('full public addresses require exact original address and unit evidence, never numeric prefixes', () => {
  const detailed = { ...facts, addressPrivate: '東京都目黒区目黒1丁目2-22サンプル2010号室', addressPublic: '東京都目黒区目黒1丁目2-22サンプル2010号室' }
  const proof = { ...receipt, factsHash: listingFactsHash(detailed), evidence: [receipt.evidence[0], { field_name: 'address_full', raw_text: detailed.addressPrivate, confidence: 0.99 }, receipt.evidence[2], receipt.evidence[3]] }
  assert.deepEqual(publicationIssues(detailed, proof, now), [])
  for (const addressPublic of [detailed.addressPublic.replace('2-22', '2-2'), detailed.addressPublic.replace('2010', '201')]) {
    const variant = { ...detailed, addressPublic }
    assert.match(publicationIssues(variant, { ...proof, factsHash: listingFactsHash(variant) }, now).join(' '), /exactly match/)
    const forgedPrivate = { ...variant, addressPrivate: addressPublic }
    assert.match(publicationIssues(forgedPrivate, { ...proof, factsHash: listingFactsHash(forgedPrivate) }, now).join(' '), /source evidence/)
  }
  assert.deepEqual(publicationIssues(detailed, { ...proof, evidence: [proof.evidence[0], { ...proof.evidence[1], raw_text: `所在地：${detailed.addressPrivate}` }, proof.evidence[2], proof.evidence[3]] }, now), [])
  for (const adFlags of [{ adAllowed: false }, { adConsentRequired: true }]) {
    const variant = { ...detailed, ...adFlags }
    assert.match(publicationIssues(variant, { ...proof, factsHash: listingFactsHash(variant) }, now).join(' '), /permission/)
  }
})

test('property-specific address restrictions prevent detailed publication wherever they appear in source evidence', () => {
  const detailed = { ...facts, addressPublic: facts.addressPrivate }
  const proof = { ...receipt, factsHash: listingFactsHash(detailed) }
  for (const text of ['広告可（所在地は丁目まで、番地・部屋番号は非公開）', '番地を伏せて掲載', '番地は掲載しないでください', '部屋番号の掲載は不可', '住所詳細は非表示', '建物名の掲載はNG', '部屋番号の掲載禁止', '住所詳細の掲載には承諾が必要', '建物名は表示しない', 'Do not disclose the unit number', '地址仅显示到街区，门牌号不公开']) {
    const viaAd = { ...proof, ad: { ...proof.ad, positive_evidence: ['自社HP掲載可', text] } }
    assert.match(publicationIssues(detailed, viaAd, now).join(' '), /address disclosure restriction/)
    const viaSource = { ...proof, evidence: [...proof.evidence, { field_name: 'source_text', raw_text: text, confidence: 0.99 }] }
    assert.match(publicationIssues(detailed, viaSource, now).join(' '), /address disclosure restriction/)
    // Keeping the verified area public still respects the source's restriction.
    assert.deepEqual(publicationIssues(facts, { ...viaSource, factsHash: listingFactsHash(facts) }, now), [])
  }
})

test('approved address in public prose is exempt only as an exact value, never a longer lot or unit prefix', () => {
  for (const addressPrivate of ['東京都目黒区目黒1-2-2', '東京都目黒区目黒1-2-2サンプル201号室']) {
    const detailed = { ...facts, addressPrivate, addressPublic: addressPrivate }
    const proof = { ...receipt, evidence: [receipt.evidence[0], { field_name: 'address_full', raw_text: addressPrivate, confidence: 0.99 }, receipt.evidence[2], receipt.evidence[3]] }
    const exact = { ...detailed, descriptionJa: `所在地：${addressPrivate}。` }
    assert.deepEqual(publicationIssues(exact, { ...proof, factsHash: listingFactsHash(exact) }, now), [])
    for (const wrong of [addressPrivate + '2', addressPrivate.replace('1-2-2', '1-2-22')]) {
      const variant = { ...detailed, descriptionJa: `所在地：${wrong}` }
      assert.match(publicationIssues(variant, { ...proof, factsHash: listingFactsHash(variant) }, now).join(' '), /private lot or unit/)
    }
  }
})

test('full source review text is required and long evidence retains restrictions across audit chunks', () => {
  const detailed = { ...facts, addressPublic: facts.addressPrivate }
  const absent = { ...receipt, factsHash: listingFactsHash(detailed), evidence: receipt.evidence.filter((item) => item.field_name !== 'source_text') }
  assert.match(publicationIssues(detailed, absent, now).join(' '), /Full-page source review/)
  const text = '原資料'.repeat(1310) + '番地は掲載しないでください' + '原資料'.repeat(1500)
  const proof = makeImportReceipt(detailed, { ...receipt, evidence: [...receipt.evidence.slice(0, 3), { field_name: 'source_text', raw_text: text, confidence: 0.99 }] }, now)
  assert.ok(proof.evidence.every((item) => item.raw_text.length <= 4000))
  assert.match(publicationIssues(detailed, proof, now).join(' '), /address disclosure restriction/)
})

test('REINS accessibility headings and metadata labels are not address restrictions', () => {
  const detailed = { ...facts, addressPublic: facts.addressPrivate }
  const proof = makeImportReceipt(detailed, { ...receipt, evidence: [...receipt.evidence, { field_name: 'source_text', raw_text: '- generic: 部屋番号\n- generic: 角部屋\n- generic: その他所在地表示\n- heading: 図面', confidence: 0.99 }] }, now)
  assert.deepEqual(publicationIssues(detailed, proof, now), [])
})
