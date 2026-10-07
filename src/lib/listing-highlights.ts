import { seismicStandard } from '@/lib/seismic'

/**
 * Good points and points to check for a listing, read from its Japanese features, description
 * and facts. Cautions are shown as plainly as highlights so buyers can ask about them early.
 */

export type HighlightKey = 'freehold' | 'nearStation' | 'newSeismic' | 'corner' | 'topFloor' | 'renovated' | 'renovationPlanned' | 'pets' | 'autoLock' | 'deliveryBox' | 'sunny'
export type CautionKey = 'noRebuild' | 'subleaseRequired' | 'oldSeismic' | 'checkSeismic' | 'noElevator' | 'selfManaged' | 'noAssociation' | 'noViewing' | 'leasehold' | 'farFromStation'

export interface HighlightSource {
  descriptionJa?: string | null
  features?: unknown
  builtYear?: number | null
  propertyType?: string | null
  landRights?: string | null
  /** Shortest walk to a station in minutes. */
  walkMinutes?: number | null
}

export interface ListingHighlights {
  highlights: HighlightKey[]
  cautions: CautionKey[]
  walkMinutes: number | null
}

const NEAR_STATION_MINUTES = 5
const FAR_FROM_STATION_MINUTES = 15

function sourceText(listing: HighlightSource): string {
  const features = Array.isArray(listing.features) ? listing.features.filter((item): item is string => typeof item === 'string') : []
  return [...features, listing.descriptionJa || ''].join('。').replace(/\s+/g, '')
}

/** Shortest 「徒歩N分」 in the text, used when station data has no walking time. */
function walkFromText(text: string): number | null {
  const minutes = [...text.matchAll(/徒歩([0-9]{1,2})分/gu)].map((match) => Number(match[1])).filter((value) => value > 0)
  return minutes.length ? Math.min(...minutes) : null
}

function petsAllowed(text: string): boolean {
  if (/ペット[^。]{0,8}不可/u.test(text)) return false
  return /ペット(飼育)?(可|相談)/u.test(text)
}

export function listingHighlights(listing: HighlightSource): ListingHighlights {
  const text = sourceText(listing)
  const isBuilding = listing.propertyType !== '土地'
  const walk = listing.walkMinutes ?? walkFromText(text)
  const seismic = isBuilding ? seismicStandard(listing.builtYear) : null
  const renovationPlanned = /(リノベーション|リフォーム)[^。]{0,20}予定/u.test(text)

  const highlights: HighlightKey[] = [
    /所有権/u.test(listing.landRights || '') ? 'freehold' : null,
    walk !== null && walk <= NEAR_STATION_MINUTES ? 'nearStation' : null,
    seismic === 'new' ? 'newSeismic' : null,
    /角部屋|角住戸/u.test(text) ? 'corner' : null,
    /最上階/u.test(text) ? 'topFloor' : null,
    renovationPlanned ? 'renovationPlanned' : /リノベーション|リフォーム済/u.test(text) ? 'renovated' : null,
    petsAllowed(text) ? 'pets' : null,
    /オートロック/u.test(text) ? 'autoLock' : null,
    /宅配ボックス/u.test(text) ? 'deliveryBox' : null,
    /(^|[^北])(南向き|南東向き|南西向き)/u.test(text) ? 'sunny' : null,
  ].filter((key): key is HighlightKey => key !== null)

  const cautions: CautionKey[] = [
    /再建築不可/u.test(text) ? 'noRebuild' : null,
    /サブリース契約[^。]{0,4}承継/u.test(text) ? 'subleaseRequired' : null,
    seismic === 'old' ? 'oldSeismic' : seismic === 'check' ? 'checkSeismic' : null,
    /エレベーター(なし|無し)/u.test(text) ? 'noElevator' : null,
    /自主管理/u.test(text) ? 'selfManaged' : null,
    /管理組合未成立/u.test(text) ? 'noAssociation' : null,
    /内見不可/u.test(text) ? 'noViewing' : null,
    /借地/u.test(listing.landRights || '') ? 'leasehold' : null,
    walk !== null && walk >= FAR_FROM_STATION_MINUTES ? 'farFromStation' : null,
  ].filter((key): key is CautionKey => key !== null)

  return { highlights, cautions, walkMinutes: walk }
}
