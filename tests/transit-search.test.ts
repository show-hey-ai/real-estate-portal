import assert from 'node:assert/strict'
import test from 'node:test'
import { canonicalSearchQuery } from '../src/lib/listing-search'
import { countMatches, effectiveStations, initialSelection, isLineSelected, listingsHref, toggleLine, toggleStation } from '../src/lib/transit/picker-state'
import { buildTransitIndex, matchesStationSelection, parseStationSelection, selectedStations, selectionLabel, transitLabels, transitOptions } from '../src/lib/transit/search'

const rows = [
  { stations: [{ name: '渋谷', walk_minutes: 5 }, { name: '神泉', walk_minutes: 9 }] },
  { stations: [{ name: '恵比寿', walk_minutes: 12 }] },
  { stations: [{ name: '浅草', walk_minutes: 3 }] },
  { stations: [{ name: '東伏見', walk_minutes: 2 }] },
]

test('search values hold station slugs and line ids, and unknown ones are dropped', () => {
  const selection = parseStationSelection('shibuya,nowhere,ebisu', 'metro-ginza,nope')
  assert.deepEqual(selection.stations, ['渋谷', '恵比寿'])
  assert.deepEqual(selection.lines.map((line) => line.id), ['metro-ginza'])
  assert.deepEqual(parseStationSelection('Shibuya;drop table', null), { stations: [], lines: [] })
  assert.ok(selectedStations(selection).has('浅草'))
})

test('a listing matches when a selected station is near, within the walk limit when one is set', () => {
  const selected = selectedStations(parseStationSelection('ebisu', null))
  assert.equal(matchesStationSelection(rows[1].stations, selected, null), true)
  assert.equal(matchesStationSelection(rows[1].stations, selected, 10), false)
  assert.equal(matchesStationSelection(rows[0].stations, selected, null), false)
})

test('labels read naturally in titles and chips', () => {
  assert.equal(selectionLabel(parseStationSelection('shibuya,ebisu', null), 'ja'), '渋谷・恵比寿')
  assert.equal(selectionLabel(parseStationSelection('shibuya,ebisu,meguro', 'jr-yamanote'), 'en'), 'JR Yamanote Line, Shibuya +2')
  assert.equal(selectionLabel(parseStationSelection(null, null), 'ja'), null)
  assert.deepEqual(transitLabels(parseStationSelection('shibuya', 'metro-ginza'), 'ja'), { 'metro-ginza': '東京メトロ銀座線', shibuya: '渋谷' })
})

test('saved searches keep valid station and line values only', () => {
  assert.equal(canonicalSearchQuery(new URLSearchParams('stations=shibuya,ebisu&lines=metro-ginza&walkMax=10')), 'stations=shibuya%2Cebisu&lines=metro-ginza&walkMax=10')
  assert.equal(canonicalSearchQuery(new URLSearchParams('stations=<script>&lines=a,,b')), '')
})

test('the index counts listings per station and line, and lists only lines with listings as options', () => {
  const index = buildTransitIndex(rows, 'ja')
  const station = (slug: string) => index.stations.find((item) => item.slug === slug)!
  assert.equal(station('shibuya').count, 1)
  assert.equal(station('shibuya').alt, 'Shibuya')
  assert.equal(index.lines.find((line) => line.id === 'keio-inokashira')!.count, 1)
  assert.equal(index.lines.find((line) => line.id === 'metro-ginza')!.count, 2)
  const options = transitOptions(index)
  assert.ok(options.lines.every((line) => line.count > 0 && line.stations.every((item) => item.count > 0)))
  assert.equal(index.lines.find((line) => line.id === 'metro-marunouchi')!.branches.length, 1)
})

test('the picker selects whole lines, keeps the rest of a line when one station is cleared, and builds the URL', () => {
  const index = buildTransitIndex(rows, 'ja')
  const position = (slug: string) => index.stations.findIndex((item) => item.slug === slug)
  let selection = initialSelection(index, 'ebisu', 'metro-ginza')
  assert.ok(selection.stations.has(position('ebisu')))
  assert.ok(isLineSelected(index, selection, 'metro-ginza'))
  assert.equal(countMatches(index, effectiveStations(index, selection), null), 3)
  assert.equal(countMatches(index, effectiveStations(index, selection), 10), 2)

  selection = toggleStation(index, selection, position('asakusa'))
  assert.equal(selection.lines.has('metro-ginza'), false)
  assert.equal(effectiveStations(index, selection).has(position('asakusa')), false)
  assert.ok(effectiveStations(index, selection).has(position('shibuya')))

  selection = toggleLine(index, toggleLine(index, selection, 'metro-ginza'), 'metro-ginza')
  assert.equal(isLineSelected(index, selection, 'metro-ginza'), false)
  assert.equal(listingsHref(index, toggleLine(index, selection, 'metro-ginza'), 10, 'priceMax=50000000&page=3&line=x'), '/listings?priceMax=50000000&stations=ebisu&lines=metro-ginza&walkMax=10')
})
