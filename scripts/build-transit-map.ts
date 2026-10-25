/**
 * Builds src/lib/transit/map-layout.generated.ts: a schematic route map of the 23 wards for the
 * clickable map on /lines. Our own drawing, from station positions in 国土数値情報 N02 (via
 * stations.generated.ts) — no commercial route map is traced.
 *
 *   npx tsx scripts/build-transit-map.ts
 *
 * Method: stations start at their real positions with the centre enlarged, then a force layout
 * pulls each track section towards a multiple of 45°, keeps sections a readable length, pushes
 * stations apart from each other and from tracks they are not on, and keeps a weak pull to the
 * real position so the map still matches geography. Labels go to the free side of each station.
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { STATIONS, TRANSIT_LINES } from '../src/lib/transit'
import { translateStationName } from '../src/lib/translate-fields'

type Point = [number, number]

const OUTPUT = path.join(__dirname, '../src/lib/transit/map-layout.generated.ts')
const CENTER: Point = [139.76, 35.685]
const KM_PER_DEG: Point = [90.8, 111]
const FISHEYE = { radiusKm: 12, exponent: 0.7 }
const UNITS_PER_KM = 30
const ITERATIONS = 3000
const EDGE = { min: 28, max: 70, geoShare: 0.75 }
const STATION_GAP = 26
const TRACK_GAP = 18
const PARALLEL_OFFSET = 3.2
const LABEL_FONT = 8
const MARGIN = 40

const names = Object.keys(STATIONS)
const indexOf = new Map(names.map((name, index) => [name, index]))

function project(name: string): Point {
  const { lng, lat } = STATIONS[name]
  const dx = (lng - CENTER[0]) * KM_PER_DEG[0]
  const dy = (CENTER[1] - lat) * KM_PER_DEG[1]
  const distance = Math.hypot(dx, dy) || 1e-6
  const scale = (FISHEYE.radiusKm * Math.pow(distance / FISHEYE.radiusKm, FISHEYE.exponent)) / distance
  return [dx * scale * UNITS_PER_KM, dy * scale * UNITS_PER_KM]
}

interface Edge { a: number; b: number; lines: string[]; geoLength: number }

function buildEdges(geo: Point[]): Edge[] {
  const edges = new Map<string, Edge>()
  for (const line of TRANSIT_LINES) {
    const runs: string[][] = [[...line.stations]]
    if (line.loopTo) runs.push([line.stations[line.stations.length - 1], line.loopTo])
    for (const branch of line.branches ?? []) runs.push([branch.from, ...branch.stations])
    for (const run of runs) {
      for (let i = 1; i < run.length; i++) {
        const [a, b] = [indexOf.get(run[i - 1])!, indexOf.get(run[i])!]
        const key = a < b ? `${a}-${b}` : `${b}-${a}`
        const edge = edges.get(key) ?? { a, b, lines: [], geoLength: Math.hypot(geo[a][0] - geo[b][0], geo[a][1] - geo[b][1]) }
        edge.lines.push(line.id)
        edges.set(key, edge)
      }
    }
  }
  return [...edges.values()]
}

function relax(geo: Point[], edges: Edge[]): Point[] {
  const pos = geo.map(([x, y]): Point => [x, y])
  const target = (edge: Edge) => Math.min(EDGE.max, Math.max(EDGE.min, edge.geoLength * EDGE.geoShare))
  for (let iteration = 0; iteration < ITERATIONS; iteration++) {
    const cooling = 1 - iteration / ITERATIONS
    const force = pos.map((): Point => [0, 0])
    for (const edge of edges) {
      const [ax, ay] = pos[edge.a]
      const [bx, by] = pos[edge.b]
      const length = Math.hypot(bx - ax, by - ay) || 1e-6
      const [ux, uy] = [(bx - ax) / length, (by - ay) / length]
      const spring = (length - target(edge)) * 0.08
      force[edge.a][0] += ux * spring; force[edge.a][1] += uy * spring
      force[edge.b][0] -= ux * spring; force[edge.b][1] -= uy * spring
      // Turn the section towards the nearest multiple of 45° around its midpoint.
      const angle = Math.round(Math.atan2(by - ay, bx - ax) / (Math.PI / 4)) * (Math.PI / 4)
      const [mx, my, half] = [(ax + bx) / 2, (ay + by) / 2, length / 2]
      const weight = 0.35 * (1 - cooling * 0.5)
      force[edge.b][0] += (mx + Math.cos(angle) * half - bx) * weight; force[edge.b][1] += (my + Math.sin(angle) * half - by) * weight
      force[edge.a][0] += (mx - Math.cos(angle) * half - ax) * weight; force[edge.a][1] += (my - Math.sin(angle) * half - ay) * weight
    }
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const [dx, dy] = [pos[j][0] - pos[i][0], pos[j][1] - pos[i][1]]
        if (Math.abs(dx) > STATION_GAP || Math.abs(dy) > STATION_GAP) continue
        const distance = Math.hypot(dx, dy) || 1e-3
        if (distance >= STATION_GAP) continue
        const push = (STATION_GAP - distance) * 0.5
        force[i][0] -= (dx / distance) * push; force[i][1] -= (dy / distance) * push
        force[j][0] += (dx / distance) * push; force[j][1] += (dy / distance) * push
      }
    }
    if (iteration % 4 === 0) {
      for (const edge of edges) {
        const [ax, ay] = pos[edge.a]
        const [bx, by] = pos[edge.b]
        const [vx, vy] = [bx - ax, by - ay]
        const lengthSq = vx * vx + vy * vy || 1e-6
        for (let n = 0; n < pos.length; n++) {
          if (n === edge.a || n === edge.b) continue
          const [px, py] = pos[n]
          if (px < Math.min(ax, bx) - TRACK_GAP || px > Math.max(ax, bx) + TRACK_GAP || py < Math.min(ay, by) - TRACK_GAP || py > Math.max(ay, by) + TRACK_GAP) continue
          const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / lengthSq))
          const [cx, cy] = [ax + t * vx, ay + t * vy]
          const distance = Math.hypot(px - cx, py - cy) || 1e-3
          if (distance >= TRACK_GAP) continue
          const push = (TRACK_GAP - distance) * 0.6
          force[n][0] += ((px - cx) / distance) * push; force[n][1] += ((py - cy) / distance) * push
        }
      }
    }
    for (let i = 0; i < pos.length; i++) {
      force[i][0] += (geo[i][0] - pos[i][0]) * 0.004
      force[i][1] += (geo[i][1] - pos[i][1]) * 0.004
      const magnitude = Math.hypot(force[i][0], force[i][1])
      const limit = magnitude > 6 ? 6 / magnitude : 1
      const step = (0.5 * cooling + 0.05) * 2 * limit
      pos[i][0] += force[i][0] * step
      pos[i][1] += force[i][1] * step
    }
  }
  return pos
}

// Label directions: 0 right, 1 left, 2 above, 3 below, 4 upper right, 5 lower right, 6 upper left, 7 lower left.
const DIRECTIONS: Point[] = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]]
type Box = [number, number, number, number]

function labelBox([x, y]: Point, direction: number, width: number): Box {
  const [dx, dy] = DIRECTIONS[direction]
  const height = LABEL_FONT * 1.2
  const gap = 6
  const left = dx > 0 ? x + gap : dx < 0 ? x - gap - width : x - width / 2
  const top = dy > 0 ? y + gap : dy < 0 ? y - gap - height : y - height / 2
  return [left, top, left + width, top + height]
}

const overlapArea = (a: Box, b: Box) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]))

/** Greedy placement: busiest stations first, each label on the side that collides least. */
function placeLabels(pos: Point[], edges: Edge[], width: (index: number) => number, order: number[]): number[] {
  const placed: Box[] = []
  const directions = new Array<number>(pos.length).fill(0)
  const stationBoxes: Box[] = pos.map(([x, y]) => [x - 4, y - 4, x + 4, y + 4])
  const crossesTrack = (box: Box) => edges.reduce((sum, edge) => {
    const [[ax, ay], [bx, by]] = [pos[edge.a], pos[edge.b]]
    let hits = 0
    for (let t = 0; t <= 1; t += 0.125) {
      const [x, y] = [ax + (bx - ax) * t, ay + (by - ay) * t]
      if (x > box[0] && x < box[2] && y > box[1] && y < box[3]) hits++
    }
    return sum + hits
  }, 0)
  for (const index of order) {
    let best = 0
    let bestScore = Infinity
    for (let direction = 0; direction < DIRECTIONS.length; direction++) {
      const box = labelBox(pos[index], direction, width(index))
      const score = placed.reduce((sum, other) => sum + overlapArea(box, other), 0) * 4
        + stationBoxes.reduce((sum, other, other_index) => sum + (other_index === index ? 0 : overlapArea(box, other)), 0) * 6
        + crossesTrack(box) * 40 + direction * 0.5
      if (score < bestScore) [best, bestScore] = [direction, score]
    }
    directions[index] = best
    placed.push(labelBox(pos[index], best, width(index)))
  }
  return directions
}

