/**
 * Builds src/lib/ward-shapes.ts: simplified outlines of Tokyo's 23 wards for the "browse by area" map.
 *
 * Source: 国土数値情報 行政区域データ (N03, 2026-01-01, Tokyo), MLIT — CC BY 4.0; the map must credit it
 * as edited by us (see MAP_CREDIT_URL in src/components/listing/ward-map.tsx).
 *   curl -o n03.zip https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2026/N03-20260101_13_GML.zip && unzip n03.zip
 *   npx tsx scripts/build-ward-shapes.ts path/to/N03-20260101_13.geojson
 *
 * The centre is enlarged slightly (radial exponent below 1) so the small central wards keep room
 * for a label on phones; neighbours and outlines stay as on a real map.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { WARD_NAMES, WARD_SLUGS } from '../src/lib/ward-tile-map'

type Point = [number, number]
type Ring = Point[]
interface Feature { properties: Record<string, string | null>; geometry: { type: 'Polygon' | 'MultiPolygon'; coordinates: number[][][] | number[][][][] } }

const OUTPUT = path.join(__dirname, '../src/lib/ward-shapes.ts')
const CENTER: Point = [139.7536, 35.6939] // 千代田区
const KM_PER_DEG: Point = [90.8, 111.0] // near 35.7°N
const FISHEYE = { radiusKm: 15, exponent: 0.85 }
const TOLERANCE_KM = 0.09
const MIN_ISLAND_KM2 = 0.25
const WIDTH = 600
const PADDING = 6
// Phone label sizes in map units; keep in step with WardLabel in src/components/listing/ward-map.tsx.
const LABEL_FONT = { name: 18, count: 20 }
const LATIN_GLYPH_EM = 0.62

function toKm([lon, lat]: number[]): Point {
  const dx = (lon - CENTER[0]) * KM_PER_DEG[0]
  const dy = (CENTER[1] - lat) * KM_PER_DEG[1]
  const distance = Math.hypot(dx, dy)
  if (distance === 0) return [0, 0]
  const scale = (FISHEYE.radiusKm * Math.pow(distance / FISHEYE.radiusKm, FISHEYE.exponent)) / distance
  return [dx * scale, dy * scale]
}

function ringArea(ring: Ring): number {
  let sum = 0
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) sum += (ring[j][0] - ring[i][0]) * (ring[j][1] + ring[i][1])
  return Math.abs(sum) / 2
}

function segmentDistance(point: Point, a: Point, b: Point): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const lengthSq = dx * dx + dy * dy
  const t = lengthSq ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSq)) : 0
  return Math.hypot(point[0] - (a[0] + t * dx), point[1] - (a[1] + t * dy))
}

function simplify(points: Ring, tolerance: number): Ring {
  if (points.length < 3) return points
  let index = 0
  let max = 0
  for (let i = 1; i < points.length - 1; i++) {
    const distance = segmentDistance(points[i], points[0], points[points.length - 1])
    if (distance > max) [index, max] = [i, distance]
  }
  if (max <= tolerance) return [points[0], points[points.length - 1]]
  return [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)]
}

function simplifyRing(ring: Ring): Ring {
  // Split the closed ring at its farthest point so both halves keep a fixed anchor.
  const start = ring[0]
  const far = ring.reduce((best, point, index) => (Math.hypot(point[0] - start[0], point[1] - start[1]) > Math.hypot(ring[best][0] - start[0], ring[best][1] - start[1]) ? index : best), 0)
  return [...simplify(ring.slice(0, far + 1), TOLERANCE_KM).slice(0, -1), ...simplify(ring.slice(far), TOLERANCE_KM)]
}

function inside(point: Point, ring: Ring): boolean {
  let result = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) result = !result
  }
  return result
}

const insidePolygon = (point: Point, [outer, ...holes]: Ring[]) => inside(point, outer) && !holes.some((hole) => inside(point, hole))

/** Inner points of a polygon with their distance to the outline, roomiest first. */
function labelCandidates(polygon: Ring[]): { point: Point; clearance: number }[] {
  const xs = polygon[0].map(([x]) => x)
  const ys = polygon[0].map(([, y]) => y)
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)]
  const [spanX, spanY] = [Math.max(...xs) - minX, Math.max(...ys) - minY]
  const steps = 70
  const candidates: { point: Point; clearance: number }[] = []
  for (let i = 0; i <= steps; i++) {
    for (let j = 0; j <= steps; j++) {
      const point: Point = [minX + (spanX * i) / steps, minY + (spanY * j) / steps]
      if (!insidePolygon(point, polygon)) continue
      candidates.push({ point, clearance: Math.min(...polygon.flatMap((ring) => ring.map((a, k) => segmentDistance(point, a, ring[(k + 1) % ring.length])))) })
    }
  }
  return candidates.sort((left, right) => right.clearance - left.clearance)
}

type Box = [number, number, number, number]

/** The two-line label (name over count) at phone size, in map units. */
function labelBox(ward: string, [x, y]: Point): Box {
  const latin = (WARD_NAMES[ward]?.[0] ?? '').length * LABEL_FONT.name * LATIN_GLYPH_EM
  const width = Math.max(ward.length * LABEL_FONT.name, latin) + 4
  return [x - width / 2, y - LABEL_FONT.name * 1.27, x + width / 2, y + LABEL_FONT.count * 1.29]
}

const overlap = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))

