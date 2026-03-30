import { execFileSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createId } from '@paralleldrive/cuid2'
import { prisma } from '../src/lib/db'

const WARD_NAMES = [
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

const DATASET_LABEL = 'MLIT N02 2024 + N03 2024-01-01'
const N02_URL = 'https://nlftp.mlit.go.jp/ksj/gml/data/N02/N02-24/N02-24_GML.zip'
const N02_STATION_PATH = 'UTF-8/N02-24_Station.geojson'
const N03_URL = 'https://nlftp.mlit.go.jp/ksj/gml/data/N03/N03-2024/N03-20240101_13_GML.zip'
const N03_PATH = 'N03-20240101_13.geojson'

type PolygonGeometry = {
  type: 'Polygon'
  coordinates: number[][][]
}

type MultiPolygonGeometry = {
  type: 'MultiPolygon'
  coordinates: number[][][][]
}

type StationGeometry = {
  type: 'Point' | 'LineString'
  coordinates: number[] | number[][]
}

type WardFeature = {
  properties: {
    N03_001?: string | null
    N03_004?: string | null
  }
  geometry: PolygonGeometry | MultiPolygonGeometry
}

type StationFeature = {
  properties: {
    N02_003: string
    N02_004: string
    N02_005: string
    N02_005c?: string
    N02_005g?: string
  }
  geometry: StationGeometry
}

type GeoJson<TFeature> = {
  features: TFeature[]
}

type BoundingBox = {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

type WardShape = {
  ward: string
  geometry: PolygonGeometry | MultiPolygonGeometry
  bbox: BoundingBox
}

type SourceStationSeed = {
  operatorNameJa: string
  sourceLineName: string
  sourceStationName: string
  sourceStationCode?: string
  sourceGroupCode?: string
  ward: string
}

type MasterLineRecord = {
  id: string
  canonicalName: string
  displayNameJa: string
  operatorNameJa: string | null
  sourceLineName: string | null
  sourceDataset: string
  sortOrder: number
  isActive: boolean
}

type MasterStationRecord = {
  id: string
  lineId: string
  canonicalName: string
  displayNameJa: string
  ward: string
  sourceStationName: string | null
  sourceStationCode: string | null
  sourceGroupCode: string | null
  sortOrder: number
  isActive: boolean
}

const EXACT_CANONICAL_LINE_MAP: Record<string, string> = {
  'ゆりかもめ::東京臨海新交通臨海線': 'ゆりかもめ',
  '京成電鉄::押上線': '京成押上線',
  '京成電鉄::本線': '京成本線',
  '京浜急行電鉄::本線': '京急本線',
  '京浜急行電鉄::空港線': '京急空港線',
  '京王電鉄::井の頭線': '京王井の頭線',
  '京王電鉄::京王線': '京王線',
  '小田急電鉄::小田原線': '小田急小田原線',
  '東京モノレール::東京モノレール羽田線': '東京モノレール羽田空港線',
  '東京地下鉄::11号線半蔵門線': '東京メトロ半蔵門線',
  '東京地下鉄::13号線副都心線': '東京メトロ副都心線',
  '東京地下鉄::2号線日比谷線': '東京メトロ日比谷線',
  '東京地下鉄::3号線銀座線': '東京メトロ銀座線',
  '東京地下鉄::4号線丸ノ内線': '東京メトロ丸ノ内線',
  '東京地下鉄::5号線東西線': '東京メトロ東西線',
  '東京地下鉄::7号線南北線': '東京メトロ南北線',
  '東京地下鉄::8号線有楽町線': '東京メトロ有楽町線',
  '東京地下鉄::9号線千代田線': '東京メトロ千代田線',
  '東京臨海高速鉄道::臨海副都心線': 'りんかい線',
  '東京都::10号線新宿線': '都営新宿線',
  '東京都::12号線大江戸線': '都営大江戸線',
  '東京都::1号線浅草線': '都営浅草線',
  '東京都::6号線三田線': '都営三田線',
  '東京都::荒川線': '都電荒川線',
  '東急電鉄::大井町線': '東急大井町線',
  '東急電鉄::東急多摩川線': '東急多摩川線',
  '東急電鉄::東横線': '東急東横線',
  '東急電鉄::池上線': '東急池上線',
  '東急電鉄::田園都市線': '東急田園都市線',
  '東急電鉄::目黒線': '東急目黒線',
  '東日本旅客鉄道::中央線': 'JR中央線',
  '東日本旅客鉄道::京葉線': 'JR京葉線',
  '東日本旅客鉄道::山手線': 'JR山手線',
  '東日本旅客鉄道::総武線': 'JR総武線',
  '東日本旅客鉄道::赤羽線': 'JR埼京線',
  '東武鉄道::亀戸線': '東武亀戸線',
  '東武鉄道::伊勢崎線': '東武伊勢崎線',
  '東武鉄道::東上本線': '東武東上線',
  '東海旅客鉄道::東海道新幹線': '東海道新幹線',
  '東日本旅客鉄道::東北新幹線': '東北新幹線',
  '西武鉄道::新宿線': '西武新宿線',
  '西武鉄道::池袋線': '西武池袋線',
  '首都圏新都市鉄道::常磐新線': 'つくばエクスプレス',
}

const STATION_NAME_ALIASES: Record<string, string> = {
  市ヶ谷: '市ケ谷',
  とうきょうスカイツリー: '東京スカイツリー',
}

function canonicalizeStationName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, '')
  return STATION_NAME_ALIASES[trimmed] ?? trimmed
}

