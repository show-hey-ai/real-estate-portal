import { buildingNameOf, extractBuildingNameEn } from './building-name'
import { coverTier, pickCoverImage } from './cover-image'
import { resolveStation } from './transit'
import { formatTransitAccessLabel, romanizeStationNames } from './translate-fields'

/**
 * Weekly check of what visitors see on published listings (2026-10-25). Required issues are
 * fixed by the operator (Codex) from HANDOFF.md; optional ones depend on what the source
 * material holds and never need the owner's decision.
 */
export type IssueType = 'en-japanese' | 'zh-kana-name' | 'station-untranslated' | 'station-not-listed' | 'weak-cover' | 'few-photos'

export interface QualityIssue { type: IssueType; optional: boolean; detail: string }

export interface QualityListing {
  sourcePropertyId: string | null
  descriptionJa: string | null
  descriptionEn: string | null
  addressPublic?: string | null
  stations: unknown
  media: { url: string; category: string | null; sortOrder: number | null }[]
}

export const ISSUE_FIX: Record<IssueType, string> = {
  'en-japanese': 'descriptionEn に日本語が残っている。建物名・駅名などを英語にし、冒頭は「English Name: 」で始める',
  'zh-kana-name': '建物名がカタカナで英語名がない（中国語ページでカタカナ表示）。descriptionEn を「English Name: 」で始める',
  'station-untranslated': '駅名・路線名の英語がない。Claude が辞書に追加する（Codex 対応不要）',
  'station-not-listed': '駅名が23区の駅一覧にない（路線・駅検索に出ない）。表記の誤りなら駅名を直す。23区外の駅なら対応不要',
  'weak-cover': '建物全体の外観写真がない。原資料に外観写真があれば追加（なければ表紙は自動で室内か間取り図になるので対応不要）',
  'few-photos': '写真が1枚以下。原資料に写真があれば追加（なければ間取り図・室内のままで対応不要）',
}

const JAPANESE = /[぀-ヿ一-鿿]/u
const KANA = /[぀-ゟ゠-ヿ]/u
const WEAK_COVER_TIER = 4
const MIN_PHOTOS = 2

const snippet = (text: string) => (text.match(/[^.;:]*[぀-ヿ一-鿿][^.;:]*/u)?.[0] ?? text).trim().slice(0, 60)

export function listingQualityIssues(listing: QualityListing): QualityIssue[] {
  const issues: QualityIssue[] = []
  const english = listing.descriptionEn ? romanizeStationNames(listing.descriptionEn) : ''
  if (JAPANESE.test(english)) issues.push({ type: 'en-japanese', optional: false, detail: snippet(english) })

  const nameJa = buildingNameOf(listing)
  if (nameJa && KANA.test(nameJa) && !extractBuildingNameEn(listing.descriptionEn)) issues.push({ type: 'zh-kana-name', optional: false, detail: nameJa })

  const stations = Array.isArray(listing.stations) ? listing.stations as Parameters<typeof formatTransitAccessLabel>[0][] : []
  const untranslated = stations.map((station) => formatTransitAccessLabel(station, 'en')).filter((label): label is string => !!label && JAPANESE.test(label))
  if (untranslated.length) issues.push({ type: 'station-untranslated', optional: false, detail: untranslated.join(', ') })
  const notListed = stations.map((station) => (station as { name?: string | null }).name).filter((name): name is string => !!name && !resolveStation(name))
  if (notListed.length) issues.push({ type: 'station-not-listed', optional: true, detail: notListed.join(', ') })

  const cover = pickCoverImage(listing.media)
  if (cover && coverTier(cover) >= WEAK_COVER_TIER) issues.push({ type: 'weak-cover', optional: true, detail: cover.url.split('/').pop() ?? '' })
  const photos = listing.media.filter((item) => item.category !== 'FLOORPLAN').length
  if (photos < MIN_PHOTOS) issues.push({ type: 'few-photos', optional: true, detail: `${photos}枚` })
  return issues
}

const DECISION_AFTER_MS = 14 * 24 * 3600_000
const OPTIONAL: ReadonlySet<IssueType> = new Set(['station-not-listed', 'weak-cover', 'few-photos'])

/** First-seen dates for the issues found now; issues that went away are dropped. */
export function mergeIssueHistory(previous: Record<string, string>, current: string[], now: Date): Record<string, string> {
  return Object.fromEntries(current.map((key) => [key, previous[key] ?? now.toISOString()]))
}

/** Required issues still open after two weeks: the only ones the owner hears about. */
export function escalations(history: Record<string, string>, now: Date): string[] {
  return Object.entries(history)
    .filter(([key, since]) => !OPTIONAL.has(key.split(':').pop() as IssueType) && now.getTime() - Date.parse(since) >= DECISION_AFTER_MS)
    .map(([key]) => key)
}