/**
 * Picks label points so the labels stay inside their ward and clear of each other on a phone:
 * small wards choose first, and each label trades roominess against overlap with labels placed.
 */
function placeLabels(polygonsByWard: Map<string, Ring[][]>, bounds: Box): Map<string, Point> {
  const placed: Box[] = []
  const labels = new Map<string, Point>()
  const mainPolygon = (polygons: Ring[][]) => polygons.reduce((largest, polygon) => (ringArea(polygon[0]) > ringArea(largest[0]) ? polygon : largest))
  const wards = [...polygonsByWard].sort(([, left], [, right]) => ringArea(mainPolygon(left)[0]) - ringArea(mainPolygon(right)[0]))
  for (const [ward, polygons] of wards) {
    const candidates = labelCandidates(mainPolygon(polygons))
    const roomiest = candidates[0]?.clearance || 1
    let best = candidates[0]
    let bestScore = -Infinity
    for (const candidate of candidates.slice(0, 400)) {
      const box = labelBox(ward, candidate.point)
      const samples: Point[] = [0, 0.5, 1].flatMap((u) => [0, 0.5, 1].map((v) => [box[0] + (box[2] - box[0]) * u, box[1] + (box[3] - box[1]) * v] as Point))
      const insideShare = samples.filter((point) => polygons.some((polygon) => insidePolygon(point, polygon))).length / samples.length
      const outOfMap = overlap(box, bounds) < (box[2] - box[0]) * (box[3] - box[1]) ? 1 : 0
      const crowding = placed.reduce((sum, other) => sum + overlap(box, other), 0)
      const score = candidate.clearance / roomiest + 1.2 * insideShare - 0.05 * crowding - 5 * outOfMap
      if (score > bestScore) [best, bestScore] = [candidate, score]
    }
    labels.set(ward, best.point)
    placed.push(labelBox(ward, best.point))
  }
  return labels
}

function main(): void {
  const source = process.argv[2]
  if (!source) throw new Error('Usage: npx tsx scripts/build-ward-shapes.ts path/to/N03-20260101_13.geojson')
  const { features } = JSON.parse(readFileSync(source, 'utf8')) as { features: Feature[] }

  const polygonsByWard = new Map<string, Ring[][]>()
  for (const feature of features) {
    const ward = feature.properties.N03_004 ?? ''
    if (!WARD_SLUGS[ward]) continue
    const polygons = feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates as number[][][]] : (feature.geometry.coordinates as number[][][][])
    for (const polygon of polygons) {
      const rings = polygon.map((ring) => ring.map(toKm))
      if (ringArea(rings[0]) < MIN_ISLAND_KM2) continue
      polygonsByWard.set(ward, [...(polygonsByWard.get(ward) ?? []), rings.map(simplifyRing).filter((ring) => ring.length >= 3)])
    }
  }
  if (polygonsByWard.size !== 23) throw new Error(`Expected 23 wards, found ${polygonsByWard.size}`)

  const all = [...polygonsByWard.values()].flat(3) as Point[]
  const [minX, maxX] = [Math.min(...all.map(([x]) => x)), Math.max(...all.map(([x]) => x))]
  const [minY, maxY] = [Math.min(...all.map(([, y]) => y)), Math.max(...all.map(([, y]) => y))]
  const scale = (WIDTH - PADDING * 2) / (maxX - minX)
  const height = Math.ceil((maxY - minY) * scale + PADDING * 2)
  const place = ([x, y]: Point): Point => [(x - minX) * scale + PADDING, (y - minY) * scale + PADDING]
  const round = (value: number) => Math.round(value * 10) / 10
  const placedWards = new Map([...polygonsByWard].map(([ward, polygons]) => [ward, polygons.map((polygon) => polygon.map((ring) => ring.map(place)))]))
  const labels = placeLabels(placedWards, [0, 0, WIDTH, height])

  const shapes = [...placedWards].map(([ward, polygons]) => {
    const d = polygons
      .flatMap((polygon) => polygon.map((ring) => {
        const points = ring.map(([x, y]) => [round(x), round(y)] as Point)
        const [first, ...rest] = points
        let previous = first
        const steps = rest.map(([x, y]) => {
          const step = `${round(x - previous[0])} ${round(y - previous[1])}`
          previous = [x, y]
          return step
        })
        return `M${first[0]} ${first[1]}l${steps.join(' ')}z`
      }))
      .join('')
      .replace(/ -/g, '-')
    const [labelX, labelY] = labels.get(ward) ?? [0, 0]
    return { ward, d, label: [round(labelX), round(labelY)] }
  })

  const body = shapes.map(({ ward, d, label }) => `  { ward: '${ward}', label: [${label[0]}, ${label[1]}], d: '${d}' },`).join('\n')
  writeFileSync(OUTPUT, `// Generated by scripts/build-ward-shapes.ts — do not edit by hand.
// Outlines: 国土数値情報 行政区域データ N03 (2026-01-01, MLIT), simplified, centre slightly enlarged.

export interface WardShape { ward: string; label: readonly [number, number]; d: string }

export const WARD_SHAPES_VIEWBOX = { width: ${WIDTH}, height: ${height} } as const

export const WARD_SHAPES: readonly WardShape[] = [
${body}
]
`)
  console.log(`wrote ${OUTPUT}: ${shapes.length} wards, ${height}px tall, ${Math.round(body.length / 1024)} KB`)
}

main()
