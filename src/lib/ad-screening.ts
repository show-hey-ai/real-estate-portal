/**
 * Free first-pass screening of the advertising conditions printed on maisoku pages, read from
 * OCR text. It only decides what to look at first and what to skip: it never grants permission,
 * and the publication checks in ad-publication-policy.ts still apply to every listing.
 * A page is skipped as denied only for a clear general prohibition with no own-site exception.
 */

export type ScreeningVerdict = 'permitted' | 'no_mention' | 'unclear' | 'consent' | 'denied'

export interface ScreeningResult {
  verdict: ScreeningVerdict
  /** Short normalised excerpts that decided the verdict, for a quick human check. */
  evidence: string[]
}

/** One recognised text line with Apple Vision geometry (0–1, origin at the bottom left). */
export interface OcrLine {
  text: string
  x: number
  y: number
  width: number
  height: number
}

const MAX_EVIDENCE = 4
const EXCERPT_BEFORE = 8
const EXCERPT_AFTER = 12
const ROW_OVERLAP = 0.5
const ROW_GAP = 0.06

// Restrictions on these channels alone do not cover our own site. 「他社」 is not listed: a ban on
// other companies' sites includes ours.
const MEDIA = '(?:SNS|SUUMO|スーモ|アットホーム|athome|HOME\'?S|ホームズ|楽待|健美家|ヤフー|Yahoo|ポータル|レインズ|REINS|捨て看板|看板|チラシ|紙媒体|新聞|折込|折り込み|雑誌|ポスティング|ビラ|DM|メルマガ|FAX|郵送)'
const NOT_FOR_MEDIA = `(?<!${MEDIA}[^。/／]{0,8})`
// A ban on showing one detail (address, unit, photos) still lets the listing appear without it.
const NOT_FOR_DETAIL = '(?<!(?:所在地|住所|番地|号室|部屋番号|建物名|物件名|写真|画像|図面|間取り?|地図)[^。/／、]{0,3})'
const AD_CONTEXT = /広告|掲載|転載/u
// Approvals for other things (pets, land owner, management association…) are not about advertising.
const OTHER_SUBJECT = /(?:ペット|楽器|事務所|民泊|SOHO|リフォーム|駐車|駐輪|バイク|内見|案内|鍵|譲渡|地主|借地|増改築|管理組合|越境)[^。]{0,8}(?:要承諾|承諾(?:書)?(?:が)?(?:要|必要))/gu
const CHECKBOX_OPTIONS = '[:：]?(?:[□口](?:可|不可|要承諾|一部不可))*'

const DENIAL = [
  new RegExp(`${NOT_FOR_MEDIA}${NOT_FOR_DETAIL}(?<!無断)広告(?:掲載|転載)?(?:区分)?[:：]?(?:は)?(?:不可|厳禁|禁止|NG)`, 'iu'),
  new RegExp(`${NOT_FOR_MEDIA}${NOT_FOR_DETAIL}(?<!無断[^。]{0,4})(?:掲載|転載)(?:は)?(?:不可|厳禁|禁止)`, 'iu'),
  new RegExp(`${NOT_FOR_MEDIA}広告(?!料|費)(?:掲載|転載)?(?:は)?(?:ご遠慮|お断り)`, 'u'),
  new RegExp(`(?:広告|転載|掲載)${CHECKBOX_OPTIONS}[■☑✓✔●◉](?:不可|NG)`, 'u'),
]
const CONSENT_ANYWHERE = [
  /要承諾|承諾書(?:要|必要|が必要)|承諾(?:が)?必要/u,
  /広告(?:承諾|承認)(?![:：]?(?:可|済|不要))/u,
  /(?:広告|掲載)(?:掲載)?(?:申請|依頼)/u,
  // 「無断広告掲載厳禁」 asks for approval; a copyright footer 「無断転載禁止」 does not.
  /無断(?:で|での)?広告/u,
]
const CONSENT_IN_AD_ROW = [
  /要連絡|連絡要|要確認|要申請|事前(?:に)?(?:承諾|承認|連絡|ご連絡|確認|申請)/u,
  /広告(?!料|費)(?:掲載|転載)?[/／:：]?[^。]{0,6}(?:まで|お問|問合|問い合|ご連絡)/u,
  /広告(?!料|費)(?:掲載|転載)?[:：]?(?:要|応)?相談/u,
  /[■☑✓✔●◉]要承諾/u,
]
// Partly allowed, or a list of options without a readable mark: read the page itself.
const UNCLEAR_IN_AD_ROW = [
  /一部(?:不可|可)/u,
  /(?<![不■☑✓✔●◉])可[・/／、]*(?:要承諾[・/／、]*)?(?:口|□)?不可/u,
]
const PERMISSION = [
  /(?:自社|御社|貴社|1社|一社)(?:の)?(?:HP|ホームページ|サイト|媒体)(?:への?|のみ|だけ|は|で|広告|掲載|転載|[:：(（)）]|リンク無)*(?:可(?:能)?|OK)/iu,
  /(?:御社|貴社|自社)(?:HP|ホームページ)のみ/iu,
  /(?:自社|御社|貴社)(?:HP|ホームページ|サイト)(?:は|を)?(?:除く|除き|以外)/iu,
  /広告(?!料|費)(?:掲載|転載)?(?:全媒介)?[:：]?(?:は)?(?:可(?:能)?|OK)(?!否)/iu,
  /広告(?:承諾|承認)[:：]?(?:可|済|不要)/u,
  /広告転載(?:区分)?[:：]?(?:転載)?可/u,
  /ネット(?:媒体|広告)可/u,
  new RegExp(`(?:広告|転載|掲載)${CHECKBOX_OPTIONS}[■☑✓✔●◉]可`, 'u'),
  new RegExp(`${MEDIA}(?:[,、・/／]?(?:${MEDIA}|[A-Za-z]+))*以外(?:は|の媒体は)?(?:掲載)?可`, 'iu'),
]

