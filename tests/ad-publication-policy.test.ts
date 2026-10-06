import assert from 'node:assert/strict'
import test from 'node:test'
import { hasExplicitPortalPermission } from '../src/lib/ad-publication-policy'

test('explicit advertising-republication field accepts permission and rejects conditions', () => {
  for (const text of ['広告転載：転載可', '広告転載 転載可', '広告転載区分：転載可能']) {
    assert.equal(hasExplicitPortalPermission(text), true, text)
  }
  for (const text of ['転載可', '広告転載：転載不可', '広告転載：転載可否は未確認', '広告転載：転載可能ではない', '広告転載：転載可（要承諾）', '広告転載：転載可（紙媒体のみ）', '広告転載：転載可、自社HPは不可', '広告転載：転載可、別の欄に掲載禁止']) {
    assert.equal(hasExplicitPortalPermission(text), false, text)
  }
  for (const medium of ['紙媒体', 'チラシ', 'SUUMO']) {
    for (const action of ['転載', '配布']) {
      assert.equal(hasExplicitPortalPermission(`広告転載：転載可（${medium}への${action}のみ）`), false)
    }
  }
})

test('explicit own-site permission and linked exceptions qualify for further checks', () => {
  for (const text of ['広告可能', '広告掲載：可', 'AD可', '広告掲載全媒介可', '自社HP掲載可', '御社ホームページのみ掲載可能', '御社ホームページのみ掲載可能です', '自社サイトのみ可', '1社HPのみ掲載可能', 'SUUMO以外可能', '広告掲載不可。ただし自社HPのみ可', '広告掲載不可 ※1社HPのみ掲載可能']) {
    assert.equal(hasExplicitPortalPermission(text), true, text)
  }
})

test('missing permission, denial, consent and conflicting exceptions remain blocked', () => {
  for (const text of ['', '広告有効期限2026/10', 'SUUMO不可', '楽待・健美家は不可', '広告厳禁', '広告掲載不可', '広告可能ではない', '自社HP掲載可能ではない', '広告可、自社HPは不可', '全て広告禁止。ただし自社HP可', '広告可（要連絡）', '自社HP可・事前確認', '広告掲載申請（自社HPのみ）', 'ネット広告一切厳禁。ただし自社HP可', '広告掲載不可。ただし自社HP可、転載禁止', '広告可・HP含む不可', '広告掲載不可、自社HP可']) {
    assert.equal(hasExplicitPortalPermission(text), false, text)
  }
  for (const text of ['広告可否は未確認', '広告掲載可能ではありません', '自社HP掲載可能ではありません', '広告可（紙媒体のみ）', '広告掲載可、SUUMOのみ掲載可', '広告掲載不可。※別物件は自社HP掲載可', '広告可（インターネット除く）', '広告可能性あり']) assert.equal(hasExplicitPortalPermission(text), false, text)
  assert.equal(hasExplicitPortalPermission('広告転載区分：一部可（インターネット）'), true)
  assert.equal(hasExplicitPortalPermission('広告掲載不可。ただし自社HP可。現在は売主様のお申し出により広告掲載不可'), false)
  assert.equal(hasExplicitPortalPermission('広告掲載不可。別の説明。※自社HP可'), false)
  for (const text of ['広告可（紙媒体に限る）', '広告掲載可（SUUMO限定）', '広告掲載不可。ただし自社HP可。当物件の広告は認めません', '自社HP掲載可能です。掲載申請が必要です', '広告転載区分：一部可（インターネット）。掲載申請が必要です']) assert.equal(hasExplicitPortalPermission(text), false, text)
})