function canonicalizeSourceLines(seed: SourceStationSeed): string[] {
  const key = `${seed.operatorNameJa}::${seed.sourceLineName}`
  const exact = EXACT_CANONICAL_LINE_MAP[key]
  if (exact) {
    return [exact]
  }

  if (key === '東日本旅客鉄道::東海道線') {
    if (seed.sourceStationName === '西大井') {
      return ['JR横須賀線']
    }

    if (seed.sourceStationName === '品川' || seed.sourceStationName === '東京') {
      return ['JR京浜東北線', 'JR東海道線', 'JR横須賀線']
    }

    return ['JR京浜東北線']
  }

  if (key === '東日本旅客鉄道::東北線') {
    return ['JR京浜東北線']
  }

  return [seed.sourceLineName]
}

async function downloadFile(url: string, filePath: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  await writeFile(filePath, Buffer.from(arrayBuffer))
}

function readGeoJsonFromZip<TFeature>(zipPath: string, innerPath: string): GeoJson<TFeature> {
  const contents = execFileSync('unzip', ['-p', zipPath, innerPath], {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 128,
  })
  return JSON.parse(contents) as GeoJson<TFeature>
}

function pointOnSegment(pointX: number, pointY: number, x1: number, y1: number, x2: number, y2: number) {
  const cross = (pointX - x1) * (y2 - y1) - (pointY - y1) * (x2 - x1)
  if (Math.abs(cross) > 1e-12) {
    return false
  }

  const dot = (pointX - x1) * (pointX - x2) + (pointY - y1) * (pointY - y2)
  return dot <= 0
}

function pointInRing(point: [number, number], ring: number[][]) {
  const [x, y] = point
  let inside = false

  for (let index = 0; index < ring.length; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[(index + 1) % ring.length]

    if (pointOnSegment(x, y, x1, y1, x2, y2)) {
      return true
    }

    const intersects = (y1 > y) !== (y2 > y)
    if (!intersects) {
      continue
    }

    const intersectionX = ((x2 - x1) * (y - y1)) / (y2 - y1) + x1
    if (x < intersectionX) {
      inside = !inside
    }
  }

  return inside
}

function pointInPolygon(point: [number, number], polygon: number[][][]) {
  if (!pointInRing(point, polygon[0])) {
    return false
  }

  for (const hole of polygon.slice(1)) {
    if (pointInRing(point, hole)) {
      return false
    }
  }

  return true
}

function pointInGeometry(point: [number, number], geometry: PolygonGeometry | MultiPolygonGeometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates)
  }

  return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon))
}

function bboxOfGeometry(geometry: PolygonGeometry | MultiPolygonGeometry): BoundingBox {
  const coordinates: number[][] = []

  if (geometry.type === 'Polygon') {
    for (const ring of geometry.coordinates) {
      coordinates.push(...ring)
    }
  } else {
    for (const polygon of geometry.coordinates) {
      for (const ring of polygon) {
        coordinates.push(...ring)
      }
    }
  }

  const xs = coordinates.map(([x]) => x)
  const ys = coordinates.map(([, y]) => y)

  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  }
}

function representativeStationPoint(geometry: StationGeometry): [number, number] {
  if (geometry.type === 'Point') {
    return geometry.coordinates as [number, number]
  }

  const coordinates = geometry.coordinates as number[][]
  return coordinates[Math.floor(coordinates.length / 2)] as [number, number]
}

function buildWardShapes(features: WardFeature[]): WardShape[] {
  return features
    .filter((feature) => feature.properties.N03_001 === '東京都')
    .map((feature) => ({
      ward: feature.properties.N03_004 ?? '',
      geometry: feature.geometry,
      bbox: bboxOfGeometry(feature.geometry),
    }))
    .filter((shape) => WARD_NAMES.includes(shape.ward as (typeof WARD_NAMES)[number]))
}

function resolveStationWard(point: [number, number], wardShapes: WardShape[]) {
  const [x, y] = point
  const matches = wardShapes
    .filter(({ bbox }) => x >= bbox.minX && x <= bbox.maxX && y >= bbox.minY && y <= bbox.maxY)
    .filter(({ geometry }) => pointInGeometry(point, geometry))
    .map(({ ward }) => ward)
    .sort((a, b) => a.localeCompare(b, 'ja'))

  return matches[0] ?? null
}

