import assert from 'node:assert/strict'
import test from 'node:test'
import { CHECKLIST_IDS, overseasBuyingCopy, overseasBuyingFor } from '../src/content/overseas-buying'
import { formatProgress } from '../src/lib/progress-text'

const locales = Object.keys(overseasBuyingCopy) as (keyof typeof overseasBuyingCopy)[]

test('every language has the same checklist items in the same order, so saved ticks survive a language switch', () => {
  for (const locale of locales) {
    const ids = overseasBuyingCopy[locale].groups.flatMap((group) => group.items.map((item) => item.id))
    assert.deepEqual(ids, [...CHECKLIST_IDS], locale)
    assert.deepEqual(overseasBuyingCopy[locale].groups.map((group) => group.id), ['before', 'remit', 'after'], locale)
  }
})

test('every language has the same structure and the same official sources', () => {
  const base = overseasBuyingCopy.ja
  for (const locale of locales) {
    const copy = overseasBuyingCopy[locale]
    assert.equal(copy.flow.length, base.flow.length, locale)
    assert.equal(copy.settlementOptions.length, base.settlementOptions.length, locale)
    assert.equal(copy.remitPoints.length, base.remitPoints.length, locale)
    assert.equal(copy.faq.length, base.faq.length, locale)
    assert.deepEqual(copy.sources.map((source) => source.url), base.sources.map((source) => source.url), locale)
    for (const source of copy.sources) assert.match(source.url, /^https:\/\/(www\.)?(moj|nta|boj|mof)\.go\.jp\/|^https:\/\/www\.boj\.or\.jp\/|^https:\/\/www\.retpc\.jp\//)
    const links = copy.groups.flatMap((group) => group.items.flatMap((item) => (item.href ? [item.href] : [])))
    assert.deepEqual(links, base.groups.flatMap((group) => group.items.flatMap((item) => (item.href ? [item.href] : []))), locale)
  }
})

test('the key figures appear in every language', () => {
  for (const locale of locales) {
    const text = JSON.stringify(overseasBuyingCopy[locale])
    const thirtyMillion = locale === 'en' ? '30 million' : '3,000'
    for (const figure of ['10.21%', '20.42%', thirtyMillion, '20']) assert.ok(text.includes(figure), `${locale}: ${figure}`)
  }
})

test('the copy never promises results or suggests we hold the money', () => {
  for (const locale of locales) {
    const text = JSON.stringify(overseasBuyingCopy[locale])
    assert.doesNotMatch(text, /guarantee|保証します|保證|保证收益|必ず儲/i, locale)
    assert.ok(overseasBuyingCopy[locale].noHoldingTitle.length > 0, locale)
  }
})

test('unknown languages fall back to English and progress text counts correctly', () => {
  assert.equal(overseasBuyingFor('fr'), overseasBuyingCopy.en)
  assert.equal(formatProgress(overseasBuyingCopy.en.progress, 3, 17), '3 of 17 done')
  assert.equal(formatProgress(overseasBuyingCopy.ja.progress, 3, 17), '17項目中 3項目 完了')
})
