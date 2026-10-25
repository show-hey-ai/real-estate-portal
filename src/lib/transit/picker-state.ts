import type { TransitIndex } from './search'

/**
 * What the line/station picker has selected: whole lines (kept as one `lines` value so the URL stays
 * short) plus single stations, by their index in `TransitIndex.stations`.
 */
export interface PickerSelection { lines: ReadonlySet<string>; stations: ReadonlySet<number> }

export const EMPTY_SELECTION: PickerSelection = { lines: new Set(), stations: new Set() }

const lineOf = (index: TransitIndex, id: string) => index.lines.find((line) => line.id === id)

export function initialSelection(index: TransitIndex, stations: string | null, lines: string | null): PickerSelection {
  const slugs = new Set((stations ?? '').split(',').filter(Boolean))
  const ids = new Set((lines ?? '').split(',').filter((id) => lineOf(index, id)))
  return {
    lines: ids,
    stations: new Set(index.stations.flatMap((station, position) => (slugs.has(station.slug) ? [position] : []))),
  }
}

export function effectiveStations(index: TransitIndex, selection: PickerSelection): Set<number> {
  return new Set([...selection.stations, ...[...selection.lines].flatMap((id) => lineOf(index, id)?.stations ?? [])])
}

export function isLineSelected(index: TransitIndex, selection: PickerSelection, id: string): boolean {
  if (selection.lines.has(id)) return true
  const line = lineOf(index, id)
  return Boolean(line?.stations.length) && line!.stations.every((station) => selection.stations.has(station))
}

/** Selecting a line takes in its single stations; clearing it clears them too. */
export function toggleLine(index: TransitIndex, selection: PickerSelection, id: string): PickerSelection {
  const members = new Set(lineOf(index, id)?.stations ?? [])
  const stations = new Set([...selection.stations].filter((station) => !members.has(station)))
  const lines = new Set(selection.lines)
  if (isLineSelected(index, selection, id)) lines.delete(id)
  else lines.add(id)
  return { lines, stations }
}

/** Clearing one station of a whole selected line keeps the rest of that line selected. */
export function toggleStation(index: TransitIndex, selection: PickerSelection, station: number): PickerSelection {
  const covering = [...selection.lines].filter((id) => lineOf(index, id)?.stations.includes(station))
  if (!covering.length) {
    const stations = new Set(selection.stations)
    if (stations.has(station)) stations.delete(station)
    else stations.add(station)
    return { lines: selection.lines, stations }
  }
  const kept = covering.flatMap((id) => lineOf(index, id)?.stations ?? []).filter((member) => member !== station)
  return {
    lines: new Set([...selection.lines].filter((id) => !covering.includes(id))),
    stations: new Set([...selection.stations, ...kept].filter((member) => member !== station)),
  }
}

/** Listings near a selected station, within the walk limit when one is set. */
export function countMatches(index: TransitIndex, selected: ReadonlySet<number>, maxWalk: number | null): number {
  return index.listings.filter((pairs) => pairs.some(([station, walk]) => selected.has(station) && (maxWalk === null || (walk >= 0 && walk <= maxWalk)))).length
}

const TRANSIT_KEYS = ['stations', 'lines', 'line', 'station', 'walkMax', 'page']

/** The /listings URL for the selection, keeping the visitor's other filters. */
export function listingsHref(index: TransitIndex, selection: PickerSelection, maxWalk: number | null, keep: string): string {
  const params = new URLSearchParams(keep)
  for (const key of TRANSIT_KEYS) params.delete(key)
  const slugs = [...selection.stations].sort((a, b) => a - b).map((station) => index.stations[station].slug)
  if (slugs.length) params.set('stations', slugs.join(','))
  if (selection.lines.size) params.set('lines', [...selection.lines].join(','))
  if (maxWalk !== null) params.set('walkMax', String(maxWalk))
  const query = params.toString().replace(/%2C/g, ',')
  return query ? `/listings?${query}` : '/listings'
}

/** Turn a run of stations on or off together (drag or Shift+click across a line). */
export function setStations(index: TransitIndex, selection: PickerSelection, stations: readonly number[], on: boolean): PickerSelection {
  return stations.reduce((current, station) => (effectiveStations(index, current).has(station) === on ? current : toggleStation(index, current, station)), selection)
}
