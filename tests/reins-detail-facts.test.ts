import assert from 'node:assert/strict'
import test from 'node:test'
import { builtYearMonth, draftReviewedFacts, parseReinsDetailFacts, structureCode, yenAmount } from '../src/lib/reins-detail-facts'
import { cleanBuildingName } from '../src/lib/reins-reviewed-draft'

// A made-up REINS 売買物件詳細 page (no real person, phone or address), as [kind, text] in page order.
// 'h2'/'h3' are headings, 't' texts, 'l' links. Blank fields are labels followed by a label or heading.
type Node = ['h1' | 'h2' | 'h3' | 't' | 'l', string]
const PERSON = '山田　太郎'
const PHONE = '０３－１１１１－２２２２'
const MOBILE = '090-3333-4444'
const EMAIL = 'test-agent@example.com'
const page: Node[] = [
  ['h2', '基本情報'], ['t', '物件番号'], ['t', '１００１００１００１００'], ['t', '登録年月日'], ['t', '令和 8年 9月17日'],
  ['t', '変更年月日'], ['t', '令和 8年10月 5日'],
  ['h2', '分類'], ['t', '物件種目'], ['t', '中古マンション'], ['t', '／'], ['t', 'オーナーチェンジ'], ['t', '広告転載区分'], ['t', '一部可（インターネット）'],
  ['h2', '取引'], ['t', '取引態様'], ['t', '専任'], ['t', '媒介契約年月日'], ['t', '取引状況'], ['t', '取引状況の補足'],
  ['h2', '担当'], ['h3', '会員情報'], ['t', '商号'], ['l', '（株）テスト不動産'], ['t', '代表電話番号'], ['t', PHONE], ['t', '問合せ先電話番号'],
  ['h3', '物件問合せ担当'], ['t', '物件問合せ担当者'], ['t', PERSON], ['t', '物件担当者電話番号'], ['t', MOBILE],
  ['t', 'Ｅメールアドレス'], ['l', EMAIL], ['t', '自社管理欄'], ['t', 'ＡＢ１２３'],
  ['h2', '価格'], ['h3', '基本情報'], ['t', '価格'], ['t', '6,999万円'], ['t', 'うち価格消費税'], ['t', '変更前価格'], ['t', '坪単価'], ['t', '※3.30578で換算'], ['t', '271.9万円'],
  ['h2', '面積・不動産ＩＤ'], ['h3', '基本情報'], ['t', '面積計測方式'], ['t', '専有面積'], ['t', '８５．１０㎡'], ['t', 'バルコニー(テラス)面積'], ['t', '14.06㎡'],
  ['h2', '所在'], ['t', '都道府県名'], ['t', '東京都'], ['t', '所在地名１'], ['t', '江東区'], ['t', '所在地名２'], ['t', '東砂１丁目'],
  ['t', '所在地名３'], ['t', '９－９'], ['t', '建物名'], ['t', 'テストマンションＡ棟　手有'], ['t', '部屋番号'], ['t', '４０２'], ['t', '角部屋'], ['t', 'その他所在地表示'],
  ['h2', '交通'], ['h3', '交通１'], ['t', '沿線名'], ['t', '都営新宿線'], ['t', '駅名'], ['t', '東大島'], ['t', '駅より徒歩'], ['t', '12分'], ['t', '駅より車'],
  ['h3', '交通２'], ['t', '沿線名'], ['t', '都営新宿線'], ['t', '駅名'], ['t', '大島'], ['t', '駅より徒歩'], ['t', '駅より車'], ['t', '駅よりバス'], ['t', '9分'],
  ['h3', '交通３'], ['t', '沿線名'], ['t', '駅名'], ['t', '駅より徒歩'],
  ['h2', '間取'], ['t', '間取タイプ'], ['t', 'ＬＤＫ'], ['t', '間取部屋数'], ['t', '3室'], ['t', '室１:所在階'], ['t', '室１:室タイプ'],
  ['h2', '建物'], ['t', '築年月'], ['t', '1998年（平成10年） 2月'], ['t', '建物構造'], ['t', 'ＳＲＣ'], ['t', '地上階層'], ['t', '14階'], ['t', '地下階層'],
  ['t', '所在階'], ['t', '4階'], ['t', 'バルコニー方向'], ['t', '南'], ['t', '総戸数'], ['t', '145戸'], ['t', '棟総戸数'],
  ['h2', '維持'], ['t', '管理費'], ['t', '11,500円'], ['t', '管理形態'], ['t', '管理会社に全部委託'], ['t', '修繕積立金'], ['t', '確認中'], ['t', '施工会社名'], ['t', '株式会社テスト建設'],
  ['h2', '現況'], ['t', '現況'], ['t', '空家'],
  ['h2', '引渡'], ['t', '引渡時期'], ['t', '即時'], ['t', '引渡年月'],
  ['h2', '法規'], ['t', '用途地域'], ['t', '準工'], ['t', '最適用途'],
  ['h2', '権利'], ['t', '土地権利'], ['t', '所有権'], ['t', '借地料'], ['t', '借地期限'],
  ['h2', '設備・条件・住宅性能等'], ['t', '設備・条件・住宅性能等'], ['t', 'エレベータ,ペット可,都市ガス'], ['t', '設備(フリースペース)'],
  ['h2', '備考'], ['t', '備考１'], ['t', 'リノベーション済。内見は山田まで'], ['t', '備考２'], ['t', `連絡先 ${MOBILE} / ${EMAIL}`], ['t', '備考３'], ['t', '備考４'],
  ['h2', '物件画像'], ['h3', '１'], ['t', 'ファイル名'], ['t', 'リビング.jpg'], ['t', '説明'],
  ['h2', '物件図面'], ['t', 'ファイル名'], ['t', '9999.pdf'],
  ['h1', '売買物件詳細 (マンション)'], ['t', '自由不動産（同）'], ['t', '会員番号：1234567890123456'],
]