function main(): void {
  const geo = names.map(project)
  const edges = buildEdges(geo)
  const pos = relax(geo, edges)
  const [minX, minY] = [Math.min(...pos.map(([x]) => x)) - MARGIN * 3, Math.min(...pos.map(([, y]) => y)) - MARGIN]
  const shifted = pos.map(([x, y]): Point => [Math.round((x - minX) * 10) / 10, Math.round((y - minY) * 10) / 10])
  const width = Math.ceil(Math.max(...shifted.map(([x]) => x)) + MARGIN * 3)
  const height = Math.ceil(Math.max(...shifted.map(([, y]) => y)) + MARGIN)

  const traffic = new Array<number>(names.length).fill(0)
  for (const edge of edges) { traffic[edge.a] += edge.lines.length; traffic[edge.b] += edge.lines.length }
  const order = names.map((_, index) => index).sort((left, right) => traffic[right] - traffic[left])
  const jaWidth = (index: number) => names[index].length * LABEL_FONT
  const enWidth = (index: number) => (translateStationName(names[index], 'en') ?? names[index]).length * LABEL_FONT * 0.56
  const labelsJa = placeLabels(shifted, edges, jaWidth, order)
  const labelsEn = placeLabels(shifted, edges, enWidth, order)

  // Each line as one path; sections shared by several lines sit side by side.
  const color = new Map(TRANSIT_LINES.map((line) => [line.id, line.color]))
  const segments = new Map<string, string[]>()
  for (const edge of edges) {
    const [[ax, ay], [bx, by]] = [shifted[edge.a], shifted[edge.b]]
    const length = Math.hypot(bx - ax, by - ay) || 1
    const [nx, ny] = [-(by - ay) / length, (bx - ax) / length]
    const sorted = [...edge.lines].sort((left, right) => TRANSIT_LINES.findIndex((line) => line.id === left) - TRANSIT_LINES.findIndex((line) => line.id === right))
    sorted.forEach((id, position) => {
      const offset = (position - (sorted.length - 1) / 2) * PARALLEL_OFFSET
      const r = (value: number) => Math.round(value * 10) / 10
      segments.set(id, [...(segments.get(id) ?? []), `M${r(ax + nx * offset)} ${r(ay + ny * offset)}L${r(bx + nx * offset)} ${r(by + ny * offset)}`])
    })
  }

  const stationRows = names.map((name, index) => `  ['${STATIONS[name].slug}', ${shifted[index][0]}, ${shifted[index][1]}, ${traffic[index] > 4 ? 1 : 0}, ${labelsJa[index]}, ${labelsEn[index]}],`).join('\n')
  const lineRows = TRANSIT_LINES.map((line) => `  { id: '${line.id}', color: '${color.get(line.id)}', d: '${(segments.get(line.id) ?? []).join('')}' },`).join('\n')
  writeFileSync(OUTPUT, `// Generated by scripts/build-transit-map.ts — do not edit by hand.
// Our own schematic drawing from 国土数値情報 鉄道データ N02 (2025, MLIT, CC BY 4.0) station positions.

export const MAP_VIEWBOX = { width: ${width}, height: ${height} } as const

/** [slug, x, y, transfer hub (1/0), Japanese label side, English label side]; sides: 0 right, 1 left, 2 above, 3 below, 4–7 diagonals. */
export const MAP_STATIONS: readonly (readonly [string, number, number, number, number, number])[] = [
${stationRows}
]

export const MAP_LINES: readonly { id: string; color: string; d: string }[] = [
${lineRows}
]
`)
  console.log(`wrote ${OUTPUT}: ${names.length} stations, ${edges.length} sections, ${width}×${height}`)
}

main()
