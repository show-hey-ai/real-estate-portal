import assert from 'node:assert/strict'
import test from 'node:test'
import { guideEnrichments } from '../src/content/guide-enrichments'
import { guideArticles } from '../src/content/guides'

test('every enrichment targets an existing guide, language and section', () => {
  for (const [slug, byLocale] of Object.entries(guideEnrichments)) {
    const article = guideArticles.find((item) => item.slug === slug)
    assert.ok(article, `unknown guide ${slug}`)
    for (const [locale, enrichment] of Object.entries(byLocale)) {
      const content = article.locales[locale as keyof typeof article.locales]
      assert.ok(content, `${slug} has no ${locale}`)
      for (const sectionId of Object.keys(enrichment?.sections ?? {})) {
        assert.ok(content.sections.some((section) => section.id === sectionId), `${slug}/${locale} has no section ${sectionId}`)
      }
    }
  }
})

test('enriched tables have one cell per header and sources are https links', () => {
  for (const article of guideArticles) {
    for (const content of Object.values(article.locales)) {
      for (const section of content.sections) {
        for (const row of section.table?.rows ?? []) assert.equal(row.length, section.table!.headers.length, `${article.slug}/${section.id}`)
      }
      for (const source of content.sources ?? []) assert.match(source.url, /^https:\/\//)
    }
  }
})

test('every language of an enriched guide gets the same tables and examples', () => {
  for (const [slug, byLocale] of Object.entries(guideEnrichments)) {
    const shapes = Object.values(byLocale).map((enrichment) => JSON.stringify(Object.entries(enrichment?.sections ?? {}).map(([id, extra]) => [id, Boolean(extra.table), Boolean(extra.example)])))
    assert.equal(new Set(shapes).size, 1, slug)
  }
})

test('illustrative cases exist in every language of their guide', async () => {
  const { guideCases } = await import('../src/content/guide-cases')
  for (const [slug, byLocale] of Object.entries(guideCases)) {
    assert.ok(guideArticles.some((item) => item.slug === slug), `unknown guide ${slug}`)
    const counts = Object.values(byLocale).map((cases) => cases?.length)
    assert.equal(Object.keys(byLocale).length, 4, slug)
    assert.equal(new Set(counts).size, 1, slug)
  }
})
