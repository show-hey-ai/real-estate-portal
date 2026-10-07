import { hasExplicitPortalPermission } from './ad-publication-policy'
import { sourcePrices } from './autonomy/publication'

/**
 * Reads a saved REINS property detail page (the accessibility text Codex saves from the browser)
 * into the few facts the daily light check and the photo-first ranking need. Formats seen:
 * Playwright ARIA snapshots ("- generic: 価格") and macOS accessibility dumps ("93 text 価格"),
 * including dumps written as a diff of the previous tree ("+	356 text 物件番号").
 */

export interface ReinsDetail {
  sourcePropertyId: string | null
  price: number | null
  /** 広告転載区分, e.g. 「広告可」「一部可（インターネット）」「不可」. */
  adField: string | null
  /** 取引状況; empty when REINS shows no status. */
  dealStatus: string | null
  /** 変更年月日 (or 更新年月日) as written, normalised. */
  changedOn: string | null
  imageNames: string[]
}

export interface ImageCounts {
  interior: number
  unlabeled: number
  other: number
}

/** One heading, text or link of a saved page, NFKC-normalised (full-width digits and letters become ASCII). */
export interface PageNode {
  kind: 'heading' | 'text' | 'link'
  value: string
  /** Heading level: 1 is the page title, 2 a section, 3 a sub-section (「交通１」). */
  level?: number
}

const KNOWN_LABELS = new Set([
  '物件番号', '登録年月日', '変更年月日', '更新年月日', '物件種目', '広告転載区分', '取引態様', '取引状況', '取引状況の補足',
  '価格', 'うち価格消費税', '変更前価格', '専有面積', '都道府県名', '所在地名１', '所在地名1', '所在地名２', '所在地名2',
  '所在地名３', '所在地名3', '建物名', '部屋番号', '築年月', '建物構造', '地上階層', '所在階', '現況', '土地権利', '管理費',
  '修繕積立金', '引渡時期', 'ファイル名', '説明', '担当', '取引', '媒介契約年月日', '分類', '基本情報',
].map((label) => label.normalize('NFKC')))
const IMAGE_FILE = /\.(?:jpe?g|png|gif|webp|heic|bmp)$/i
const INTERIOR = /リビング|LDK|DK|キッチン|台所|洋室|和室|寝室|居室|室内|部屋|浴室|バス|風呂|洗面|トイレ|WC|玄関|収納|クローゼット|WIC|納戸|廊下|ダイニング|書斎|ロフト|内装|床暖|食洗|洗濯/iu
const NOT_INTERIOR = /外観|間取|地図|周辺|眺望|共用|エントランス|ロビー|道路|現地|物件近|遠目|駐車|駐輪|バルコニー|テラス|看板|マイソク|図面|案内|概要/u
// Broker banners are uploaded as images named one spaced character at a time (「仕 入 れ 強 化 …」).
const BANNER = /^(?:\S\s){3,}/u
const BLOCKING_STATUS = /申込|停止|商談|成約|契約済|売止|取下|非公開|削除|終了/u
/** Statuses that mean the property is openly on offer; REINS often leaves the field blank. */
const OPEN_STATUS = /^(?:公開中)?$/u

function clean(value: string): string {
  return value.normalize('NFKC').trim().replace(/^"(.*)"$/u, '$1').trim()
}

const ARIA_LINE = /^\s*-\s+(heading|generic|text|paragraph|cell|link)(?:\s+"([^"]*)")?([^:]*?)(?::\s*(.*))?$/u
// Dumps can be diffs of the previous tree, marking lines with 「+」 or 「~」.
const DUMP_LINE = /^[+~]?\s*\d+\s+(heading|text|link)\s+(.*)$/u

function lineNode(line: string): { node: PageNode; dump: boolean } | null {
  const aria = line.match(ARIA_LINE)
  if (aria) {
    const kind = aria[1] === 'heading' ? 'heading' : aria[1] === 'link' ? 'link' : 'text'
    // A link's text is its quoted name (「- link "（株）…":」); other nodes put it after the colon.
    const raw = kind === 'link' ? aria[4] || aria[2] || '' : aria[4] ?? aria[2] ?? ''
    const level = kind === 'heading' ? Number(aria[3].match(/\[level=(\d)\]/u)?.[1]) : NaN
    return { node: { kind, value: clean(raw), ...(level ? { level } : {}) }, dump: false }
  }
  const dump = line.match(DUMP_LINE)
  if (!dump) return null
  const kind = dump[1] as PageNode['kind']
  // A link's 「, Value: …」 is its URL; a heading's is its level.
  const raw = dump[2].replace(kind === 'link' ? /,\s*Value:\s*.*$/u : /,\s*Value:\s*\d+$/u, '')
  const level = kind === 'heading' ? Number(dump[2].match(/,\s*Value:\s*(\d+)$/u)?.[1]) : NaN
  return { node: { kind, value: clean(raw), ...(level ? { level } : {}) }, dump: true }
}