/** NFKC plus the OCR confusions seen on real maisoku (揭→掲, 場載→掲載, 印社→御社). */
export function normalizeOcrText(text: string): string {
  return text.normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/揭/g, '掲')
    .replace(/(広告)場載/g, '$1掲載')
    .replace(/印社(?=HP|ホームページ)/g, '御社')
    .replace(/[•·]/g, '・')
}

/**
 * Reads each OCR line together with its neighbours on the same height (left to right, stopping
 * at a wide gap), so a table label such as 「広告」 and its value cell 「不可」 read as one row.
 * Neighbours are taken per line, not chained, so separate bands of a dense page never merge.
 */
export function ocrRows(lines: readonly OcrLine[]): string[] {
  const usable = lines.filter((line) => line.text.trim())
  const rows = usable.map((line) => {
    const band = usable.filter((other) => verticalOverlap(other, line) >= ROW_OVERLAP).toSorted((a, b) => a.x - b.x)
    const at = band.indexOf(line)
    let start = at
    let end = at
    while (start > 0 && gapBetween(band[start - 1], band[start]) <= ROW_GAP) start--
    while (end < band.length - 1 && gapBetween(band[end], band[end + 1]) <= ROW_GAP) end++
    return band.slice(start, end + 1).map((item) => item.text).join(' ')
  })
  return [...new Set(rows)]
}

function verticalOverlap(a: OcrLine, b: OcrLine): number {
  const overlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y)
  return overlap / Math.max(Math.min(a.height, b.height), Number.EPSILON)
}

function gapBetween(left: OcrLine, right: OcrLine): number {
  return right.x - (left.x + left.width)
}

/** Excerpts around each match, so evidence stays short even when a row is long. */
function matches(rows: readonly string[], patterns: readonly RegExp[], onlyAdRows: boolean, strip?: RegExp): string[] {
  return rows.flatMap((original) => {
    const row = strip ? original.replace(strip, '') : original
    if (onlyAdRows && !AD_CONTEXT.test(row)) return []
    return patterns.flatMap((pattern) => {
      const found = pattern.exec(row)
      if (!found) return []
      return [row.slice(Math.max(0, found.index - EXCERPT_BEFORE), found.index + found[0].length + EXCERPT_AFTER)]
    })
  })
}

/** Screens one page. Rows can come from ocrRows() or from plain text split into lines. */
export function screenAdvertising(rows: readonly string[]): ScreeningResult {
  const normalized = rows.map(normalizeOcrText).filter(Boolean)
  const consent = [...matches(normalized, CONSENT_ANYWHERE, false, OTHER_SUBJECT), ...matches(normalized, CONSENT_IN_AD_ROW, true)]
  const denial = matches(normalized, DENIAL, true)
  const permission = matches(normalized, PERMISSION, true)
  const unclear = matches(normalized, UNCLEAR_IN_AD_ROW, true)
  const evidence = (items: string[]) => [...new Set(items)].slice(0, MAX_EVIDENCE)
  if (consent.length) return { verdict: 'consent', evidence: evidence(consent) }
  if (unclear.length || (denial.length && permission.length)) return { verdict: 'unclear', evidence: evidence([...unclear, ...denial, ...permission]) }
  if (denial.length) return { verdict: 'denied', evidence: evidence(denial) }
  if (permission.length) return { verdict: 'permitted', evidence: evidence(permission) }
  return { verdict: 'no_mention', evidence: [] }
}
