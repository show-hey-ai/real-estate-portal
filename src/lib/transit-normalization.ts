import {
  normalizeRailwayLine,
  normalizeStationName,
  splitNormalizedRailwayLines,
} from '@/lib/public-search'
import {
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'

export interface TransitStationInput {
  line?: string | null
  line_en?: string | null
  name?: string | null
  name_en?: string | null
  walk_minutes?: number | null
}

export interface NormalizedTransitStation {
  line: string | null
  line_en: string | null
  name: string
  name_en: string | null
  walk_minutes: number | null
}

function normalizeWalkMinutes(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 0 ? Math.round(value) : null
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed)
    }
  }

  return null
}

export function normalizeTransitStations(
  stations: TransitStationInput[] | null | undefined
): NormalizedTransitStation[] {
  if (!Array.isArray(stations)) {
    return []
  }

  const normalizedStations: NormalizedTransitStation[] = []
  const seen = new Set<string>()

  for (const station of stations) {
    const normalizedName = normalizeStationName(station?.name)
    if (!normalizedName || normalizedName.endsWith('線')) {
      continue
    }

    const walkMinutes = normalizeWalkMinutes(station?.walk_minutes)
    const fallbackNameEn = translateStationName(normalizedName, 'en')
    const nameEn = station?.name_en?.trim() || fallbackNameEn || null
    const normalizedLines = splitNormalizedRailwayLines(station?.line)

    if (normalizedLines.length === 0) {
      const key = `${normalizedName}||${walkMinutes ?? ''}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      normalizedStations.push({
        line: null,
        line_en: null,
        name: normalizedName,
        name_en: nameEn,
        walk_minutes: walkMinutes,
      })
      continue
    }

    for (const normalizedLine of normalizedLines) {
      const canonicalLine = normalizeRailwayLine(normalizedLine)
      if (!canonicalLine) {
        continue
      }

      const key = `${normalizedName}|${canonicalLine}|${walkMinutes ?? ''}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)

      normalizedStations.push({
        line: canonicalLine,
        line_en: translateRailwayLine(canonicalLine, 'en') || null,
        name: normalizedName,
        name_en: nameEn,
        walk_minutes: walkMinutes,
      })
    }
  }

  return normalizedStations
}
