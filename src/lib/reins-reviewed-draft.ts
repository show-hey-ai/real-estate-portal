import type { ReinsDetailFacts, ReinsStation } from './reins-detail-facts'
import { normalizeRailwayLine, normalizeStationName } from './public-search'
import { translateRailwayLine, translateStationName, translateZoning } from './translate-fields'

/**
 * Drafts the reviewed.json `facts` block from parsed REINS facts. Descriptions are fixed templates
 * filled only with parsed values (no adjectives, no claims the page does not make); Chinese uses a
 * fixed vocabulary and keeps proper names (buildings, stations, lines) as written. Advertising
 * permission is left to the operator (adAllowed / adConsentRequired stay null).
 */

export interface DraftStation {
  name: string
  /** English name from the site's station table; the Japanese name when it has none. */
  name_en: string
  line: string | null
  walk_minutes: number
}

export interface DraftFacts {
  sourcePropertyId: string | null
  propertyType: string | null
  prefecture: string | null
  city: string | null
  /** 都道府県＋所在地名１＋所在地名２ only; widen after checking the permission. */
  addressPublic: string | null
  addressPrivate: string | null
  price: number | null
  buildingArea: number | null
  builtYear: number | null
  builtMonth: number | null
  floorCount: number | null
  structure: string | null
  landRights: string | null
  currentStatus: string | null
  stations: DraftStation[]
  descriptionJa: string
  descriptionEn: string
  descriptionZhTw: string
  descriptionZhCn: string
  features: string[]
  featuresEn: string[]
  featuresZhTw: string[]
  featuresZhCn: string[]
  landArea: number | null
  yieldGross: null
  yieldNet: null
  zoning: string | null
  hospitalityCategory: null
  sourcePdfUrl: null
  conditionsExpiry: null
  warnings: string[]
  adAllowed: null
  adConsentRequired: null
}

export interface ReviewedDraft {
  facts: DraftFacts
  /** 備考１〜４ as written: never in descriptions; the operator decides. */
  remarks: string[]
  /** Draft fields the page did not give (blank on REINS or unreadable). */
  unread: string[]
  /** Points to check: REINS advertising field, cleaned building name, untranslated names, bus-only stations. */
  notes: string[]
}

type Lang = 'ja' | 'en' | 'zhTw' | 'zhCn'
type Words = Record<Lang, string>

