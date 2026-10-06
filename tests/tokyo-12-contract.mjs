import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const expectedWards = [
  '千代田区',
  '中央区',
  '港区',
  '新宿区',
  '渋谷区',
  '文京区',
  '品川区',
  '豊島区',
  '台東区',
  '墨田区',
  '江東区',
  '大田区',
  '目黒区',
  '世田谷区',
  '中野区',
  '杉並区',
  '北区',
  '荒川区',
  '板橋区',
  '練馬区',
  '足立区',
  '葛飾区',
  '江戸川区',
]

function read(path) {
  return readFileSync(join(root, path), 'utf8')
}

function quotedValues(source, declaration) {
  const match = source.match(new RegExp(`${declaration}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as const`))
  assert.ok(match, `missing ${declaration}`)
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}

test('residential import and public search include all 23 Tokyo wards', () => {
  assert.deepEqual(quotedValues(read('src/lib/public-search.ts'), 'TOKYO_23_WARDS'), expectedWards)
  assert.deepEqual(quotedValues(read('scripts/process-openai-vision.ts'), 'TOKYO_23KU'), expectedWards)
  assert.deepEqual(quotedValues(read('scripts/sync-transit-master.ts'), 'WARD_NAMES'), expectedWards)

  const reinsConfig = JSON.parse(read('scripts/reins-config.json'))
  assert.deepEqual(reinsConfig.targetArea.include, expectedWards)
  assert.deepEqual(reinsConfig.targetArea.exclude, [])
  assert.equal(reinsConfig.searchPatterns.find((pattern) => pattern.conditions.propertyType === '区分マンション')?.enabled, true)
  assert.equal(reinsConfig.searchPatterns.find((pattern) => pattern.conditions.propertyType === '一棟ビル')?.enabled, false)
})

test('public labels consistently describe all 23 wards', () => {
  const expectedLabels = {
    en: 'All 23 Tokyo wards',
    ja: '東京23区すべて',
    'zh-CN': '东京23区全部',
    'zh-TW': '東京23區全部',
  }

  for (const [locale, expectedLabel] of Object.entries(expectedLabels)) {
    const messages = JSON.parse(read(`messages/${locale}.json`))
    assert.equal(messages.search.allTokyo23Wards, expectedLabel)
    assert.equal(Object.hasOwn(messages.search, 'allTokyo12Wards'), false)
  }
})

test('current documentation does not call the residential focus area 12 wards', () => {
  const sources = [
    read('../chatgpt.md'),
    read('README.md'),
    read('src/content/guides.ts'),
    read('scripts/reins-config.json'),
  ].join('\n')

  const retiredAreaLabel = /都心13区|重点13区|Tokyo 13 Wards|13 Focus Wards|都心13區|重點13區/
  assert.equal(retiredAreaLabel.test(sources), false)
  assert.match(read('README.md'), /東京23区/)
})