function aria(nodes: Node[]): string {
  return nodes.map(([kind, text]) => {
    if (kind === 'l') return `- link "${text}":\n  - /url: /main/BK/GBK003100`
    if (kind[0] === 'h') return `- heading "${text}" [level=${kind[1]}]`
    return `- generic: ${/^\d+$/.test(text.normalize('NFKC')) ? `"${text}"` : text}`
  }).join('\n')
}

/** macOS accessibility dump: headings repeat their text; blank labels merge with the next label as one text. */
function dump(nodes: Node[], prefix = ''): string {
  let id = 40
  const lines: string[] = ['Window: "REINS IP", App: Google Chrome.', `${id++} HTML content REINS IP, URL: system.reins.jp/main/BK/GBK003100`]
  for (const [kind, text] of nodes) {
    if (kind === 'l') lines.push(`${prefix}\t\t\t${id++} link ${text}, Value: ${text.includes('@') ? `mailto:${text}` : 'system.reins.jp/main/BK/GBK003100'}`)
    else if (kind[0] === 'h') lines.push(`${prefix}\t\t${id++} heading ${text}, Value: ${kind[1]}`, `${prefix}\t\t\t${id++} text ${text}`)
    else lines.push(`${prefix}\t\t\t${id++} text ${text}`)
  }
  return lines.join('\n')
    .replace(/text 駅より徒歩\n.*text 駅より車/gu, 'text 駅より徒歩 駅より車')
    .replace(/text 現況\n.*text 空家/gu, 'text 現況 空家')
    .replace(/text 坪単価\n.*text ※3.30578で換算/gu, 'text 坪単価 ※3.30578で換算')
}

const formats: [string, string][] = [
  ['ARIA snapshot', aria(page)],
  ['macOS dump', dump(page)],
  ['diff of a dump', `The following is a diff from the previous accessibility tree\nRemoved element IDs: 1-10\n${dump(page, '+')}`],
]

