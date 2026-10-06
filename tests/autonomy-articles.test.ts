import assert from 'node:assert/strict'
import test from 'node:test'
import { generateArticleContent, sourceFingerprint, type ArticleSource } from '../src/lib/autonomy/article-content'

const rows: ArticleSource[] = [10_000_000, 20_000_000, 30_000_000].map((price, index) => ({ id: `source-${index}`, city: '目黒区', propertyType: '区分マンション', price: BigInt(price), buildingArea: 40 + index, builtYear: 2000 + index, updatedAt: new Date('2026-10-02T00:00:00Z') }))

test('articles use observed asking prices in four languages without asserting market-wide or realized returns', () => {
  const content = generateArticleContent('目黒区', rows, new Date('2026-10-02T00:00:00Z'))
  assert.deepEqual(Object.keys(content).sort(), ['en', 'ja', 'zh-CN', 'zh-TW'])
  const expected = { en: ['10,000,000', '30,000,000', '20,000,000'], ja: ['1,000万円', '3,000万円', '2,000万円'], 'zh-TW': ['1,000萬日圓', '3,000萬日圓', '2,000萬日圓'], 'zh-CN': ['1,000万日元', '3,000万日元', '2,000万日元'] } as const
  for (const [locale, article] of Object.entries(content)) {
    const [low, high, median] = expected[locale as keyof typeof expected]
    assert.equal(article.sections.length, 3)
    assert.ok(article.description.includes(low))
    assert.ok(article.description.includes(high))
    assert.ok(article.sections[0].paragraphs[0].includes(median))
  }
  assert.match(content.en.notice, /dated snapshot/)
  assert.match(content.en.sections[0].paragraphs[1], /asking prices/)
})

test('insufficient or mixed sources do not generate indexable content; changing facts invalidates a snapshot', () => {
  assert.throws(() => generateArticleContent('目黒区', rows.slice(0, 2)))
  assert.throws(() => generateArticleContent('目黒区', [{ ...rows[0], city: '港区' }, ...rows.slice(1)]))
  assert.equal(sourceFingerprint(rows), sourceFingerprint([...rows].reverse()))
  assert.notEqual(sourceFingerprint(rows), sourceFingerprint([{ ...rows[0], price: BigInt(90_000_000) }, ...rows.slice(1)]))
})

test('article snapshot dates use Tokyo midnight rather than the UTC day', () => {
  const content = generateArticleContent('目黒区', rows, new Date('2026-10-02T00:30:00+09:00'))
  assert.ok(content.en.sections[0].paragraphs[0].includes('2026-10-02'))
})
