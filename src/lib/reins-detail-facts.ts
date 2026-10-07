import { pageNodes, parseReinsDetail, reinsDate, type PageNode } from './reins-detail'
import { draftFromFacts, type ReviewedDraft } from './reins-reviewed-draft'

/**
 * Reads every label/value fact of a saved REINS 売買物件詳細 page (the same three formats as
 * reins-detail.ts: Playwright ARIA snapshots, macOS accessibility dumps and their diffs), so the
 * operator reviews a drafted reviewed.json instead of reading the 17KB page.
 *
 * Values follow their labels; a label followed directly by another label or a heading is blank.
 * Labels are only recognised inside their own section (「価格」 under 価格, not inside 備考).
 * Contact details (phone numbers, e-mail addresses, the person in charge, member numbers) are
 * never returned: their fields are dropped and every returned string is scrubbed again.
 */

export interface ReinsStation {
  /** 沿線名 as REINS abbreviates it (「総武中央線」「日暮里舎人」). */
  line: string | null
  station: string | null
  /** 駅より徒歩, minutes. */
  walkMinutes: number | null
  /** 駅よりバス, minutes (when the station is not within walking distance). */
  busMinutes: number | null
}

export interface ReinsDetailFacts {
  /** The REINS form from the page title: マンション, 一戸建 or 土地. */
  form: string | null
  sourcePropertyId: string | null
  /** 登録年月日 / 変更年月日 / 更新年月日 as YYYY-MM-DD. */
  registeredOn: string | null
  changedOn: string | null
  updatedOn: string | null
  /** 物件種目 (「中古マンション」) and its sub-type (「オーナーチェンジ」). */
  propertyKind: string | null
  propertyKindNote: string | null
  /** 広告転載区分 as written (normalised width). */
  adField: string | null
  /** 取引態様 (売主, 専任, 一般 …). */
  transactionMode: string | null
  /** 取引状況: '' when REINS leaves it blank, null when the label is absent. */
  dealStatus: string | null
  dealStatusNote: string | null
  /** 商号: the listing broker's company name. */
  broker: string | null
  /** Yen. */
  price: number | null
  previousPrice: number | null
  /** m². 専有面積 for condominiums, 建物面積/土地面積 for houses and land. */
  exclusiveArea: number | null
  balconyArea: number | null
  buildingArea: number | null
  landArea: number | null
  /** 面積計測方式 (壁芯, 内法, 公簿). */
  areaMeasurement: string | null
  prefecture: string | null
  /** 所在地名１ (ward or city), ２ (town and 丁目), ３ (lot number). */
  address1: string | null
  address2: string | null
  address3: string | null
  buildingName: string | null
  roomNumber: string | null
  /** REINS prints 「角部屋」 next to the room number. */
  cornerUnit: boolean
  stations: ReinsStation[]
  /** 間取タイプ (LDK, SLDK, ワンルーム) and 間取部屋数, combined as 3LDK / 1R. */
  layoutType: string | null
  roomCount: number | null
  layout: string | null
  builtYear: number | null
  builtMonth: number | null
  /** SRC, RC, S, 木造, 軽量鉄骨 … */
  structure: string | null
  floorsAboveGround: number | null
  floorsBelowGround: number | null
  /** 所在階. */
  floor: number | null
  /** バルコニー方向 (南, 南東 …). */
  balconyDirection: string | null
  totalUnits: number | null
  /** 棟総戸数: units in this building when the complex has several. */
  buildingUnits: number | null
  /** Yen per month; 0 when REINS says なし. */
  managementFee: number | null
  repairReserve: number | null
  managementType: string | null
  builder: string | null
  /** 現況 (空家, 居住中, 賃貸中, 上物有, 更地 …). */
  currentStatus: string | null
  /** 引渡時期 (即時, 相談, 期日指定) and 引渡年月. */
  handover: string | null
  handoverDate: string | null
  /** 用途地域 as REINS abbreviates it (準工, 一住 …). */
  zoning: string | null
  /** 土地権利 (or 借地権種類 on land pages). */
  landRights: string | null
  leaseFee: string | null
  leaseTerm: string | null
  /** 設備・条件・住宅性能等 items (「ペット可」「システムキッチン」 …). */
  equipment: string[]
  /** 備考１〜４ as written; blank ones dropped. REINS cuts long text mid-word across them. */
  remarks: string[]
  imageNames: string[]
  /** Labels whose value was present but could not be read, as 「label：value」. */
  unreadable: string[]
}

