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

export interface PublicSearchMasterLineRow {
  displayNameJa: string
  stations: {
    displayNameJa: string
  }[]
}

const tokyo13WardSet = new Set<string>(TOKYO_13_WARDS)

const railwayLineAliases: Record<string, string> = {
  山手線: 'JR山手線',
  京葉線: 'JR京葉線',
  総武線: 'JR総武線',
  'JR中央・総武線': 'JR総武線',
  総武中央線: 'JR総武線',
  中央線: 'JR中央線',
  京浜東北線: 'JR京浜東北線',
  東海道線: 'JR東海道線',
  横須賀線: 'JR横須賀線',
  赤羽線: 'JR埼京線',
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
  大井町線: '東急大井町線',
  東横線: '東急東横線',
  目黒線: '東急目黒線',
  池上線: '東急池上線',
  多摩川線: '東急多摩川線',
  井の頭線: '京王井の頭線',
  小田原線: '小田急小田原線',
  押上線: '京成押上線',
  池袋線: '西武池袋線',
  亀戸線: '東武亀戸線',
  東上本線: '東武東上線',
  常磐新線: 'つくばエクスプレス',
  臨海副都心線: 'りんかい線',
  東京臨海新交通臨海線: 'ゆりかもめ',
  東京モノレール羽田線: '東京モノレール羽田空港線',
  伊勢崎線: '東武伊勢崎線',
  京浜急行本線: '京急本線',
  京浜急行線: '京急本線',
  京浜急行: '京急本線',
  つくばEX: 'つくばエクスプレス',
}

const stationNameAliases: Record<string, string> = {
  高輪GW: '高輪ゲートウェイ',
  とうきょうスカイツリー: '東京スカイツリー',
  雑司ヶ谷: '雑司が谷',
  市ヶ谷: '市ケ谷',
  都電雑司ヶ谷: '都電雑司が谷',
}

export function normalizeRailwayLine(line: string | null | undefined): string {
  if (!line) return ''
  const trimmed = line.trim()
  return railwayLineAliases[trimmed] ?? trimmed
}

export function normalizeStationName(name: string | null | undefined): string {
  if (!name) return ''
  const trimmed = name.trim().replace(/\s+/g, '').replace(/駅$/, '')
  return stationNameAliases[trimmed] ?? trimmed
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

export function buildPublicSearchLocationIndex(rows: PublicSearchSeedRow[]): PublicSearchLocationIndex {
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

export function buildPublicSearchLocationIndexFromMaster(
  rows: PublicSearchMasterLineRow[]
): PublicSearchLocationIndex {
  const sortedLines = rows
    .map((row) => normalizeRailwayLine(row.displayNameJa))
    .filter(Boolean)

  const stationsByLine = Object.fromEntries(
    rows
      .map((row) => {
        const line = normalizeRailwayLine(row.displayNameJa)
        const stations = [...new Set(
          row.stations
            .map((station) => normalizeStationName(station.displayNameJa))
            .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b, 'ja'))

        return [line, stations]
      })
      .filter(([line]) => Boolean(line))
  )

  return {
    wards: TOKYO_13_WARDS,
    lines: [...new Set(sortedLines)],
    stationsByLine,
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
    if (!isValidStationSeed(item)) return false

    const itemLine = normalizeRailwayLine(item?.line)
    const itemStation = normalizeStationName(item?.name)

    if (!itemLine || !itemStation) return false
    if (normalizedLine && itemLine !== normalizedLine) return false
    if (normalizedStation && itemStation !== normalizedStation) return false

    return true
  })
}
