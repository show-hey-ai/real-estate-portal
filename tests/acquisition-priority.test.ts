import assert from 'node:assert/strict'
import test from 'node:test'
import { compareDetails, comparePages, detailCandidate, isWorkable, pagePrice, pageWard, photoTier, priceTier, type DetailCandidate } from '../src/lib/acquisition-priority'

test('the user price range comes first, then over ¥100M, then the rest', () => {
  assert.equal(priceTier(68_000_000), 0)
  assert.equal(priceTier(385_000_000), 1)
  assert.equal(priceTier(23_800_000), 2)
  assert.equal(priceTier(null), 3)
})

test('pages with permission come first, then by price range; held and denied pages are not work', () => {
  const pages = [
    { page: 'p.1', verdict: 'no_mention' as const, price: 70_000_000 },
    { page: 'p.2', verdict: 'denied' as const, price: 80_000_000 },
    { page: 'p.3', verdict: 'permitted' as const, price: 30_000_000 },
    { page: 'p.4', verdict: 'permitted' as const, price: 60_000_000 },
    { page: 'p.5', verdict: 'consent' as const, price: 60_000_000 },
  ]
  assert.deepEqual(pages.toSorted(comparePages).map((page) => page.page), ['p.4', 'p.3', 'p.1', 'p.5', 'p.2'])
  assert.deepEqual(pages.filter((page) => isWorkable(page.verdict)).map((page) => page.page), ['p.1', 'p.3', 'p.4'])
})

test('room photos decide the order once permission is known', () => {
  assert.equal(photoTier({ interior: 3, unlabeled: 0 }), 0)
  assert.equal(photoTier({ interior: 1, unlabeled: 0 }), 1)
  assert.equal(photoTier({ interior: 0, unlabeled: 5 }), 1)
  assert.equal(photoTier({ interior: 0, unlabeled: 1 }), 2)
  const base: DetailCandidate = { sourcePropertyId: '', price: 60_000_000, adField: '広告可', adPermits: true, blocked: false, interior: 0, unlabeled: 0 }
  const items: DetailCandidate[] = [
    { ...base, sourcePropertyId: 'no-photos' },
    { ...base, sourcePropertyId: 'rooms', interior: 4 },
    { ...base, sourcePropertyId: 'reins-denied', adField: '不可', adPermits: false, interior: 6 },
    { ...base, sourcePropertyId: 'application', blocked: true, interior: 6 },
  ]
  assert.deepEqual(items.toSorted(compareDetails).map((item) => item.sourcePropertyId), ['rooms', 'no-photos', 'reins-denied', 'application'])
})

test('a parsed REINS detail becomes a ranked candidate', () => {
  const candidate = detailCandidate({ sourcePropertyId: '100100100100', price: 50_990_000, adField: '広告可', dealStatus: '', changedOn: null, imageNames: ['DK部分.jpg', '洋室.jpg', '浴室.jpg', '外観.jpg'] })
  assert.deepEqual(candidate, { sourcePropertyId: '100100100100', price: 50_990_000, adField: '広告可', adPermits: true, blocked: false, interior: 3, unlabeled: 0 })
})

test('page price and ward are read from OCR rows as sorting hints', () => {
  assert.equal(pagePrice(['販売価格 5,480万円', '管理費 月額13,000円']), 54_800_000)
  assert.equal(pagePrice(['■8,680万円（税込）', '月額賃料 31万円', '年間収入 372万円']), 86_800_000)
  assert.equal(pagePrice(['変更前価格 6,000万円', '価格 5,800万円']), 58_000_000)
  assert.equal(pagePrice(['管理費 月額13,000円']), null)
  assert.equal(pageWard(['所在地 東京都世田谷区上馬1-9-19']), '世田谷区')
  assert.equal(pageWard(['北区赤羽1丁目']), '北区')
  assert.equal(pageWard(['港区の夜景を一望']), null)
})