const MAX_DESCRIPTION_STATIONS = 2
const MAX_FEATURES = 8
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const PROPERTY_TYPES: Record<string, string> = { 中古マンション: '区分マンション', 新築マンション: '区分マンション', 中古戸建: '戸建', 新築戸建: '戸建', 売地: '土地' }
const STATUS: Record<string, string> = { 空家: '空室' }
const KINDS: Record<string, Words> = {
  中古マンション: { ja: '中古マンション', en: 'Pre-owned condominium', zhTw: '中古公寓', zhCn: '二手公寓' },
  新築マンション: { ja: '新築マンション', en: 'New condominium', zhTw: '新建公寓', zhCn: '新建公寓' },
  中古戸建: { ja: '中古戸建', en: 'Pre-owned house', zhTw: '中古獨棟住宅', zhCn: '二手独栋住宅' },
  新築戸建: { ja: '新築戸建', en: 'New house', zhTw: '新建獨棟住宅', zhCn: '新建独栋住宅' },
  中古タウン: { ja: '中古タウンハウス', en: 'Pre-owned townhouse', zhTw: '中古連棟住宅', zhCn: '二手联排住宅' },
  売地: { ja: '土地', en: 'Land', zhTw: '土地', zhCn: '土地' },
  借地権: { ja: '借地権付き土地', en: 'Leasehold land', zhTw: '借地權土地', zhCn: '借地权土地' },
}
const DIRECTIONS: Record<string, Words> = {
  北: { ja: '北', en: 'north', zhTw: '北', zhCn: '北' },
  北東: { ja: '北東', en: 'northeast', zhTw: '東北', zhCn: '东北' },
  東: { ja: '東', en: 'east', zhTw: '東', zhCn: '东' },
  南東: { ja: '南東', en: 'southeast', zhTw: '東南', zhCn: '东南' },
  南: { ja: '南', en: 'south', zhTw: '南', zhCn: '南' },
  南西: { ja: '南西', en: 'southwest', zhTw: '西南', zhCn: '西南' },
  西: { ja: '西', en: 'west', zhTw: '西', zhCn: '西' },
  北西: { ja: '北西', en: 'northwest', zhTw: '西北', zhCn: '西北' },
}
/** The 23 wards in English, Traditional and Simplified Chinese; other cities stay as written. */
const WARDS: Record<string, [string, string, string]> = {
  千代田区: ['Chiyoda', '千代田區', '千代田区'], 中央区: ['Chuo', '中央區', '中央区'], 港区: ['Minato', '港區', '港区'],
  新宿区: ['Shinjuku', '新宿區', '新宿区'], 文京区: ['Bunkyo', '文京區', '文京区'], 台東区: ['Taito', '台東區', '台东区'],
  墨田区: ['Sumida', '墨田區', '墨田区'], 江東区: ['Koto', '江東區', '江东区'], 品川区: ['Shinagawa', '品川區', '品川区'],
  目黒区: ['Meguro', '目黑區', '目黑区'], 大田区: ['Ota', '大田區', '大田区'], 世田谷区: ['Setagaya', '世田谷區', '世田谷区'],
  渋谷区: ['Shibuya', '澀谷區', '涩谷区'], 中野区: ['Nakano', '中野區', '中野区'], 杉並区: ['Suginami', '杉並區', '杉并区'],
  豊島区: ['Toshima', '豐島區', '丰岛区'], 北区: ['Kita', '北區', '北区'], 荒川区: ['Arakawa', '荒川區', '荒川区'],
  板橋区: ['Itabashi', '板橋區', '板桥区'], 練馬区: ['Nerima', '練馬區', '练马区'], 足立区: ['Adachi', '足立區', '足立区'],
  葛飾区: ['Katsushika', '葛飾區', '葛饰区'], 江戸川区: ['Edogawa', '江戶川區', '江户川区'],
}
/** REINS 用途地域 abbreviations → the names translate-fields.ts knows. */
const ZONING: Record<string, string> = {
  一低: '第1種低層住居専用地域', 二低: '第2種低層住居専用地域', 一中: '第1種中高層住居専用地域', 二中: '第2種中高層住居専用地域',
  一住: '第1種住居地域', 二住: '第2種住居地域', 準住: '準住居地域', 田住: '田園住居地域', 近商: '近隣商業地域', 商業: '商業地域',
  準工: '準工業地域', 工業: '工業地域', 工専: '工業専用地域',
}
const STRUCTURES: Record<string, Words> = {
  SRC: { ja: 'SRC造', en: 'SRC', zhTw: 'SRC結構', zhCn: 'SRC结构' },
  RC: { ja: 'RC造', en: 'RC', zhTw: 'RC結構', zhCn: 'RC结构' },
  S: { ja: 'S造', en: 'steel-frame', zhTw: '鋼骨結構', zhCn: '钢骨结构' },
  木造: { ja: '木造', en: 'wooden', zhTw: '木造', zhCn: '木造' },
  軽量鉄骨: { ja: '軽量鉄骨造', en: 'light steel-frame', zhTw: '輕鋼結構', zhCn: '轻钢结构' },
}
/** REINS equipment items worth a feature chip, in display order. */
const EQUIPMENT: [string, Words][] = [
  ['ペット可', { ja: 'ペット可', en: 'Pets allowed', zhTw: '可養寵物', zhCn: '可养宠物' }],
  ['ペット相談', { ja: 'ペット相談', en: 'Pets negotiable', zhTw: '寵物可商量', zhCn: '宠物可商量' }],
  ['最上階', { ja: '最上階', en: 'Top floor', zhTw: '頂樓', zhCn: '顶楼' }],
  ['オートロック', { ja: 'オートロック', en: 'Auto-lock entrance', zhTw: '自動門禁', zhCn: '自动门禁' }],
  ['モニター付きオートロック', { ja: 'オートロック', en: 'Auto-lock entrance', zhTw: '自動門禁', zhCn: '自动门禁' }],
  ['宅配ボックス', { ja: '宅配ボックス', en: 'Delivery box', zhTw: '宅配箱', zhCn: '快递柜' }],
  ['エレベータ', { ja: 'エレベーター', en: 'Elevator', zhTw: '電梯', zhCn: '电梯' }],
  ['床暖房', { ja: '床暖房', en: 'Floor heating', zhTw: '地暖', zhCn: '地暖' }],
  ['食器洗浄乾燥機', { ja: '食器洗浄乾燥機', en: 'Dishwasher', zhTw: '洗碗機', zhCn: '洗碗机' }],
  ['浴室乾燥機', { ja: '浴室乾燥機', en: 'Bathroom dryer', zhTw: '浴室乾燥機', zhCn: '浴室干燥机' }],
  ['追焚機能', { ja: '追焚機能', en: 'Bath reheating', zhTw: '浴缸追加加熱', zhCn: '浴缸追加加热' }],
  ['ウォークインクローゼット', { ja: 'ウォークインクローゼット', en: 'Walk-in closet', zhTw: '步入式衣櫃', zhCn: '步入式衣柜' }],
  ['バス・トイレ別', { ja: 'バス・トイレ別', en: 'Separate bath and toilet', zhTw: '衛浴分離', zhCn: '卫浴分离' }],
  ['ルーフバルコニー', { ja: 'ルーフバルコニー', en: 'Roof balcony', zhTw: '屋頂陽台', zhCn: '屋顶阳台' }],
  ['専用庭', { ja: '専用庭', en: 'Private garden', zhTw: '專用庭院', zhCn: '专用庭院' }],
  ['ディスポーザー', { ja: 'ディスポーザー', en: 'Garbage disposer', zhTw: '廚餘處理機', zhCn: '厨余处理机' }],
  ['事務所使用可', { ja: '事務所使用可', en: 'Office use allowed', zhTw: '可作辦公室使用', zhCn: '可作办公室使用' }],
]
/** Space-separated words that are broker notes, not part of a building name (「9階」「手有」「他掲載不可」). */
const NAME_NOTE = /^(?:B?\d+(?:階|F)|\d+階.*)$|可|手有|手あり|てあり|利回|実質|指値|仕様|付$|掲載|平坦|即|専用使用権|ペット|飼育|リフォーム|リノベ|オーナーチェンジ|空室|賃貸中|居住中|価格|万円|角部屋|最上階/u

