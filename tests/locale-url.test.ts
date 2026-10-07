import assert from 'node:assert/strict'
import test from 'node:test'
import { isLocale, localeAlternates, localizedPath, localizedSitemapUrls } from '../src/lib/locale-url'

process.env.NEXT_PUBLIC_SITE_URL = 'https://portal.example.com'

test('English keeps the plain path and other languages add ?lang=', () => {
  assert.equal(localizedPath('/listings', 'en'), '/listings')
  assert.equal(localizedPath('/listings', 'ja'), '/listings?lang=ja')
  assert.equal(localizedPath('/listings?ward=港区', 'zh-TW'), '/listings?ward=港区&lang=zh-TW')
  assert.equal(localizedPath('/listings', 'fr'), '/listings')
})

test('only supported languages are accepted', () => {
  assert.equal(isLocale('zh-CN'), true)
  assert.equal(isLocale('zh'), false)
  assert.equal(isLocale(null), false)
})

test('alternates point the canonical at the rendered language and list every version', () => {
  const alternates = localeAlternates('/listings/abc', 'ja')
  assert.equal(alternates.canonical, 'https://portal.example.com/listings/abc?lang=ja')
  assert.deepEqual(alternates.languages, {
    ja: 'https://portal.example.com/listings/abc?lang=ja',
    en: 'https://portal.example.com/listings/abc',
    'zh-Hant': 'https://portal.example.com/listings/abc?lang=zh-TW',
    'zh-Hans': 'https://portal.example.com/listings/abc?lang=zh-CN',
    'x-default': 'https://portal.example.com/listings/abc',
  })
})

test('the sitemap lists one URL per language, each with the same alternates', () => {
  const entries = localizedSitemapUrls('/help')
  assert.equal(entries.length, 4)
  assert.deepEqual(entries.map((entry) => entry.url).sort(), [
    'https://portal.example.com/help',
    'https://portal.example.com/help?lang=ja',
    'https://portal.example.com/help?lang=zh-CN',
    'https://portal.example.com/help?lang=zh-TW',
  ])
  assert.equal(new Set(entries.map((entry) => JSON.stringify(entry.languages))).size, 1)
})

test('sitemap alternates match the page head, including x-default for English', () => {
  const [entry] = localizedSitemapUrls('/help')
  assert.deepEqual(entry.languages, localeAlternates('/help', 'en').languages)
  assert.equal(entry.languages['x-default'], 'https://portal.example.com/help')
})
