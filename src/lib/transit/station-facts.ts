// Facts for a station page, all derived from our own listings and the line data:
// what is for sale nearby (price range, typical size and layout, walking times) and which
// major stations can be reached without changing trains.
import { cardLayout } from '@/lib/card-facts'
import { lineNeighbours, lineStations, linesOfStation, listingStations, type TransitLine } from '@/lib/transit'
import { unitPriceOf } from '@/lib/unit-price'

/** Stations buyers commute to or recognise; shown when a station's own lines reach them directly. */
export const HUB_STATIONS = ['東京', '大手町', '新宿', '渋谷', '池袋', '品川', '上野', '銀座', '六本木', '秋葉原'] as const

/** Below this many listings a median says little, so the figure is left out. */
const MIN_FOR_MEDIAN = 3

export interface MarketRow {
  id: string
  propertyType: string | null
  price: number | string | bigint | null
  buildingArea: number | string | null
  landArea: number | string | null
  descriptionJa?: string | null
  stations: unknown
}

export interface StationMarket {
  count: number
  priceMin: number | null
  priceMax: number | null
  /** Null with fewer than three priced listings. */
  priceMedian: number | null
  /** Asking price per m² (land excluded); null with fewer than three listings. */
  unitPriceMedian: number | null
  /** The most common floor plan types, most frequent first. */
  layouts: { layout: string; count: number }[]
  walk: { within5: number; within10: number; beyond10: number }
}

function median(values: number[]): number | null {
  if (values.length < MIN_FOR_MEDIAN) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function stationMarket(rows: readonly MarketRow[], name: string): StationMarket | null {
  const near = rows.flatMap((row) => {
    const match = listingStations(row.stations).find(({ station }) => station === name)
    return match ? [{ row, walk: match.walkMinutes }] : []
  })
  if (!near.length) return null
  const prices = near.map(({ row }) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0)
  const unitPrices = near.filter(({ row }) => row.propertyType !== '土地').map(({ row }) => unitPriceOf(row)).filter((value): value is number => value !== null)
  const layoutCounts = new Map<string, number>()
  for (const { row } of near) {
    const layout = cardLayout(row.descriptionJa)
    if (layout) layoutCounts.set(layout, (layoutCounts.get(layout) ?? 0) + 1)
  }
  const walks = near.map(({ walk }) => walk)
  return {
    count: near.length,
    priceMin: prices.length ? Math.min(...prices) : null,
    priceMax: prices.length ? Math.max(...prices) : null,
    priceMedian: median(prices),
    unitPriceMedian: median(unitPrices),
    layouts: [...layoutCounts].map(([layout, count]) => ({ layout, count })).sort((a, b) => b.count - a.count || a.layout.localeCompare(b.layout)).slice(0, 3),
    walk: {
      within5: walks.filter((minutes) => minutes != null && minutes <= 5).length,
      within10: walks.filter((minutes) => minutes != null && minutes > 5 && minutes <= 10).length,
      beyond10: walks.filter((minutes) => minutes == null || minutes > 10).length,
    },
  }
}

/** Stops from one station to another along a line (following its loop and spurs); null if not on it. */
export function stopsBetween(line: TransitLine, from: string, to: string): number | null {
  const stations = new Set(lineStations(line))
  if (!stations.has(from) || !stations.has(to)) return null
  const distance = new Map([[from, 0]])
  const queue = [from]
  while (queue.length) {
    const current = queue.shift()!
    if (current === to) return distance.get(current)!
    for (const next of lineNeighbours(line, current)) {
      if (!distance.has(next)) { distance.set(next, distance.get(current)! + 1); queue.push(next) }
    }
  }
  return null
}

export interface HubAccess {
  hub: string
  line: TransitLine
  stops: number
}

/** Major stations reachable without changing trains, nearest first, each by its quickest line. */
export function directHubs(name: string, limit = 6): HubAccess[] {
  const best = new Map<string, HubAccess>()
  for (const line of linesOfStation(name)) {
    for (const hub of HUB_STATIONS) {
      if (hub === name) continue
      const stops = stopsBetween(line, name, hub)
      if (stops === null) continue
      const seen = best.get(hub)
      if (!seen || stops < seen.stops) best.set(hub, { hub, line, stops })
    }
  }
  return [...best.values()].sort((a, b) => a.stops - b.stops || HUB_STATIONS.indexOf(a.hub as never) - HUB_STATIONS.indexOf(b.hub as never)).slice(0, limit)
}