interface Field {
  section: string
  label: string
  parts: string[]
}

type Token = { kind: 'label' | 'value'; value: string }

interface Secrets {
  /** Contact values and the person's full name, removed from every string. */
  exact: string[]
  /** Family / given names, removed from free text (an agent may sign a remark). */
  nameParts: string[]
}

const nfkc = (value: string) => value.normalize('NFKC')

const SECTION_LABELS = new Map(Object.entries({
  基本情報: ['物件番号', '登録年月日', '変更年月日', '更新年月日'],
  分類: ['物件種目', '広告転載区分'],
  取引: ['取引態様', '媒介契約年月日', '取引状況', '取引状況の補足'],
  担当: ['商号', '代表電話番号', '問合せ先電話番号', '物件問合せ担当者', '物件担当者電話番号', 'Ｅメールアドレス', '自社管理欄'],
  価格: ['価格', 'うち価格消費税', '変更前価格', '㎡単価', '坪単価'],
  '面積・不動産ＩＤ': [
    '面積計測方式', '専有面積', '不動産ＩＤ（建物）', '不動産ＩＤ（土地）', 'バルコニー(テラス)面積', '土地共有持分面積', '土地共有持分',
    '土地面積', '建物面積', 'セットバック区分', '私道負担有無', '私道面積', '建物面積１Ｆ', '建物面積２Ｆ', '建物面積その他',
  ],
  所在: ['都道府県名', '所在地名１', '所在地名２', '所在地名３', '建物名', '部屋番号', 'その他所在地表示'],
  交通: ['沿線名', '駅名', '駅より徒歩', '駅より車', '駅よりバス', 'バス停より徒歩', 'バス路線名', 'バス停名称', 'その他交通手段', '交通'],
  間取: ['間取タイプ', '間取部屋数', ...[1, 2, 3, 4, 5].flatMap((n) => [`室${n}:所在階`, `室${n}:室タイプ`, `室${n}:室広さ`]), 'その他'],
  建物: [
    '築年月', '建物構造', '建物工法', '建物形式', '地上階層', '地下階層', '所在階', 'バルコニー方向', '増改築年月１', '増改築履歴１',
    '増改築年月２', '増改築履歴２', '総戸数', '棟総戸数', '販売戸数',
  ],
  維持: [
    '管理組合有無', '管理費', 'うち管理費消費税', '管理形態', '管理会社名', '管理人状況', '修繕積立金', '施主', '施工会社名', '分譲会社名',
    'その他一時金なし', 'その他一時金名称１', '金額１', 'その他一時金名称２', '金額２', 'その他月額費名称', 'その他月額費金額',
  ],
  駐車場: ['駐車場在否', '駐車場月額', '駐車場月額(最低値)', '駐車場月額(最高値)'],
  現況: ['現況'],
  引渡: ['引渡時期', '引渡年月'],
  '報酬・負担割合': ['報酬形態', '手数料割合率', '手数料'],
  法規: [
    '都市計画', '登記簿地目', '現況地目', '用途地域', '最適用途', '地域地区', '建ぺい率', '容積率', '容積率の制限内容',
    'その他の法令上の制限', '再建築不可', '国土法届出', '建築確認コード', '建築確認番号',
  ],
  権利: ['土地権利', '借地権種類', '借地料', '借地期限'],
  土地: ['地勢', '建築条件'],
  接道: ['接道状況', '接道舗装', '接道種別', '接道接面', '接道位置指定', '接道方向', '接道幅員'],
  環境: [1, 2, 3, 4, 5].flatMap((n) => [`周辺環境${n}(フリー)`, `距離${n}`, `時間${n}`]),
  '設備・条件・住宅性能等': ['設備・条件・住宅性能等', '設備(フリースペース)', '条件(フリースペース)', '省エネルギー性能', '目安光熱費'],
  '設備・条件': ['設備・条件', '設備(フリースペース)', '条件(フリースペース)'],
  備考: ['備考１', '備考２', '備考３', '備考４'],
  物件画像: ['ファイル名', '説明'],
  物件図面: ['ファイル名'],
}).map(([section, labels]) => [nfkc(section), new Set(labels.map(nfkc))]))