/** A building name without broker notes appended after a space. */
export function cleanBuildingName(name: string | null): string | null {
  if (!name) return null
  const words = name.split(/\s+/u)
  const cut = words.findIndex((word, index) => index > 0
    && (NAME_NOTE.test(word) || words.slice(index, index + 3).filter((item) => [...item].length === 1).length === 3))
  const cleaned = (cut > 0 ? words.slice(0, cut) : words).join(' ')
  const balanced = (cleaned.match(/\(/gu)?.length ?? 0) === (cleaned.match(/\)/gu)?.length ?? 0)
  return balanced ? cleaned : cleaned.replace(/\([^)]*$/u, '').trim() || null
}

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
const area = (value: number) => value.toFixed(2)
/** Joins the given parts; falsy parts (a missing fact, a 0 from `value && …`) are left out. */
const sentence = (parts: (string | number | null | false | undefined)[], joiner: string, end: string) => {
  const kept = parts.filter((part): part is string => typeof part === 'string' && part.length > 0)
  return kept.length ? `${kept.join(joiner)}${end}` : ''
}

function draftStations(stations: readonly ReinsStation[]): DraftStation[] {
  return stations.flatMap((station) => {
    const name = normalizeStationName(station.station)
    if (!name || station.walkMinutes === null) return []
    // The site's line names (「伊勢崎線」→「東武伊勢崎線」), but not its 「…行線」→「…線」 typo fix: 「常磐緩行線」 is a real name.
    const canonical = station.line ? normalizeRailwayLine(station.line) : ''
    const line = station.line ? (canonical && !station.line.endsWith('行線') ? canonical : station.line) : null
    return [{ name, name_en: translateStationName(name, 'en') ?? name, line, walk_minutes: station.walkMinutes }]
  })
}

