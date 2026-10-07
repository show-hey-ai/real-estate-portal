import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeOcrText, ocrRows, screenAdvertising, type OcrLine } from '../src/lib/ad-screening'

const verdict = (...rows: string[]) => screenAdvertising(rows).verdict

test('a clear general prohibition is the only thing screened out as denied', () => {
  assert.equal(verdict('広告掲載不可'), 'denied')
  assert.equal(verdict('□営業担当：山田 □広告掲載：不可'), 'denied')
  assert.equal(verdict('広告　不可'), 'denied')
  assert.equal(verdict('広告転載区分：不可'), 'denied')
  assert.equal(verdict('広告掲載はご遠慮ください'), 'denied')
})

test('consent, contact and application conditions are held, even next to a permission', () => {
  for (const text of ['要承諾', '物確・案内／広告申請', '物件確認・広告掲載依頼・内見依頼はこちら', '※無断広告掲載厳禁', '広告掲載可能・連絡要', '可（承諾書要）', '広告掲載／担当までお問い合わせください。', '広告：要相談']) {
    assert.equal(verdict(text), 'consent', text)
  }
  assert.equal(verdict('■広告：自社HPのみ可', '広告承諾、その他'), 'consent')
})

test('explicit permissions, including own-site and media exclusions, are candidates', () => {
  for (const text of ['広告転載可／承諾書不要（レインズ、捨て看板は転載厳禁）', '広告：自社HPのみ可／承諾書不要／各種ポータル厳禁', '広告承諾：可　ネット媒体可', '広告掲載：athome,suumo,homes以外は掲載可', '広告　御社ホームページのみ掲載可能です', '広告掲載可能', '広告揭載可']) {
    assert.equal(verdict(text), 'permitted', text)
  }
})

test('partial permission, unmarked option lists and a ban with an own-site exception need a look', () => {
  assert.equal(verdict('広告掲載：一部不可'), 'unclear')
  assert.equal(verdict('広告掲載　可・不可'), 'unclear')
  assert.equal(verdict('広告掲載不可（自社HP除く）'), 'unclear')
})

test('marked checkboxes are read, unmarked boxes are ignored', () => {
  assert.equal(verdict('広告掲載 ■不可 □可'), 'denied')
  assert.equal(verdict('広告掲載 □不可 ■可'), 'permitted')
})

test('bans on other channels and unrelated conditions are not advertising decisions', () => {
  assert.equal(verdict('SUUMO掲載不可'), 'no_mention')
  assert.equal(verdict('捨て看板・チラシ等の広告不可'), 'no_mention')
  assert.equal(verdict('ペット飼育：要承諾'), 'no_mention')
  assert.equal(verdict('広告料相談'), 'no_mention')
  assert.equal(verdict('ゲスト用駐車場あり（要申請）'), 'no_mention')
  assert.equal(verdict('ローン特約での申し込み不可'), 'no_mention')
})

test('bans on one detail or on print media do not exclude the listing (review 2026-10-07)', () => {
  for (const text of ['所在地掲載不可', '住所は掲載不可', '号室の掲載不可', '写真掲載不可', '新聞折込広告不可', '広告掲載はチラシ等ご遠慮ください']) {
    assert.notEqual(verdict(text), 'denied', text)
  }
  assert.equal(verdict('掲載日10/1 ペット■不可'), 'no_mention')
})

test('copyright footers and other approvals are not advertising consent', () => {
  assert.equal(verdict('本図面の無断転載・複製を禁じます'), 'no_mention')
  assert.equal(verdict('譲渡・転貸には地主の承諾が必要'), 'no_mention')
  assert.equal(verdict('広告掲載要承諾 ペット要承諾'), 'consent')
  assert.equal(verdict('広告掲載する場合は事前にご連絡ください'), 'consent')
})

test('OCR confusions are normalised before matching', () => {
  assert.equal(normalizeOcrText('広告場載 不 可'), '広告掲載不可')
  assert.equal(normalizeOcrText('印社ホームページのみ'), '御社ホームページのみ')
})

test('a label and its value cell on the same height read as one row, without joining far columns', () => {
  const lines: OcrLine[] = [
    { text: '広告', x: 0.876, y: 0.047, width: 0.019, height: 0.015 },
    { text: '不可', x: 0.913, y: 0.049, width: 0.017, height: 0.012 },
    { text: 'ペット飼育可', x: 0.1, y: 0.048, width: 0.1, height: 0.014 },
    { text: '取引態様：媒介', x: 0.86, y: 0.2, width: 0.1, height: 0.014 },
  ]
  const rows = ocrRows(lines)
  assert.ok(rows.includes('広告 不可'))
  assert.ok(rows.includes('ペット飼育可'))
  assert.equal(screenAdvertising(rows).verdict, 'denied')
})

test('evidence is a short excerpt around the match', () => {
  const result = screenAdvertising(['会社案内 東京都知事免許 営業時間10時から18時まで 定休日水曜日 広告掲載：不可 手数料3％'])
  assert.equal(result.verdict, 'denied')
  assert.ok(result.evidence[0].length < 40)
  assert.ok(result.evidence[0].includes('広告掲載:不可'))
})
