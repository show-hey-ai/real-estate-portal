/**
 * Checks src/lib/transit/lines.ts against the national railway data and writes
 * src/lib/transit/stations.generated.ts (ward, position and URL slug of every station).
 *
 * Sources (MLIT 国土数値情報, CC BY 4.0):
 *   鉄道データ N02 2025: https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-25/N02-25_GML.zip
 *   行政区域データ N03 2026 (Tokyo): https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2026/N03-20260101_13_GML.zip
 *   npx tsx scripts/build-transit.ts path/to/N02-25_Station.geojson path/to/N03-20260101_13.geojson [--check]
 *
 * Fails when a station is unknown to the data, when a station inside the 23 wards is on no line,
 * or when a station has no English name; long gaps between neighbours are printed for review.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { TRANSIT_LINES } from '../src/lib/transit/lines'
import { stationKey } from '../src/lib/transit/station-key'
import { translateStationName } from '../src/lib/translate-fields'
import { WARD_SLUGS } from '../src/lib/ward-tile-map'

type Point = [number, number]
interface Feature { properties: Record<string, string | null>; geometry: { type: string; coordinates: unknown } }

const OUTPUT = path.join(__dirname, '../src/lib/transit/stations.generated.ts')
const JAPANESE = /[぀-ヿ一-鿿]/u
const LONG_GAP_KM = 4.5
// The data names a few stations differently from the operators' own signs.
const DATA_NAME_ALIASES: Record<string, string> = { モノレール浜松町: '浜松町' }
// Stations in the 23 wards whose platform midpoint in the data falls just outside the ward outline.
const WARD_OVERRIDES: Record<string, string> = { 喜多見: '世田谷区', 大井競馬場前: '品川区' }

const read = (file: string) => (JSON.parse(readFileSync(file, 'utf8')) as { features: Feature[] }).features

function inRing([x, y]: Point, ring: Point[]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

function distanceKm([lon1, lat1]: Point, [lon2, lat2]: Point): number {
  const rad = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * rad) / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2
  return 12742 * Math.asin(Math.sqrt(a))
}

function slugify(english: string): string {
  return english.toLowerCase().replace(/[・·\s/]+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}

function main(): void {
  const [stationFile, wardFile] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'))
  const checkOnly = process.argv.includes('--check')
  if (!stationFile || !wardFile) throw new Error('Usage: npx tsx scripts/build-transit.ts N02-25_Station.geojson N03-20260101_13.geojson [--check]')

  const wardPolygons: { ward: string; rings: Point[][] }[] = []
  for (const feature of read(wardFile)) {
    const ward = feature.properties.N03_004 ?? ''
    if (!WARD_SLUGS[ward]) continue
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates as Point[][]] : (feature.geometry.coordinates as Point[][][])
    for (const rings of polygons) wardPolygons.push({ ward, rings })
  }
  const wardOf = (point: Point) => wardPolygons.find(({ rings: [outer, ...holes] }) => inRing(point, outer) && !holes.some((hole) => inRing(point, hole)))?.ward ?? null

  // Every station platform in the data, grouped by normalised name.
  const platforms = new Map<string, { name: string; point: Point; ward: string | null }[]>()
  for (const feature of read(stationFile)) {
    if (feature.properties.N02_002 === '1') continue // shinkansen
    const coordinates = feature.geometry.coordinates as Point[]
    const point = coordinates[Math.floor(coordinates.length / 2)]
    const raw = feature.properties.N02_005 ?? ''
    const name = DATA_NAME_ALIASES[raw] ?? raw
    const near = point[0] > 139.5 && point[0] < 140 && point[1] > 35.45 && point[1] < 35.9
    const key = stationKey(name)
    platforms.set(key, [...(platforms.get(key) ?? []), { name, point, ward: near ? wardOf(point) : null }])
  }

  const problems: string[] = []
  const notes: string[] = []
  const curated = new Map<string, string>()
  for (const line of TRANSIT_LINES) for (const name of [...line.stations, ...(line.branches ?? []).flatMap((branch) => branch.stations)]) curated.set(stationKey(name), name)

  const stations: Record<string, { slug: string; ward: string; lat: number; lng: number }> = {}
  for (const [key, name] of curated) {
    const found = platforms.get(key) ?? []
    const inside = found.filter((platform) => platform.ward)
    const chosen = inside.length ? inside : found.filter((platform) => WARD_OVERRIDES[name] && distanceKm(platform.point, [139.7, 35.68]) < 25)
    if (!chosen.length) {
      problems.push(`unknown or outside the 23 wards: ${name}`)
      continue
    }
    const english = translateStationName(name, 'en') ?? name
    if (JAPANESE.test(english)) problems.push(`no English name: ${name}`)
    const lng = chosen.reduce((sum, platform) => sum + platform.point[0], 0) / chosen.length
    const lat = chosen.reduce((sum, platform) => sum + platform.point[1], 0) / chosen.length
    const ward = WARD_OVERRIDES[name] ?? chosen[0].ward ?? ''
    stations[name] = { slug: slugify(english), ward, lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5 }
  }

  for (const [key, list] of platforms) {
    const inside = list.find((platform) => platform.ward)
    if (inside && !curated.has(key)) problems.push(`in the 23 wards but on no line: ${inside.name} (${inside.ward})`)
  }

  const slugs = new Map<string, string>()
  for (const [name, { slug }] of Object.entries(stations)) {
    if (slugs.has(slug)) problems.push(`duplicate slug ${slug}: ${slugs.get(slug)} / ${name}`)
    slugs.set(slug, name)
  }

  const position = (name: string): Point | null => (stations[name] ? [stations[name].lng, stations[name].lat] : null)
  for (const line of TRANSIT_LINES) {
    const pairs: [string, string][] = line.stations.slice(1).map((name, index) => [line.stations[index], name])
    if (line.loopTo) pairs.push([line.stations[line.stations.length - 1], line.loopTo])
    for (const branch of line.branches ?? []) pairs.push(...([branch.from, ...branch.stations].slice(1).map((name, index) => [[branch.from, ...branch.stations][index], name]) as [string, string][]))
    for (const [from, to] of pairs) {
      const [a, b] = [position(from), position(to)]
      if (a && b && distanceKm(a, b) > LONG_GAP_KM) notes.push(`${line.ja}: ${from} → ${to} ${distanceKm(a, b).toFixed(1)} km`)
    }
    if (new Set(line.stations).size !== line.stations.length) problems.push(`${line.ja}: a station is listed twice`)
  }

  for (const note of notes) console.log(`check: ${note}`)
  for (const problem of problems) console.log(`PROBLEM: ${problem}`)
  console.log(`${TRANSIT_LINES.length} lines, ${Object.keys(stations).length} stations, ${problems.length} problems, ${notes.length} long gaps`)
  if (problems.length) process.exit(1)
  if (checkOnly) return

  const body = Object.entries(stations)
    .sort(([left], [right]) => left.localeCompare(right, 'ja'))
    .map(([name, { slug, ward, lat, lng }]) => `  '${name}': { slug: '${slug}', ward: '${ward}', lat: ${lat}, lng: ${lng} },`)
    .join('\n')
  writeFileSync(OUTPUT, `// Generated by scripts/build-transit.ts — do not edit by hand.
// Positions: 国土数値情報 鉄道データ N02 (2025, MLIT, CC BY 4.0); wards: 行政区域データ N03 (2026).

export interface StationFacts { slug: string; ward: string; lat: number; lng: number }

export const STATIONS: Readonly<Record<string, StationFacts>> = {
${body}
}
`)
  console.log(`wrote ${OUTPUT}`)
}

main()