function accessPhrases(stations: readonly DraftStation[]): Words {
  const shown = stations.slice(0, MAX_DESCRIPTION_STATIONS)
  const lineFor = (station: DraftStation, index: number) => (index > 0 && station.line === shown[0].line ? '' : station.line ?? '')
  const lineEn = (station: DraftStation) => (station.line ? ` (${translateRailwayLine(station.line, 'en') ?? station.line})` : '')
  return {
    ja: sentence(shown.map((s, i) => `${lineFor(s, i)}「${s.name}」駅徒歩${s.walk_minutes}分`), '、', '。'),
    en: sentence(shown.map((s) => `${s.walk_minutes} min walk to ${s.name_en} Station${lineEn(s)}`), '; ', '.'),
    zhTw: sentence(shown.map((s, i) => `${lineFor(s, i)}「${s.name}」站步行${s.walk_minutes}分鐘`), '，', '。'),
    zhCn: sentence(shown.map((s, i) => `${lineFor(s, i)}「${s.name}」站步行${s.walk_minutes}分钟`), '，', '。'),
  }
}

function placeWords(city: string | null): Words | null {
  if (!city) return null
  const ward = WARDS[city]
  return { ja: city, en: ward?.[0] ?? city, zhTw: ward?.[1] ?? city, zhCn: ward?.[2] ?? city }
}

/** Opening sentence: the building name for condominiums (the site reads it back), else 「江東区の中古戸建」. */
function opener(name: string | null, facts: ReinsDetailFacts): Words {
  if (name) return { ja: `${name}。`, en: `${name}: `, zhTw: `${name}。`, zhCn: `${name}。` }
  const kind = KINDS[facts.propertyKind ?? ''] ?? (facts.propertyKind ? { ja: facts.propertyKind, en: facts.propertyKind, zhTw: facts.propertyKind, zhCn: facts.propertyKind } : null)
  const place = placeWords(facts.address1)
  if (!kind) return { ja: '', en: '', zhTw: '', zhCn: '' }
  return {
    ja: `${place ? `${place.ja}の` : ''}${kind.ja}。`,
    en: `${kind.en}${place ? ` in ${place.en}` : ''}: `,
    zhTw: `${place ? `位於${place.zhTw}的` : ''}${kind.zhTw}。`,
    zhCn: `${place ? `位于${place.zhCn}的` : ''}${kind.zhCn}。`,
  }
}

function unitSentence(facts: ReinsDetailFacts): Words {
  const isLand = facts.form === '土地'
  const condo = facts.form === 'マンション'
  const exclusive = condo ? facts.exclusiveArea : null
  const land = condo ? null : facts.landArea
  const building = condo || isLand ? null : facts.buildingArea
  const floor = condo ? facts.floor : null
  const dir = condo && facts.balconyDirection ? DIRECTIONS[facts.balconyDirection] ?? null : null
  const layout = isLand ? null : facts.layout
  const enUnit = layout ? `${layout}${floor && floor > 0 ? ` on the ${ordinal(floor)} floor` : ''}` : floor && floor > 0 ? `${ordinal(floor)} floor` : null
  const jaWhere = sentence([floor && floor > 0 ? `${floor}階` : null, dir && `${dir.ja}向き`], '・', '')
  return {
    ja: sentence([exclusive && `専有面積${area(exclusive)}㎡`, land && `土地面積${area(land)}㎡`, building && `建物面積${area(building)}㎡`,
      layout ? (jaWhere ? `${jaWhere}の${layout}` : layout) : jaWhere], '、', '。'),
    en: sentence([exclusive && `${area(exclusive)} m²`, land && `land ${area(land)} m²`, building && `building ${area(building)} m²`,
      enUnit, dir && `facing ${dir.en}`], ', ', '.'),
    zhTw: sentence([exclusive && `專有面積${area(exclusive)}㎡`, land && `土地面積${area(land)}㎡`, building && `建物面積${area(building)}㎡`,
      floor && floor > 0 && `位於${floor}樓`, dir && `朝${dir.zhTw}`, layout && `格局${layout}`], '，', '。'),
    zhCn: sentence([exclusive && `专有面积${area(exclusive)}㎡`, land && `土地面积${area(land)}㎡`, building && `建筑面积${area(building)}㎡`,
      floor && floor > 0 && `位于${floor}楼`, dir && `朝${dir.zhCn}`, layout && `格局${layout}`], '，', '。'),
  }
}