for (const [name, text] of formats) {
  test(`${name}: facts are read with full-width text normalised`, () => {
    const facts = parseReinsDetailFacts(text)
    assert.equal(facts.form, 'マンション')
    assert.equal(facts.sourcePropertyId, '100100100100')
    assert.equal(facts.registeredOn, '2026-09-17')
    assert.equal(facts.changedOn, '2026-10-05')
    assert.equal(facts.propertyKind, '中古マンション')
    assert.equal(facts.propertyKindNote, 'オーナーチェンジ')
    assert.equal(facts.adField, '一部可(インターネット)')
    assert.equal(facts.transactionMode, '専任')
    assert.equal(facts.broker, '(株)テスト不動産')
    assert.equal(facts.price, 69_990_000)
    assert.equal(facts.exclusiveArea, 85.1)
    assert.equal(facts.balconyArea, 14.06)
    assert.deepEqual([facts.prefecture, facts.address1, facts.address2, facts.address3], ['東京都', '江東区', '東砂1丁目', '9-9'])
    assert.equal(facts.roomNumber, '402')
    assert.equal(facts.cornerUnit, true)
    assert.deepEqual(facts.stations, [
      { line: '都営新宿線', station: '東大島', walkMinutes: 12, busMinutes: null },
      { line: '都営新宿線', station: '大島', walkMinutes: null, busMinutes: 9 },
    ])
    assert.equal(facts.layout, '3LDK')
    assert.deepEqual([facts.builtYear, facts.builtMonth], [1998, 2])
    assert.equal(facts.structure, 'SRC')
    assert.deepEqual([facts.floorsAboveGround, facts.floor, facts.totalUnits], [14, 4, 145])
    assert.equal(facts.balconyDirection, '南')
    assert.equal(facts.managementFee, 11_500)
    assert.equal(facts.managementType, '管理会社に全部委託')
    assert.equal(facts.builder, '株式会社テスト建設')
    assert.equal(facts.currentStatus, '空家')
    assert.equal(facts.handover, '即時')
    assert.equal(facts.zoning, '準工')
    assert.equal(facts.landRights, '所有権')
    assert.deepEqual(facts.equipment, ['エレベータ', 'ペット可', '都市ガス'])
    assert.deepEqual(facts.imageNames, ['リビング.jpg'])
    assert.deepEqual(facts.unreadable, [])
  })

  test(`${name}: blank fields stay blank instead of taking the next label`, () => {
    const facts = parseReinsDetailFacts(text)
    assert.equal(facts.dealStatus, '')
    assert.equal(facts.dealStatusNote, null)
    assert.equal(facts.previousPrice, null)
    assert.equal(facts.areaMeasurement, null)
    assert.equal(facts.floorsBelowGround, null)
    assert.equal(facts.buildingUnits, null)
    assert.equal(facts.repairReserve, null)
    assert.equal(facts.handoverDate, null)
    assert.equal(facts.leaseFee, null)
    assert.equal(facts.leaseTerm, null)
    assert.equal(facts.stations.length, 2)
  })

  test(`${name}: phone numbers, e-mail addresses, the person in charge and member numbers never appear`, () => {
    const facts = parseReinsDetailFacts(text)
    const output = JSON.stringify([facts, draftReviewedFacts(facts)])
    for (const secret of [PERSON.normalize('NFKC'), '山田', PHONE.normalize('NFKC'), MOBILE, EMAIL, '1234567890123456', 'AB123', '会員番号']) {
      assert.equal(output.includes(secret), false, secret)
    }
    assert.deepEqual(facts.remarks, ['リノベーション済。内見は[省略]まで', '連絡先 [省略] / [省略]'])
  })
}

test('the reviewed.json draft is built only from parsed facts', () => {
  const { facts, remarks, unread, notes } = draftReviewedFacts(parseReinsDetailFacts(formats[1][1]))
  assert.equal(facts.propertyType, '区分マンション')
  assert.equal(facts.city, '江東区')
  assert.equal(facts.addressPublic, '東京都江東区東砂1丁目')
  assert.equal(facts.buildingArea, 85.1)
  assert.equal(facts.floorCount, 14)
  assert.equal(facts.currentStatus, '空室')
  assert.equal(facts.zoning, '準工業地域')
  assert.deepEqual(facts.stations, [{ name: '東大島', name_en: 'Higashi-Ojima', line: '都営新宿線', walk_minutes: 12 }])
  assert.equal(facts.descriptionJa, 'テストマンションA棟。専有面積85.10㎡、4階・南向きの3LDK。都営新宿線「東大島」駅徒歩12分。1998年2月築、総戸数145戸。')
  assert.equal(facts.descriptionEn, 'テストマンションA棟: 85.10 m², 3LDK on the 4th floor, facing south. 12 min walk to Higashi-Ojima Station (Toei Shinjuku Line). Built February 1998; 145 units.')
  assert.equal(facts.descriptionZhTw, 'テストマンションA棟。專有面積85.10㎡，位於4樓，朝南，格局3LDK。都営新宿線「東大島」站步行12分鐘。建於1998年2月，總戶數145戶。')
  assert.equal(facts.descriptionZhCn, 'テストマンションA棟。专有面积85.10㎡，位于4楼，朝南，格局3LDK。都営新宿線「東大島」站步行12分钟。建于1998年2月，总户数145户。')
  assert.deepEqual(facts.features, ['南向き', '総戸数145戸', '角部屋', 'ペット可', 'エレベーター'])
  assert.deepEqual(facts.featuresEn, ['South-facing', '145 units in total', 'Corner unit', 'Pets allowed', 'Elevator'])
  assert.equal(facts.adAllowed, null)
  assert.equal(facts.adConsentRequired, null)
  assert.deepEqual(facts.warnings, [])
  // Remarks never reach the descriptions; the operator gets them separately.
  assert.equal(facts.descriptionJa.includes('リノベーション'), false)
  assert.equal(remarks.length, 2)
  assert.deepEqual(unread, [])
  assert.ok(notes.some((note) => note.includes('「テストマンションA棟 手有」→「テストマンションA棟」')))
  assert.ok(notes.some((note) => note.includes('「大島」バス9分')))
})