/** Contact fields: read only to scrub them from everything else, never returned. */
const PRIVATE_LABELS = new Set(['代表電話番号', '問合せ先電話番号', '物件問合せ担当者', '物件担当者電話番号', 'Ｅメールアドレス', '自社管理欄'].map(nfkc))
/** Fixed notes printed beside labels, never values. */
const NOTES = [
  '※3.30578で換算', '（私道を含まず）', '（※目安であり、実際の光熱費ではありません）', '間取タイプ、詳細間取にSが含まれる場合、納戸等を表します。',
  '物件画像は登録されていません。',
].map(nfkc)
const STATION_LABELS = new Set(['沿線名', '駅名', '駅より徒歩', '駅より車', '駅よりバス', 'バス停より徒歩', 'バス路線名', 'バス停名称'])
const STRUCTURES: [RegExp, string][] = [
  [/^(?:SRC|鉄骨鉄筋コンクリート)造?$/u, 'SRC'],
  [/^(?:RC|鉄筋コンクリート)造?$/u, 'RC'],
  [/^(?:S|鉄骨)造?$/u, 'S'],
]
const ERAS: Record<string, number> = { 明治: 1867, 大正: 1911, 昭和: 1925, 平成: 1988, 令和: 2018 }

const PHONE = /(?<!\d)(?:\+81[-‐−―ー()\s]?\d{1,4}|0\d{1,4})[-‐−―ー()\s]{0,2}\d{1,4}[-‐−―ー()\s]{0,2}\d{3,4}(?!\d)/gu
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/gu
const MEMBER_NUMBER = /会員番号[:：]?\s*\d+/gu
const REDACTED = '[省略]'
/** Free text where an agent may sign with a family or given name. */
const FREE_TEXT_KEYS = new Set(['remarks', 'dealStatusNote', 'unreadable', 'imageNames'])
/** Values meaning "not given": blank for typed fields, not a reading failure. */
const NOT_GIVEN = new Set(['確認中', '不明', '未定', '築年不詳', '-', 'ー', '―'])

function longestLabelPrefix(value: string, labels: ReadonlySet<string>): string | null {
  let best: string | null = null
  for (const label of labels) {
    if (value.startsWith(`${label} `) && label.length > (best?.length ?? 0)) best = label
  }
  return best
}

/** Dumps merge a blank label with the next one (「駅より徒歩 駅より車」) or a label with its value (「現況 空家」). */
function tokens(value: string, labels: ReadonlySet<string>): Token[] {
  if (labels.has(value)) return [{ kind: 'label', value }]
  if (NOTES.includes(value)) return []
  const note = NOTES.find((item) => value.startsWith(`${item} `))
  if (note) return tokens(value.slice(note.length).trim(), labels)
  const label = longestLabelPrefix(value, labels)
  if (label) return [{ kind: 'label', value: label }, ...tokens(value.slice(label.length).trim(), labels)]
  return [{ kind: 'value', value }]
}

