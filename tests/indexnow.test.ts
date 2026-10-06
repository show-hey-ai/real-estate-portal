import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { INDEXNOW_KEY, buildIndexNowPayload } from '../src/lib/indexnow'

test('the IndexNow payload lists only this site\'s URLs, once each', () => {
  const payload = buildIndexNowPayload('https://portal.ziyou-fudosan.com', [
    'https://portal.ziyou-fudosan.com/listings/a',
    'https://portal.ziyou-fudosan.com/listings/a',
    'https://example.com/elsewhere',
    'not a url',
  ])
  assert.equal(payload.host, 'portal.ziyou-fudosan.com')
  assert.equal(payload.keyLocation, `https://portal.ziyou-fudosan.com/${INDEXNOW_KEY}.txt`)
  assert.deepEqual(payload.urlList, ['https://portal.ziyou-fudosan.com/listings/a'])
})

test('the key file served from the site root matches the key', () => {
  assert.equal(readFileSync(`public/${INDEXNOW_KEY}.txt`, 'utf8'), INDEXNOW_KEY)
})

test('only sitemap URLs changed since the last submission are sent', async () => {
  const { changedSitemapUrls } = await import('../src/lib/indexnow')
  const xml = '<urlset><url><loc>https://x.test/a?lang=ja&amp;b=1</loc><lastmod>2026-10-06T00:00:00.000Z</lastmod></url><url><loc>https://x.test/b</loc><lastmod>2026-10-01T00:00:00.000Z</lastmod></url><url><loc>https://x.test/c</loc></url></urlset>'
  assert.deepEqual(changedSitemapUrls(xml, null), ['https://x.test/a?lang=ja&b=1', 'https://x.test/b', 'https://x.test/c'])
  assert.deepEqual(changedSitemapUrls(xml, new Date('2026-10-03T00:00:00Z')), ['https://x.test/a?lang=ja&b=1', 'https://x.test/c'])
})