test('fields the page does not give are listed as unread', () => {
  const sparse = aria([['h2', '基本情報'], ['t', '物件番号'], ['t', '100100100102'], ['h2', '価格'], ['t', '価格'], ['t', '応相談'], ['h1', '売買物件詳細 (マンション)']])
  const facts = parseReinsDetailFacts(sparse)
  assert.deepEqual(facts.unreadable, ['価格：応相談'])
  const { unread } = draftReviewedFacts(facts)
  assert.ok(unread.includes('price'))
  assert.ok(unread.includes('stations'))
  assert.equal(unread.includes('sourcePropertyId'), false)
})

test('yen amounts, including 億', () => {
  assert.equal(yenAmount('6,999万円'), 69_990_000)
  assert.equal(yenAmount('1億2,800万円'), 128_000_000)
  assert.equal(yenAmount('１億２，８００万円'), 128_000_000)
  assert.equal(yenAmount('2億円'), 200_000_000)
  assert.equal(yenAmount('11,500円'), 11_500)
  assert.equal(yenAmount('0.06万円'), 600)
  assert.equal(yenAmount('応相談'), null)
  assert.equal(yenAmount('5,000万円～6,000万円'), null)
})

test('built year and month, with or without the Japanese era', () => {
  assert.deepEqual(builtYearMonth('1998年（平成10年） 2月'), { year: 1998, month: 2 })
  assert.deepEqual(builtYearMonth('1989年(平成 1年) 7月'), { year: 1989, month: 7 })
  assert.deepEqual(builtYearMonth('平成10年2月'), { year: 1998, month: 2 })
  assert.deepEqual(builtYearMonth('昭和47年 5月'), { year: 1972, month: 5 })
  assert.deepEqual(builtYearMonth('令和元年'), { year: 2019, month: null })
  assert.equal(builtYearMonth('築年不詳'), null)
})

test('structures become ASCII codes', () => {
  assert.equal(structureCode('ＳＲＣ'), 'SRC')
  assert.equal(structureCode('ＲＣ'), 'RC')
  assert.equal(structureCode('Ｓ'), 'S')
  assert.equal(structureCode('鉄骨造'), 'S')
  assert.equal(structureCode('木造'), '木造')
  assert.equal(structureCode(''), null)
})

test('broker notes after a building name are dropped, real multi-word names kept', () => {
  assert.equal(cleanBuildingName('サンプルタワー 他掲載不可'), 'サンプルタワー')
  assert.equal(cleanBuildingName('サンプル青山 9階 指値可'), 'サンプル青山')
  assert.equal(cleanBuildingName('サンプルコーポ 最 上 階 ペ ッ ト 可'), 'サンプルコーポ')
  assert.equal(cleanBuildingName('サンプルシティ ザ タワー棟'), 'サンプルシティ ザ タワー棟')
  assert.equal(cleanBuildingName('ザ サンプルガーデン'), 'ザ サンプルガーデン')
})

test('house and land pages use their own areas and templates', () => {
  const house = aria([
    ['h2', '基本情報'], ['t', '物件番号'], ['t', '100100100103'], ['h2', '分類'], ['t', '物件種目'], ['t', '中古戸建'],
    ['h2', '価格'], ['t', '価格'], ['t', '2,980万円'], ['h2', '面積・不動産ＩＤ'], ['t', '土地面積'], ['t', '（私道を含まず）'], ['t', '35.05㎡'], ['t', '建物面積'], ['t', '52.88㎡'],
    ['h2', '所在'], ['t', '都道府県名'], ['t', '東京都'], ['t', '所在地名１'], ['t', '墨田区'], ['t', '所在地名２'], ['t', '京島１丁目'],
    ['h2', '建物'], ['t', '築年月'], ['t', '昭和47年 5月'], ['t', '建物構造'], ['t', '木造'], ['t', '地上階層'], ['t', '2階'],
    ['h2', '現況'], ['t', '現況'], ['t', '居住中'], ['h1', '売買物件詳細 (一戸建)'],
  ])
  const { facts } = draftReviewedFacts(parseReinsDetailFacts(house))
  assert.equal(facts.propertyType, '戸建')
  assert.deepEqual([facts.landArea, facts.buildingArea], [35.05, 52.88])
  assert.equal(facts.currentStatus, '居住中')
  assert.equal(facts.descriptionJa, '墨田区の中古戸建。土地面積35.05㎡、建物面積52.88㎡。1972年5月築、木造2階建。')
  assert.equal(facts.descriptionZhCn, '位于墨田区的二手独栋住宅。土地面积35.05㎡，建筑面积52.88㎡。建于1972年5月，木造2层楼。')
})
