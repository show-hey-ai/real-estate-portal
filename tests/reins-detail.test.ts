import assert from 'node:assert/strict'
import test from 'node:test'
import { adFieldPermits, classifyImages, dealStatusBlocks, parseReinsDetail, reinsDate } from '../src/lib/reins-detail'

const ariaSnapshot = [
  '- generic: 物件番号',
  '- generic: "100100100100"',
  '- generic: 登録年月日',
  '- generic: 令和 8年 9月17日',
  '- generic: 変更年月日',
  '- generic: 令和 8年10月 5日',
  '- generic: 広告転載区分',
  '- generic: 一部可（インターネット）',
  '- generic: 取引状況',
  '- generic: 取引状況の補足',
  '- heading "価格" [level=2]',
  '- heading "基本情報" [level=3]',
  '- generic: 価格',
  '- generic: 1,980万円',
  '- generic: 変更前価格',
  '- generic: 2,080万円',
  '- heading "物件画像" [level=2]',
  '- generic: ファイル名',
  '- generic: リビング１.JPG',
].join('\n')

const accessibilityDiff = [
  '~\t\t351 HTML content REINS IP',
  '+\t\t\t356 text 物件番号',
  '+\t\t\t357 text 100100100101',
  '+\t\t\t360 text 変更年月日',
  '+\t\t\t361 text 令和 8年10月 6日',
  '+\t\t\t369 text 広告転載区分',
  '+\t\t\t370 text 広告可',
  '+\t\t\t377 text 取引状況',
  '+\t\t\t378 text 書面による購入申込みあり',
  '+\t\t399 heading 価格, Value: 2',
  '+\t\t\t400 text 価格',
  '+\t\t\t404 text 価格',
  '+\t\t\t405 text 5,099万円',
  '\t\t320 heading 物件画像, Value: 2',
  '\t\t\t321 text 物件画像',
  '\t\t\t327 text ファイル名 DK部分.jpg',
  '\t\t\t334 text ファイル名 外観.jpg',
  '\t\t\t341 text ファイル名 IMG_0001.JPG',
  '\t\t\t348 text ファイル名 仕 入 れ 強 化 中 .jpg',
  '\t\t\t389 text ファイル名 370730.pdf',
  '\t\t\t433 tab (settable, boolean) 価格.com, Value: off',
].join('\n')

test('Playwright snapshots give the facts the light check needs', () => {
  const detail = parseReinsDetail(ariaSnapshot)
  assert.equal(detail.sourcePropertyId, '100100100100')
  assert.equal(detail.price, 19_800_000)
  assert.equal(detail.adField, '一部可(インターネット)')
  assert.equal(detail.dealStatus, '')
  assert.equal(detail.changedOn, '令和8年10月5日')
  assert.deepEqual(detail.imageNames, ['リビング1.JPG'])
})

test('macOS accessibility dumps, including diffs of the previous tree, are read the same way', () => {
  const detail = parseReinsDetail(accessibilityDiff)
  assert.equal(detail.sourcePropertyId, '100100100101')
  assert.equal(detail.price, 50_990_000)
  assert.equal(detail.adField, '広告可')
  assert.equal(detail.dealStatus, '書面による購入申込みあり')
  assert.equal(detail.changedOn, '令和8年10月6日')
  assert.deepEqual(detail.imageNames, ['DK部分.jpg', '外観.jpg', 'IMG_0001.JPG', '仕 入 れ 強 化 中 .jpg'])
})

test('room photos are counted by file name; broker banners and drawings are not photos', () => {
  assert.deepEqual(classifyImages(['DK部分.jpg', '洋室①.jpg', 'キッチン02.jpg', '外観.jpg', 'バルコニー眺望.jpg', 'IMG_0001.JPG', '仕 入 れ 強 化 中 .jpg', '東京都某区1-2-3.jpg']), { interior: 3, unlabeled: 1, other: 3 })
})

test('REINS advertising field and sales status decisions', () => {
  assert.equal(adFieldPermits('広告可'), true)
  assert.equal(adFieldPermits('転載可'), true)
  assert.equal(adFieldPermits('一部可（インターネット）'), true)
  assert.equal(adFieldPermits('不可'), false)
  assert.equal(adFieldPermits('広告可（但し要連絡）'), false)
  assert.equal(adFieldPermits(null), false)
  assert.equal(dealStatusBlocks('書面による購入申込みあり'), true)
  assert.equal(dealStatusBlocks('売主都合で一時紹介停止中'), true)
  assert.equal(dealStatusBlocks('公開中'), false)
  assert.equal(dealStatusBlocks(''), false)
})

test('REINS dates in the Reiwa era or western form', () => {
  assert.equal(reinsDate('令和 8年10月 5日'), '2026-10-05')
  assert.equal(reinsDate('令和元年5月1日'), '2019-05-01')
  assert.equal(reinsDate('2026/10/05'), '2026-10-05')
  assert.equal(reinsDate('不明'), null)
  assert.equal(reinsDate(null), null)
})