function readFields(nodes: readonly PageNode[]): { fields: Field[]; form: string | null; secrets: Secrets } {
  const fields: Field[] = []
  const linkSecrets: string[] = []
  let form: string | null = null
  let section: string | null = null
  let open: Field | null = null
  for (const node of nodes) {
    if (node.kind === 'heading') {
      const level = node.level ?? (SECTION_LABELS.has(node.value) ? 2 : 3)
      if (level <= 1) form = node.value.match(/^売買物件詳細\s*\((.+)\)$/u)?.[1] ?? form
      if (level <= 2) section = level === 2 ? node.value : null
      open = null
      continue
    }
    const labels = section === null ? undefined : SECTION_LABELS.get(section)
    if (!labels) continue
    if (node.kind === 'link') {
      // The broker's name is a link; so is the e-mail address, which is never kept.
      if (open?.label === '商号' && !open.parts.length) open.parts.push(node.value)
      else if (open && PRIVATE_LABELS.has(open.label)) linkSecrets.push(node.value)
      continue
    }
    for (const token of tokens(node.value, labels)) {
      if (token.kind === 'value') {
        open?.parts.push(token.value)
        continue
      }
      // An ARIA 「現況」 label followed by a dump-style 「現況 空家」 is one field.
      const current = open as Field | null
      if (current?.label === token.value && !current.parts.length) continue
      const next: Field = { section: section!, label: token.value, parts: [] }
      open = next
      fields.push(next)
    }
  }
  const privateValues = (label: string) => fields.filter((field) => field.label === nfkc(label)).flatMap((field) => field.parts)
  const names = privateValues('物件問合せ担当者')
  // Phone numbers and e-mail addresses exactly as REINS shows them (the patterns below catch the rest).
  const contacts = [...fields.filter((field) => PRIVATE_LABELS.has(field.label)).flatMap((field) => field.parts), ...linkSecrets]
    .filter((value) => value.includes('@') || value.replace(/\D/gu, '').length >= 6)
  return {
    fields: fields.filter((field) => !PRIVATE_LABELS.has(field.label)),
    form,
    secrets: {
      exact: [...contacts, ...names.flatMap((name) => [name, name.replace(/\s+/gu, '')])].filter((value) => value.length >= 2),
      nameParts: names.flatMap((name) => name.split(/[\s()]+/u)).filter((part) => part.length >= 2),
    },
  }
}

function scrub(value: string, secrets: readonly string[]): string {
  const withoutSecrets = secrets.reduce((text, secret) => text.replaceAll(secret, REDACTED), value)
  return withoutSecrets
    .replace(EMAIL, REDACTED)
    .replace(MEMBER_NUMBER, REDACTED)
    .replace(PHONE, (match) => (match.replace(/\D/gu, '').length >= 10 ? REDACTED : match))
}

/** Every string in a value, scrubbed; family / given names only in free text (「オーナーチェンジ」 must survive 「チェン」). */
function scrubDeep<T>(value: T, secrets: Secrets, key = ''): T {
  if (typeof value === 'string') return scrub(value, FREE_TEXT_KEYS.has(key) ? [...secrets.exact, ...secrets.nameParts] : secrets.exact) as T
  if (Array.isArray(value)) return value.map((item) => scrubDeep(item, secrets, key)) as T
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, scrubDeep(item, secrets, name)])) as T
  }
  return value
}

/** 「6,999万円」→ 69,990,000, 「1億2,800万円」→ 128,000,000, 「11,500円」→ 11,500. Anything else is null. */
export function yenAmount(text: string | null | undefined): number | null {
  const value = nfkc(text ?? '').replace(/[,\s]/gu, '')
  const match = value.match(/^(?:(\d+(?:\.\d+)?)億)?(?:(\d+(?:\.\d+)?)万)?(\d+)?円$/u)
  if (!match || (!match[1] && !match[2] && !match[3])) return null
  return Math.round(Number(match[1] ?? 0) * 100_000_000 + Number(match[2] ?? 0) * 10_000 + Number(match[3] ?? 0))
}

/** 「1998年（平成10年） 2月」, 「平成10年2月」 → { year: 1998, month: 2 }. */
export function builtYearMonth(text: string | null | undefined): { year: number; month: number | null } | null {
  const value = nfkc(text ?? '').replace(/\s/gu, '')
  const western = value.replace(/\([^)]*\)/gu, '').match(/^(\d{4})年(?:(\d{1,2})月)?/u)
  const era = western ? null : value.match(/(明治|大正|昭和|平成|令和)(元|\d{1,2})年(?:(\d{1,2})月)?/u)
  const year = western ? Number(western[1]) : era ? ERAS[era[1]] + (era[2] === '元' ? 1 : Number(era[2])) : null
  const monthText = western ? western[2] : era?.[3]
  const month = monthText ? Number(monthText) : null
  if (!year || year < 1868 || year > 2100 || (month !== null && (month < 1 || month > 12))) return null
  return { year, month }
}

