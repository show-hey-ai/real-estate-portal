import assert from 'node:assert/strict'
import test from 'node:test'
import { STATIONS, TRANSIT_LINES, lineNeighbours, lineStations, linesOfStation, listingStations, resolveLine, resolveStation, stationFromSlug } from '../src/lib/transit'
import { MAP_LINES, MAP_STATIONS, MAP_VIEWBOX } from '../src/lib/transit/map-layout.generated'
import { translateStationName } from '../src/lib/translate-fields'
import { WARD_SLUGS } from '../src/lib/ward-tile-map'

test('every station on every line has its ward, position and URL slug', () => {
  for (const line of TRANSIT_LINES) {
    for (const station of lineStations(line)) {
      const facts = STATIONS[station]
      assert.ok(facts, `${line.ja}: ${station}`)
      assert.ok(WARD_SLUGS[facts.ward], `${station} ward ${facts.ward}`)
      assert.match(facts.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, station)
    }
    if (line.loopTo) assert.ok(line.stations.includes(line.loopTo), line.ja)
    for (const branch of line.branches ?? []) assert.ok(line.stations.includes(branch.from), line.ja)
  }
})

test('line ids and station slugs are unique and lead back to the same entry', () => {
  assert.equal(new Set(TRANSIT_LINES.map((line) => line.id)).size, TRANSIT_LINES.length)
  for (const [name, { slug }] of Object.entries(STATIONS)) assert.equal(stationFromSlug(slug), name)
})

test('listing station names find the station however they are written', () => {
  assert.equal(resolveStation('市ヶ谷'), '市ケ谷')
  assert.equal(resolveStation('大森駅'), '大森')
  assert.equal(resolveStation('押上〈スカイツリー前〉'), '押上')
  assert.equal(resolveStation('雪ヶ谷大塚'), '雪が谷大塚')
  assert.equal(resolveStation('東京スカイツリー'), 'とうきょうスカイツリー')
  assert.equal(resolveStation('東伏見'), null)
  assert.equal(resolveStation(''), null)
})

test('listing line names find the line', () => {
  assert.equal(resolveLine('JR山手線')?.id, 'jr-yamanote')
  assert.equal(resolveLine('ＪＲ埼京線')?.id, 'jr-saikyo')
  assert.equal(resolveLine('東京地下鉄丸ノ内線')?.id, 'metro-marunouchi')
  assert.equal(resolveLine('丸ノ内線')?.id, 'metro-marunouchi')
  assert.equal(resolveLine('京浜急線')?.id, 'keikyu-main')
  assert.equal(resolveLine('小田急線')?.id, 'odakyu')
  assert.equal(resolveLine('東京都大江戸線')?.id, 'toei-oedo')
  assert.equal(resolveLine('不明線'), null)
})

test('a transfer station belongs to every line that stops there', () => {
  const lines = linesOfStation('渋谷').map((line) => line.id)
  for (const id of ['jr-yamanote', 'metro-ginza', 'metro-hanzomon', 'metro-fukutoshin', 'tokyu-toyoko', 'tokyu-den-en-toshi', 'keio-inokashira']) assert.ok(lines.includes(id), id)
  assert.ok(linesOfStation('方南町').some((line) => line.id === 'metro-marunouchi'))
})

test('a listing counts each nearby 23-ward station once, with its shortest walk', () => {
  assert.deepEqual(
    listingStations([
      { name: '渋谷', line: 'JR山手線', walk_minutes: 8 },
      { name: '渋谷駅', line: '東急東横線', walk_minutes: 6 },
      { name: '神泉', line: '京王井の頭線', walk_minutes: null },
      { name: '東伏見', line: '西武新宿線', walk_minutes: 3 },
      null,
    ]),
    [{ station: '渋谷', walkMinutes: 6 }, { station: '神泉', walkMinutes: null }],
  )
  assert.deepEqual(listingStations(null), [])
})

test('station English names are found for every spelling', () => {
  assert.equal(translateStationName('市ヶ谷', 'en'), 'Ichigaya')
  assert.equal(translateStationName('大森駅', 'en'), 'Omori')
  assert.equal(translateStationName('扇大橋', 'en'), 'Ogi-Ohashi')
  assert.equal(translateStationName('渋谷', 'ja'), '渋谷')
})

test('neighbouring stations follow loops and spurs', () => {
  const line = (id: string) => TRANSIT_LINES.find((item) => item.id === id)!
  assert.deepEqual(lineNeighbours(line('jr-yamanote'), '東京'), ['有楽町', '神田'])
  assert.deepEqual(lineNeighbours(line('toei-oedo'), '都庁前').sort(), ['新宿', '新宿西口', '西新宿五丁目'].sort())
  assert.deepEqual(lineNeighbours(line('metro-marunouchi'), '中野坂上').sort(), ['中野新橋', '新中野', '西新宿'].sort())
  assert.deepEqual(lineNeighbours(line('jr-keiyo'), '東京'), ['八丁堀'])
})

test('the route map draws every station once and every line', () => {
  assert.deepEqual(new Set(MAP_STATIONS.map(([slug]) => slug)), new Set(Object.values(STATIONS).map(({ slug }) => slug)))
  assert.equal(MAP_STATIONS.length, Object.keys(STATIONS).length)
  for (const [slug, x, y] of MAP_STATIONS) assert.ok(x > 0 && x < MAP_VIEWBOX.width && y > 0 && y < MAP_VIEWBOX.height, slug)
  assert.deepEqual(MAP_LINES.map((line) => line.id), TRANSIT_LINES.map((line) => line.id))
  assert.ok(MAP_LINES.every((line) => line.d.startsWith('M')))
})
