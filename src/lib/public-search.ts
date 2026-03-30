export const TOKYO_13_WARDS = [
  '千代田区',
  '中央区',
  '港区',
  '新宿区',
  '渋谷区',
  '文京区',
  '目黒区',
  '品川区',
  '豊島区',
  '台東区',
  '墨田区',
  '江東区',
  '大田区',
] as const

export type Tokyo13Ward = (typeof TOKYO_13_WARDS)[number]

type StationSeed = {
  line?: string | null
  name?: string | null
}

export interface PublicSearchSeedRow {
  city: string | null
  stations: StationSeed[] | null
}

export interface PublicSearchLocationIndex {
  wards: readonly Tokyo13Ward[]
  lines: string[]
  stationsByLine: Record<string, string[]>
}

const tokyo13WardSet = new Set<string>(TOKYO_13_WARDS)

const railwayLineAliases: Record<string, string> = {
  山手線: 'JR山手線',
  京葉線: 'JR京葉線',
  総武線: 'JR総武線',
  中央線: 'JR中央線',
  日比谷線: '東京メトロ日比谷線',
  東西線: '東京メトロ東西線',
  銀座線: '東京メトロ銀座線',
  千代田線: '東京メトロ千代田線',
  半蔵門線: '東京メトロ半蔵門線',
  有楽町線: '東京メトロ有楽町線',
  副都心線: '東京メトロ副都心線',
  南北線: '東京メトロ南北線',
  丸の内線: '東京メトロ丸ノ内線',
  大江戸線: '都営大江戸線',
  新宿線: '都営新宿線',
  三田線: '都営三田線',
  浅草線: '都営浅草線',
  京浜急行本線: '京急本線',
  京浜急行線: '京急本線',
}

export function normalizeRailwayLine(line: string | null | undefined): string {
  if (!line) return ''
  const trimmed = line.trim()
  return railwayLineAliases[trimmed] ?? trimmed
}

export function normalizeStationName(name: string | null | undefined): string {
  if (!name) return ''
  return name.trim().replace(/\s+/g, '').replace(/駅$/, '')
}

function isRelevantWard(city: string | null | undefined): city is Tokyo13Ward {
  return !!city && tokyo13WardSet.has(city)
}

function isValidStationSeed(station: StationSeed): boolean {
  const line = normalizeRailwayLine(station.line)
  const name = normalizeStationName(station.name)

  if (!line || !name) return false
  if (name.endsWith('線')) return false
  if (normalizeRailwayLine(name) === line) return false

  return true
}

export function buildPublicSearchLocationIndex(
  rows: PublicSearchSeedRow[]
): PublicSearchLocationIndex {
  const lines = new Set<string>()
  const stationsByLine = new Map<string, Set<string>>()

  for (const row of rows) {
    if (!isRelevantWard(row.city)) continue

    const stations = Array.isArray(row.stations) ? row.stations : []
    for (const station of stations) {
      if (!isValidStationSeed(station)) continue

      const line = normalizeRailwayLine(station.line)
      const name = normalizeStationName(station.name)

      lines.add(line)
      if (!stationsByLine.has(line)) {
        stationsByLine.set(line, new Set())
      }
      stationsByLine.get(line)?.add(name)
    }
  }

  const sortedLines = [...lines].sort((a, b) => a.localeCompare(b, 'ja'))
  const sortedStationsByLine = Object.fromEntries(
    sortedLines.map((line) => [
      line,
      [...(stationsByLine.get(line) ?? new Set<string>())].sort((a, b) => a.localeCompare(b, 'ja')),
    ])
  )

  return {
    wards: TOKYO_13_WARDS,
    lines: sortedLines,
    stationsByLine: sortedStationsByLine,
  }
}

export function getStationsForLine(
  index: PublicSearchLocationIndex,
  line: string | null | undefined
): string[] {
  const normalizedLine = normalizeRailwayLine(line)
  if (!normalizedLine) return []
  return index.stationsByLine[normalizedLine] ?? []
}

export function matchesTransitFilters(
  stations: StationSeed[] | null | undefined,
  line: string | null | undefined,
  station: string | null | undefined
): boolean {
  const normalizedLine = normalizeRailwayLine(line)
  const normalizedStation = normalizeStationName(station)

  if (!normalizedLine && !normalizedStation) {
    return true
  }

  const stationList = Array.isArray(stations) ? stations : []
  return stationList.some((item) => {
    const itemLine = normalizeRailwayLine(item?.line)
    const itemStation = normalizeStationName(item?.name)

    if (!itemLine || !itemStation) return false
    if (normalizedLine && itemLine !== normalizedLine) return false
    if (normalizedStation && itemStation !== normalizedStation) return false

    return true
  })
}