/** ＳＲＣ / 鉄骨鉄筋コンクリート造 → SRC, ＲＣ → RC, Ｓ / 鉄骨造 → S; other structures as written. */
export function structureCode(text: string | null | undefined): string | null {
  const value = nfkc(text ?? '').replace(/\s/gu, '').toUpperCase()
  if (!value) return null
  return STRUCTURES.find(([pattern]) => pattern.test(value))?.[1] ?? nfkc(text ?? '').trim()
}

function createReader(fields: readonly Field[], unreadable: string[]) {
  const field = (section: string, label: string) => fields.find((item) => item.section === nfkc(section) && item.label === nfkc(label))
  /** null when the label is absent, '' when REINS leaves it blank. */
  const raw = (section: string, label: string): string | null => {
    const found = field(section, label)
    return found ? found.parts.join(' ').trim() : null
  }
  const text = (section: string, label: string): string | null => raw(section, label) || null
  /** A typed value; a value that is neither blank, 「確認中」-like nor readable is reported. */
  const typed = <T>(section: string, label: string, parse: (value: string) => T | null): T | null => {
    const value = text(section, label)
    if (value === null || NOT_GIVEN.has(value)) return null
    const result = parse(value)
    if (result === null) unreadable.push(`${nfkc(label)}：${value}`)
    return result
  }
  return { field, raw, text, typed }
}

const leadingNumber = (pattern: RegExp) => (value: string): number | null => {
  const match = value.replaceAll(',', '').match(pattern)
  return match ? Number(match[1]) : null
}
const squareMetres = leadingNumber(/^(\d+(?:\.\d+)?)\s*(?:m2|m²)?$/u)
// 「9分」, also with the distance REINS may add (「9分 720m」).
const minutes = leadingNumber(/^(\d+)分(?:\s|$)/u)
const units = leadingNumber(/^(\d+)戸$/u)
const roomCount = leadingNumber(/^(\d+)室$/u)
const floors = (value: string): number | null => {
  const match = value.match(/^(B|地下)?(\d+)(?:階|F)$/iu)
  return match ? Number(match[2]) * (match[1] ? -1 : 1) : null
}
const monthlyYen = (value: string): number | null => (value === 'なし' ? 0 : yenAmount(value))

function readStations(fields: readonly Field[]): ReinsStation[] {
  const groups: Field[][] = []
  for (const item of fields.filter((field) => field.section === '交通' && STATION_LABELS.has(field.label))) {
    if (item.label === '沿線名' || !groups.length) groups.push([])
    groups[groups.length - 1].push(item)
  }
  return groups.map((group) => {
    const value = (label: string) => group.find((item) => item.label === label)?.parts.join(' ').trim() || null
    const walk = value('駅より徒歩')
    const bus = value('駅よりバス')
    return { line: value('沿線名'), station: value('駅名'), walkMinutes: walk ? minutes(walk) : null, busMinutes: bus ? minutes(bus) : null }
  }).filter((station) => station.line || station.station)
}

function layoutOf(type: string | null, count: number | null): string | null {
  if (!type) return null
  if (type === 'ワンルーム') return '1R'
  return count ? `${count}${type}` : null
}