function extractSourceSeeds(stationFeatures: StationFeature[], wardShapes: WardShape[]): SourceStationSeed[] {
  const seeds: SourceStationSeed[] = []

  for (const feature of stationFeatures) {
    const ward = resolveStationWard(representativeStationPoint(feature.geometry), wardShapes)
    if (!ward) {
      continue
    }

    seeds.push({
      operatorNameJa: feature.properties.N02_004,
      sourceLineName: feature.properties.N02_003,
      sourceStationName: feature.properties.N02_005,
      sourceStationCode: feature.properties.N02_005c,
      sourceGroupCode: feature.properties.N02_005g,
      ward,
    })
  }

  return seeds
}

function buildMasterRecords(seeds: SourceStationSeed[]) {
  const lineMap = new Map<string, Omit<MasterLineRecord, 'id' | 'sortOrder'>>()
  const stationMap = new Map<string, Omit<MasterStationRecord, 'id' | 'lineId' | 'sortOrder'>>()

  for (const seed of seeds) {
    const canonicalStationName = canonicalizeStationName(seed.sourceStationName)
    const canonicalLines = [...new Set(canonicalizeSourceLines(seed))]

    for (const canonicalLineName of canonicalLines) {
      if (!lineMap.has(canonicalLineName)) {
        lineMap.set(canonicalLineName, {
          canonicalName: canonicalLineName,
          displayNameJa: canonicalLineName,
          operatorNameJa: seed.operatorNameJa,
          sourceLineName: seed.sourceLineName,
          sourceDataset: DATASET_LABEL,
          isActive: true,
        })
      }

      const stationKey = `${canonicalLineName}::${canonicalStationName}`
      if (!stationMap.has(stationKey)) {
        stationMap.set(stationKey, {
          canonicalName: canonicalStationName,
          displayNameJa: canonicalStationName,
          ward: seed.ward,
          sourceStationName: seed.sourceStationName,
          sourceStationCode: seed.sourceStationCode ?? null,
          sourceGroupCode: seed.sourceGroupCode ?? null,
          isActive: true,
        })
      }
    }
  }

  const sortedLines = [...lineMap.values()].sort((a, b) => a.displayNameJa.localeCompare(b.displayNameJa, 'ja'))
  const lineIdMap = new Map<string, string>()
  const lineRecords: MasterLineRecord[] = sortedLines.map((line, index) => {
    const id = createId()
    lineIdMap.set(line.canonicalName, id)

    return {
      id,
      ...line,
      sortOrder: index,
    }
  })

  const stationsByLine = new Map<string, Omit<MasterStationRecord, 'id' | 'lineId' | 'sortOrder'>[]>()
  for (const [key, station] of stationMap.entries()) {
    const [canonicalLineName] = key.split('::')
    const bucket = stationsByLine.get(canonicalLineName) ?? []
    bucket.push(station)
    stationsByLine.set(canonicalLineName, bucket)
  }

  const stationRecords: MasterStationRecord[] = []
  for (const line of lineRecords) {
    const stations = (stationsByLine.get(line.canonicalName) ?? [])
      .sort((a, b) => a.displayNameJa.localeCompare(b.displayNameJa, 'ja'))

    stations.forEach((station, index) => {
      stationRecords.push({
        id: createId(),
        lineId: line.id,
        ...station,
        sortOrder: index,
      })
    })
  }

  return { lineRecords, stationRecords }
}

async function main() {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'portal-transit-master-'))
  const n02ZipPath = path.join(tempDir, 'N02-24_GML.zip')
  const n03ZipPath = path.join(tempDir, 'N03-20240101_13_GML.zip')

  try {
    console.log('Downloading MLIT datasets...')
    await downloadFile(N02_URL, n02ZipPath)
    await downloadFile(N03_URL, n03ZipPath)

    console.log('Parsing ward boundaries...')
    const wardGeo = readGeoJsonFromZip<WardFeature>(n03ZipPath, N03_PATH)
    const wardShapes = buildWardShapes(wardGeo.features)

    console.log('Parsing station dataset...')
    const stationGeo = readGeoJsonFromZip<StationFeature>(n02ZipPath, N02_STATION_PATH)
    const seeds = extractSourceSeeds(stationGeo.features, wardShapes)
    const { lineRecords, stationRecords } = buildMasterRecords(seeds)

    console.log(`Prepared ${lineRecords.length} lines / ${stationRecords.length} stations`)

    await prisma.$transaction(async (tx) => {
      await tx.transitStationMaster.deleteMany()
      await tx.transitLineMaster.deleteMany()
      await tx.transitLineMaster.createMany({ data: lineRecords })
      await tx.transitStationMaster.createMany({ data: stationRecords })
    })

    console.log('Transit master tables synced successfully.')
  } finally {
    await rm(tempDir, { recursive: true, force: true })
    await prisma.$disconnect()
  }
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