function buildingSentence(facts: ReinsDetailFacts): Words {
  const { builtYear: year, builtMonth: month } = facts
  const units = facts.form === 'マンション' ? facts.totalUnits : null
  const house = facts.form === '一戸建'
  const structure = house && facts.structure ? STRUCTURES[facts.structure] ?? null : null
  const storeys = house ? facts.floorsAboveGround : null
  const zoning = facts.form === '土地' && facts.zoning ? ZONING[facts.zoning] ?? null : null
  return {
    ja: sentence([year && `${year}年${month ? `${month}月` : ''}築`, units && `総戸数${units}戸`,
      house && (structure || storeys) && `${structure?.ja ?? ''}${storeys ? `${storeys}階建` : ''}`, zoning && `用途地域は${zoning}`], '、', '。'),
    en: sentence([year && `Built ${month ? `${MONTHS[month - 1]} ` : ''}${year}`, units && `${units} units`,
      house && (structure || storeys) && [structure?.en, storeys && `${storeys} floors`].filter(Boolean).join(', '),
      zoning && `zoning: ${translateZoning(zoning, 'en')}`], '; ', '.'),
    zhTw: sentence([year && `建於${year}年${month ? `${month}月` : ''}`, units && `總戶數${units}戶`,
      house && (structure || storeys) && `${structure?.zhTw ?? ''}${storeys ? `${storeys}層樓` : ''}`, zoning && `用途地域為${translateZoning(zoning, 'zh-TW')}`], '，', '。'),
    zhCn: sentence([year && `建于${year}年${month ? `${month}月` : ''}`, units && `总户数${units}户`,
      house && (structure || storeys) && `${structure?.zhCn ?? ''}${storeys ? `${storeys}层楼` : ''}`, zoning && `用途地域为${translateZoning(zoning, 'zh-CN')}`], '，', '。'),
  }
}

function featureWords(facts: ReinsDetailFacts): Words[] {
  const dir = facts.form === 'マンション' && facts.balconyDirection ? DIRECTIONS[facts.balconyDirection] : null
  const units = facts.form === 'マンション' ? facts.totalUnits : null
  const capitalised = dir ? `${dir.en[0].toUpperCase()}${dir.en.slice(1)}` : ''
  const fromFacts: Words[] = [
    ...(dir ? [{ ja: `${dir.ja}向き`, en: `${capitalised}-facing`, zhTw: `朝${dir.zhTw}`, zhCn: `朝${dir.zhCn}` }] : []),
    ...(units ? [{ ja: `総戸数${units}戸`, en: `${units} units in total`, zhTw: `總戶數${units}戶`, zhCn: `总户数${units}户` }] : []),
    ...(facts.cornerUnit ? [{ ja: '角部屋', en: 'Corner unit', zhTw: '邊間', zhCn: '边户' }] : []),
  ]
  const fromEquipment = EQUIPMENT.filter(([item]) => facts.equipment.includes(item)).map(([, words]) => words)
  const unique = [...fromFacts, ...fromEquipment].filter((words, index, all) => all.findIndex((other) => other.ja === words.ja) === index)
  return unique.slice(0, MAX_FEATURES)
}