/** Every fact of a saved REINS 売買物件詳細 page; contact details are never included. */
export function parseReinsDetailFacts(text: string): ReinsDetailFacts {
  const { fields, form, secrets } = readFields(pageNodes(text))
  const unreadable: string[] = []
  const { field, raw, text: value, typed } = createReader(fields, unreadable)
  const kindParts = (field('分類', '物件種目')?.parts ?? []).filter((part) => part !== '/' && part !== '／')
  const room = field('所在', '部屋番号')?.parts ?? []
  const built = typed('建物', '築年月', builtYearMonth)
  const layoutType = value('間取', '間取タイプ')
  const rooms = typed('間取', '間取部屋数', roomCount)
  const id = value('基本情報', '物件番号')?.replace(/\s/gu, '') ?? ''
  const equipment = value('設備・条件・住宅性能等', '設備・条件・住宅性能等') ?? value('設備・条件', '設備・条件')
  const facts: ReinsDetailFacts = {
    form,
    sourcePropertyId: /^\d{12}$/u.test(id) ? id : null,
    registeredOn: reinsDate(value('基本情報', '登録年月日')),
    changedOn: reinsDate(value('基本情報', '変更年月日')),
    updatedOn: reinsDate(value('基本情報', '更新年月日')),
    propertyKind: kindParts[0] ?? null,
    propertyKindNote: kindParts.slice(1).join(' ') || null,
    adField: value('分類', '広告転載区分'),
    transactionMode: value('取引', '取引態様'),
    dealStatus: raw('取引', '取引状況'),
    dealStatusNote: value('取引', '取引状況の補足'),
    broker: value('担当', '商号'),
    price: typed('価格', '価格', yenAmount),
    previousPrice: typed('価格', '変更前価格', yenAmount),
    exclusiveArea: typed('面積・不動産ＩＤ', '専有面積', squareMetres),
    balconyArea: typed('面積・不動産ＩＤ', 'バルコニー(テラス)面積', squareMetres),
    buildingArea: typed('面積・不動産ＩＤ', '建物面積', squareMetres),
    landArea: typed('面積・不動産ＩＤ', '土地面積', squareMetres),
    areaMeasurement: value('面積・不動産ＩＤ', '面積計測方式'),
    prefecture: value('所在', '都道府県名'),
    address1: value('所在', '所在地名１'),
    address2: value('所在', '所在地名２'),
    address3: value('所在', '所在地名３'),
    buildingName: value('所在', '建物名'),
    roomNumber: room.filter((part) => part !== '角部屋').join(' ') || null,
    cornerUnit: room.includes('角部屋'),
    stations: readStations(fields),
    layoutType,
    roomCount: rooms,
    layout: layoutOf(layoutType, rooms),
    builtYear: built?.year ?? null,
    builtMonth: built?.month ?? null,
    structure: structureCode(value('建物', '建物構造')),
    floorsAboveGround: typed('建物', '地上階層', floors),
    floorsBelowGround: typed('建物', '地下階層', floors),
    floor: typed('建物', '所在階', floors),
    balconyDirection: value('建物', 'バルコニー方向'),
    totalUnits: typed('建物', '総戸数', units),
    buildingUnits: typed('建物', '棟総戸数', units),
    managementFee: typed('維持', '管理費', monthlyYen),
    repairReserve: typed('維持', '修繕積立金', monthlyYen),
    managementType: value('維持', '管理形態'),
    builder: value('維持', '施工会社名'),
    currentStatus: value('現況', '現況'),
    handover: value('引渡', '引渡時期'),
    handoverDate: value('引渡', '引渡年月'),
    zoning: value('法規', '用途地域'),
    landRights: value('権利', '土地権利') ?? value('権利', '借地権種類'),
    leaseFee: value('権利', '借地料'),
    leaseTerm: value('権利', '借地期限'),
    equipment: (equipment ?? '').split(/[,、]/u).map((item) => item.trim()).filter(Boolean),
    remarks: ['備考１', '備考２', '備考３', '備考４'].map((label) => value('備考', label)).filter((item): item is string => Boolean(item)),
    imageNames: parseReinsDetail(text).imageNames,
    unreadable,
  }
  return scrubDeep(facts, secrets)
}

/** The reviewed.json `facts` block drafted from a REINS page, with remarks and unread fields for the operator. */
export function draftReviewedFacts(facts: ReinsDetailFacts): ReviewedDraft {
  return draftFromFacts(facts)
}

export type { ReviewedDraft } from './reins-reviewed-draft'
