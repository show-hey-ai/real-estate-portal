import { TRANSIT_LINES, type TransitLine } from './lines'
import { stationKey } from './station-key'
import { STATIONS } from './stations.generated'

export { TRANSIT_LINES, type LineCategory, type TransitLine } from './lines'
export { STATIONS } from './stations.generated'
export { stationKey } from './station-key'

// Ways listings write a station that the key alone does not settle.
const STATION_ALIASES: Record<string, string> = {
  雪ケ谷大塚: '雪が谷大塚',
  高輪GW: '高輪ゲートウェイ',
  東京スカイツリー: 'とうきょうスカイツリー',
  雑司ケ谷: '雑司が谷',
  都電雑司が谷: '都電雑司ケ谷',
  椎名: '椎名町',
  モノレール浜松町: '浜松町',
  新線新宿: '新宿',
  京王新線新宿: '新宿',
  '羽田空港第1・第2ターミナル駅': '羽田空港第1・第2ターミナル',
}

const stationByKey = new Map<string, string>([
  ...Object.keys(STATIONS).map((name): [string, string] => [stationKey(name), name]),
  ...Object.entries(STATION_ALIASES).map(([alias, name]): [string, string] => [stationKey(alias), name]),
])
const stationBySlugMap = new Map(Object.entries(STATIONS).map(([name, { slug }]) => [slug, name]))
const lineByIdMap = new Map(TRANSIT_LINES.map((line) => [line.id, line]))
const lineByName = new Map(TRANSIT_LINES.flatMap((line) => [line.ja, ...(line.aliases ?? [])].map((name): [string, TransitLine] => [name, line])))

/** Every station of a line in running order, spurs last. */
export function lineStations(line: TransitLine): string[] {
  return [...line.stations, ...(line.branches ?? []).flatMap((branch) => branch.stations)]
}

const linesByStation = new Map<string, TransitLine[]>()
for (const line of TRANSIT_LINES) for (const name of new Set(lineStations(line))) linesByStation.set(name, [...(linesByStation.get(name) ?? []), line])

/** The station in the 23-ward list that a listing's station name means, if any. */
export function resolveStation(name: string | null | undefined): string | null {
  return stationByKey.get(stationKey(name)) ?? null
}

export function stationFromSlug(slug: string): string | null {
  return stationBySlugMap.get(slug) ?? null
}

export function linesOfStation(name: string): TransitLine[] {
  return linesByStation.get(name) ?? []
}

export function lineById(id: string): TransitLine | null {
  return lineByIdMap.get(id) ?? null
}

/** The line a listing's line name means, if any ("丸ノ内線", "JR山手線", "東京地下鉄丸ノ内線"…). */
export function resolveLine(name: string | null | undefined): TransitLine | null {
  const cleaned = (name ?? '').normalize('NFKC').replace(/\s+/g, '').replace(/^東京地下鉄/, '東京メトロ').replace(/^東京都(?!交通局)/, '都営')
  return lineByName.get(cleaned) ?? lineByName.get(cleaned.replace(/^(JR|ＪＲ)/, '')) ?? null
}

export interface ListingStation { station: string; walkMinutes: number | null }

/**
 * The 23-ward stations a listing is near, once each with its shortest walk. Stations outside the
 * list (outside the 23 wards, or unknown spellings) are left out.
 */
export function listingStations(stations: unknown): ListingStation[] {
  const nearest = new Map<string, number | null>()
  for (const entry of Array.isArray(stations) ? stations : []) {
    if (!entry || typeof entry !== 'object') continue
    const { name, walk_minutes: walk } = entry as { name?: unknown; walk_minutes?: unknown }
    const station = resolveStation(typeof name === 'string' ? name : null)
    if (!station) continue
    const minutes = typeof walk === 'number' && Number.isFinite(walk) && walk >= 0 ? walk : null
    const previous = nearest.get(station)
    nearest.set(station, previous == null ? minutes : minutes == null ? previous : Math.min(previous, minutes))
  }
  return [...nearest].map(([station, walkMinutes]) => ({ station, walkMinutes }))
}