function draftNotes(facts: ReinsDetailFacts, name: string | null, stations: readonly DraftStation[]): string[] {
  const busOnly = facts.stations.filter((station) => station.walkMinutes === null && station.station)
  const untranslated = stations.filter((station) => station.name_en === station.name).map((station) => station.name)
  return [
    `広告転載区分：${facts.adField ?? '（空欄）'} / 取引状況：${facts.dealStatus || '（空欄）'}${facts.dealStatusNote ? `（${facts.dealStatusNote}）` : ''}`,
    ...(facts.buildingName && name !== facts.buildingName ? [`建物名の注記を除いた：「${facts.buildingName}」→「${name ?? ''}」`] : []),
    ...(untranslated.length ? [`駅名の英語表記なし（日本語のまま）：${untranslated.join('、')}`] : []),
    ...busOnly.map((station) => `徒歩表記なしの駅（説明・stationsから除外）：${station.line ?? ''}「${station.station}」${station.busMinutes ? `バス${station.busMinutes}分` : ''}`),
    ...(facts.propertyKindNote ? [`物件種目の補足：${facts.propertyKindNote}`] : []),
    ...facts.unreadable.map((item) => `読めなかった値：${item}`),
  ]
}

const EXPECTED: Record<string, (keyof DraftFacts)[]> = {
  マンション: ['sourcePropertyId', 'propertyType', 'city', 'price', 'buildingArea', 'builtYear', 'builtMonth', 'floorCount', 'structure', 'landRights', 'currentStatus', 'stations'],
  一戸建: ['sourcePropertyId', 'propertyType', 'city', 'price', 'buildingArea', 'landArea', 'builtYear', 'builtMonth', 'floorCount', 'structure', 'landRights', 'currentStatus', 'stations'],
  土地: ['sourcePropertyId', 'propertyType', 'city', 'price', 'landArea', 'landRights', 'currentStatus', 'stations', 'zoning'],
}

/** The reviewed.json draft for one parsed REINS page. */
export function draftFromFacts(facts: ReinsDetailFacts): ReviewedDraft {
  const condo = facts.form === 'マンション'
  const name = condo ? cleanBuildingName(facts.buildingName) : null
  const stations = draftStations(facts.stations)
  const parts = [opener(name, facts), unitSentence(facts), accessPhrases(stations), buildingSentence(facts)]
  const capitalise = (text: string) => (text ? `${text[0].toUpperCase()}${text.slice(1)}` : text)
  const describe = (lang: Lang) => parts.map((words) => (lang === 'en' ? capitalise(words.en) : words[lang])).join(lang === 'en' ? ' ' : '')
    .replace(/ {2,}/gu, ' ').trim()
  const features = featureWords(facts)
  const address = [facts.prefecture, facts.address1, facts.address2]
  const draft: DraftFacts = {
    sourcePropertyId: facts.sourcePropertyId,
    propertyType: facts.propertyKind ? PROPERTY_TYPES[facts.propertyKind] ?? facts.propertyKind : null,
    prefecture: facts.prefecture,
    city: facts.address1,
    addressPublic: address.every(Boolean) ? address.join('') : null,
    addressPrivate: address.every(Boolean) ? [...address, facts.address3].join('') : null,
    price: facts.price,
    buildingArea: condo ? facts.exclusiveArea : facts.buildingArea,
    builtYear: facts.builtYear,
    builtMonth: facts.builtMonth,
    floorCount: facts.floorsAboveGround,
    structure: facts.structure,
    landRights: facts.landRights,
    currentStatus: facts.currentStatus ? STATUS[facts.currentStatus] ?? facts.currentStatus : null,
    stations,
    descriptionJa: describe('ja'),
    descriptionEn: describe('en'),
    descriptionZhTw: describe('zhTw'),
    descriptionZhCn: describe('zhCn'),
    features: features.map((words) => words.ja),
    featuresEn: features.map((words) => words.en),
    featuresZhTw: features.map((words) => words.zhTw),
    featuresZhCn: features.map((words) => words.zhCn),
    landArea: condo ? null : facts.landArea,
    yieldGross: null,
    yieldNet: null,
    zoning: facts.zoning ? ZONING[facts.zoning] ?? facts.zoning : null,
    hospitalityCategory: null,
    sourcePdfUrl: null,
    conditionsExpiry: null,
    warnings: [],
    adAllowed: null,
    adConsentRequired: null,
  }
  const expected = EXPECTED[facts.form ?? ''] ?? EXPECTED.マンション
  const unread = expected.filter((key) => {
    const value = draft[key]
    return value === null || (Array.isArray(value) && !value.length)
  })
  return { facts: draft, remarks: facts.remarks, unread, notes: draftNotes(facts, name, stations) }
}
