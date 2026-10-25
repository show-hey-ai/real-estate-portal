import assert from 'node:assert/strict'
import test from 'node:test'
import { escalations, listingQualityIssues, mergeIssueHistory } from '../src/lib/listing-quality'

const photo = (name: string, category: string) => ({ url: `https://x/${name}.jpg`, category, sortOrder: 0 })
const good = {
  sourcePropertyId: '100', descriptionJa: 'パークタワー東中野。70㎡', descriptionEn: 'Park Tower Higashi-Nakano: 70 m² near Shinsen Station (Keio Inokashira Line).',
  stations: [{ name: '神泉', name_en: '神泉', line: '京王井の頭線' }], media: [photo('facade', 'EXTERIOR'), photo('living', 'INTERIOR'), photo('plan', 'FLOORPLAN')],
}

test('a clean listing has no issues', () => {
  assert.deepEqual(listingQualityIssues(good), [])
})

test('Japanese left on English pages and kana names without an English name are reported', () => {
  const types = (overrides: object) => listingQualityIssues({ ...good, ...overrides }).map((issue) => issue.type)
  assert.deepEqual(types({ descriptionEn: 'シティプラザ若林: 16.73 m², 1R.' }), ['en-japanese', 'zh-kana-name'])
  assert.deepEqual(types({ stations: [{ name: '未知駅', name_en: null, line: null }] }), ['station-untranslated', 'station-not-listed'])
  assert.equal(listingQualityIssues({ ...good, stations: [{ name: '未知駅', name_en: 'Michi', line: null }] }).find((issue) => issue.type === 'station-not-listed')?.optional, true)
  assert.deepEqual(types({ descriptionEn: 'A condominium unit near Shinsen Station.' }), ['zh-kana-name'])
})

test('weak covers and thin galleries are reported as optional', () => {
  const issues = listingQualityIssues({ ...good, media: [photo('upper-facade', 'EXTERIOR'), photo('plan', 'FLOORPLAN')] })
  assert.deepEqual(issues.map((issue) => [issue.type, issue.optional]), [['weak-cover', true], ['few-photos', true]])
})

test('issue history keeps first-seen dates and only required issues older than 14 days need a decision', () => {
  const now = new Date('2026-11-09T00:00:00Z')
  const history = mergeIssueHistory({ '100:en-japanese': '2026-10-20T00:00:00.000Z', '200:en-japanese': '2026-10-01T00:00:00.000Z' }, ['100:en-japanese', '100:weak-cover', '300:zh-kana-name'], now)
  assert.deepEqual(history, { '100:en-japanese': '2026-10-20T00:00:00.000Z', '100:weak-cover': now.toISOString(), '300:zh-kana-name': now.toISOString() })
  const old = { '100:en-japanese': '2026-10-20T00:00:00.000Z', '100:weak-cover': '2026-10-01T00:00:00.000Z' }
  assert.deepEqual(escalations(old, now), ['100:en-japanese'])
})