/** Headings, texts and links of a saved REINS page in page order (ARIA snapshots, macOS dumps and their diffs). */
export function pageNodes(text: string): PageNode[] {
  const result: PageNode[] = []
  let previous: PageNode | null = null
  for (const line of text.split('\n')) {
    const parsed = lineNode(line)
    if (!parsed) continue
    const { node, dump } = parsed
    if (node.kind === 'link') {
      if (node.value) result.push(node)
      continue
    }
    // In accessibility dumps a heading is followed by its own text; keep only the heading. ARIA
    // snapshots do not repeat it, so a same-named label there (「現況」 under 「現況」) is kept.
    const headingText = dump && node.kind === 'text' && previous?.kind === 'heading' && previous.value === node.value
    previous = node
    if (node.value && !headingText) result.push(node)
  }
  return result
}

/** The value after a label, '' when the label has no value, null when the label is absent. */
function fieldValue(nodes: readonly PageNode[], label: string): string | null {
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]
    if (node.kind !== 'text') continue
    if (node.value === label) {
      const next = nodes[index + 1]
      return next && next.kind === 'text' && !KNOWN_LABELS.has(next.value) ? next.value : ''
    }
    if (node.value.startsWith(`${label} `)) return node.value.slice(label.length + 1).trim()
  }
  return null
}

export function parseReinsDetail(text: string): ReinsDetail {
  // Links (the broker's name, e-mail addresses) are not needed for these facts.
  const nodes = pageNodes(text).filter((node) => node.kind !== 'link')
  const id = fieldValue(nodes, '物件番号')?.replace(/\s/g, '') ?? ''
  const prices = sourcePrices(fieldValue(nodes, '価格') ?? '')
  const imageNames = nodes.flatMap((node, index) => {
    if (node.kind !== 'text') return []
    const name = node.value === 'ファイル名' ? nodes[index + 1]?.value ?? '' : node.value.startsWith('ファイル名 ') ? node.value.slice(6).trim() : ''
    return IMAGE_FILE.test(name) ? [name] : []
  })
  const changedOn = fieldValue(nodes, '変更年月日') ?? fieldValue(nodes, '更新年月日')
  return {
    sourcePropertyId: /^\d{12}$/.test(id) ? id : null,
    price: prices.length === 1 ? prices[0] : null,
    adField: fieldValue(nodes, '広告転載区分') || null,
    dealStatus: fieldValue(nodes, '取引状況'),
    changedOn: changedOn ? changedOn.replace(/\s/g, '') : null,
    imageNames,
  }
}

/** Counts registered photos by file name: rooms, unnamed camera files, and everything else. */
export function classifyImages(names: readonly string[]): ImageCounts {
  const counts: ImageCounts = { interior: 0, unlabeled: 0, other: 0 }
  for (const name of names) {
    const base = name.normalize('NFKC').replace(IMAGE_FILE, '')
    if (BANNER.test(base)) continue
    if (NOT_INTERIOR.test(base)) counts.other++
    else if (INTERIOR.test(base)) counts.interior++
    else if (/[ぁ-んァ-ヶ一-龯]/u.test(base)) counts.other++
    else counts.unlabeled++
  }
  return counts
}

/** Whether REINS's own advertising field allows our site (user decision 2026-10-06: 「転載可」 counts). */
export function adFieldPermits(adField: string | null): boolean {
  return Boolean(adField) && hasExplicitPortalPermission(`広告転載区分：${adField}`)
}

/** Blank or 「公開中」: openly on offer. Anything else needs a look (or blocks, below). */
export function dealStatusOpen(status: string | null): boolean {
  return status !== null && OPEN_STATUS.test(status.replace(/\s/g, ''))
}

/** A purchase application, a pause or a contract means the property must not be shown as available. */
export function dealStatusBlocks(status: string | null): boolean {
  return Boolean(status) && BLOCKING_STATUS.test(status!)
}

/** 「令和 8年10月 5日」 or 「2026/10/05」 → '2026-10-05'. */
export function reinsDate(value: string | null): string | null {
  const text = (value ?? '').normalize('NFKC').replace(/\s/g, '')
  const era = text.match(/^(令和|平成)(元|\d{1,2})年(\d{1,2})月(\d{1,2})日$/u)
  const western = text.match(/^(\d{4})[年/.-](\d{1,2})[月/.-](\d{1,2})日?$/u)
  const parts = era
    ? [(era[1] === '令和' ? 2018 : 1988) + (era[2] === '元' ? 1 : Number(era[2])), Number(era[3]), Number(era[4])]
    : western ? [Number(western[1]), Number(western[2]), Number(western[3])] : null
  if (!parts) return null
  const [year, month, day] = parts
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
