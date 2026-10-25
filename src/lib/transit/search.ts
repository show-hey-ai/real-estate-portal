import { translateStationName } from '../translate-fields'
import { STATIONS, TRANSIT_LINES, lineById, lineStations, listingStations, stationFromSlug, type LineCategory, type TransitLine } from './index'
import { isSelectionValue } from './selection-value'

/**
 * Line and station search: `stations` holds station slugs and `lines` line ids, comma separated
 * (/listings?stations=shibuya,ebisu&lines=metro-ginza). A listing matches when it is near any
 * selected station, or any station of a selected line.
 */
export { MAX_SELECTED, isSelectionValue } from './selection-value'

export interface StationSelection { stations: string[]; lines: TransitLine[] }

export function parseStationSelection(stations?: string | null, lines?: string | null): StationSelection {
  const split = (value?: string | null) => (value && isSelectionValue(value) ? [...new Set(value.split(','))] : [])
  return {
    stations: split(stations).map(stationFromSlug).filter((name): name is string => !!name),
    lines: split(lines).map(lineById).filter((line): line is TransitLine => !!line),
  }
}

export function hasSelection(selection: StationSelection): boolean {
  return selection.stations.length > 0 || selection.lines.length > 0
}

export function selectedStations(selection: StationSelection): Set<string> {
  return new Set([...selection.stations, ...selection.lines.flatMap(lineStations)])
}

/** Near a selected station, and within the walk limit of one of them when a limit is set. */
export function matchesStationSelection(stations: unknown, selected: ReadonlySet<string>, maxWalk: number | null): boolean {
  return listingStations(stations).some(({ station, walkMinutes }) => selected.has(station) && (maxWalk === null || (walkMinutes !== null && walkMinutes <= maxWalk)))
}

export function lineLabel(line: TransitLine, locale: string): string {
  return locale === 'ja' ? line.ja : line.en
}

export function stationLabel(name: string, locale: string): string {
  return translateStationName(name, locale) ?? name
}

/** "渋谷・恵比寿", "JR山手線", "渋谷・恵比寿 +3": short enough for a title or a chip row. */
export function selectionLabel(selection: StationSelection, locale: string): string | null {
  const names = [...selection.lines.map((line) => lineLabel(line, locale)), ...selection.stations.map((name) => stationLabel(name, locale))]
  if (!names.length) return null
  const separator = locale === 'en' ? ', ' : '・'
  return names.length > 2 ? `${names.slice(0, 2).join(separator)} +${names.length - 2}` : names.join(separator)
}

const OPERATOR_EN: Record<string, string> = {
  JR東日本: 'JR East', 東京メトロ: 'Tokyo Metro', 都営: 'Toei', 東急: 'Tokyu', 京王: 'Keio', 小田急: 'Odakyu', 西武: 'Seibu', 東武: 'Tobu',
  京成: 'Keisei', 北総鉄道: 'Hokuso Railway', 京急: 'Keikyu', つくばエクスプレス: 'Tsukuba Express', りんかい線: 'Rinkai Line', ゆりかもめ: 'Yurikamome', 東京モノレール: 'Tokyo Monorail',
}

/** `alt` is the name in the other script (English on Japanese pages, Japanese elsewhere) for searching. */
export interface IndexStation { slug: string; label: string; alt: string; count: number }
export interface IndexLine {
  id: string
  label: string
  operator: string
  category: LineCategory
  color: string
  count: number
  /** Indexes into `stations`, in running order. */
  stations: number[]
  /** Where a spur leaves the main line: [index in this line's `stations` where the spur starts, station index it leaves from]. */
  branches: [number, number][]
  loop: boolean
}
export interface TransitIndex {
  stations: IndexStation[]
  lines: IndexLine[]
  /** Each listing as [station index, walk minutes or -1] pairs, for live counts. */
  listings: [number, number][][]
}

/** Lines and stations with listing counts, in the visitor's language. */
export function buildTransitIndex(rows: readonly { stations: unknown }[], locale: string): TransitIndex {
  const names = Object.keys(STATIONS)
  const indexOf = new Map(names.map((name, index) => [name, index]))
  const listings = rows.map((row) => listingStations(row.stations).map(({ station, walkMinutes }): [number, number] => [indexOf.get(station)!, walkMinutes ?? -1]))
  const counts = new Array<number>(names.length).fill(0)
  for (const listing of listings) for (const [station] of listing) counts[station]++
  const stations = names.map((name, index) => ({ slug: STATIONS[name].slug, label: stationLabel(name, locale), alt: locale === 'ja' ? stationLabel(name, 'en') : name, count: counts[index] }))
  const lines = TRANSIT_LINES.map((line): IndexLine => {
    const members = lineStations(line).map((name) => indexOf.get(name)!)
    const memberSet = new Set(members)
    let offset = line.stations.length
    const branches = (line.branches ?? []).map((branch): [number, number] => {
      const start = offset
      offset += branch.stations.length
      return [start, indexOf.get(branch.from)!]
    })
    return {
      id: line.id,
      label: lineLabel(line, locale),
      operator: locale === 'ja' ? line.operator : OPERATOR_EN[line.operator] ?? line.operator,
      category: line.category,
      color: line.color,
      count: listings.filter((listing) => listing.some(([station]) => memberSet.has(station))).length,
      stations: members,
      branches,
      loop: Boolean(line.loopTo),
    }
  })
  return { stations, lines, listings }
}

export interface TransitOption { value: string; label: string; count: number }
export interface TransitOptions { lines: (TransitOption & { stations: TransitOption[] })[] }

/** Lines and stations that have listings now, for selects and the location search box. */
export function transitOptions(index: TransitIndex): TransitOptions {
  return {
    lines: index.lines
      .filter((line) => line.count > 0)
      .map((line) => ({
        value: line.id,
        label: line.label,
        count: line.count,
        stations: line.stations.map((station) => index.stations[station]).filter((station) => station.count > 0).map(({ slug, label, count }) => ({ value: slug, label, count })),
      })),
  }
}

/** Display names for the chosen lines and stations, keyed by line id and station slug. */
export function transitLabels(selection: StationSelection, locale: string): Record<string, string> {
  return Object.fromEntries([
    ...selection.lines.map((line) => [line.id, lineLabel(line, locale)]),
    ...selection.stations.map((name) => [STATIONS[name].slug, stationLabel(name, locale)]),
  ])
}

/** How many listings are near each 23-ward station. */
export function stationListingCounts(rows: readonly { stations: unknown }[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const row of rows) for (const { station } of listingStations(row.stations)) counts.set(station, (counts.get(station) ?? 0) + 1)
  return counts
}
