import test from 'node:test'
import assert from 'node:assert/strict'
import sharp from 'sharp'
import { createHash } from 'node:crypto'
import { checkArticleImage } from '../src/lib/autonomy/article-image-verification'

test('decoded same-origin image must match its immutable filename', async () => {
  const image = await sharp({ create: { width: 120, height: 120, channels: 3, background: '#213f61' } }).webp().toBuffer()
  const hash = createHash('sha256').update(image).digest('hex')
  const request = (async (url: URL | RequestInfo) => { assert.equal(new URL(String(url)).origin, 'https://portal.ziyou-fudosan.com'); return new Response(new Uint8Array(image), { headers: { 'content-type': 'image/webp' } }) }) as typeof fetch
  assert.equal((await checkArticleImage(`/images/articles/guide-${hash.slice(0,12)}.webp`, 'https://portal.ziyou-fudosan.com', request)).ok, true)
  assert.equal((await checkArticleImage('/images/articles/guide-000000000000.webp', 'https://portal.ziyou-fudosan.com', request)).ok, false)
})
test('missing, invalid, oversized or remote images fail verification', async () => {
  for (const response of [new Response('', {status:404}), new Response('bad image', {headers:{'content-type':'image/webp'}}), new Response(new Uint8Array(2_000_001), {headers:{'content-type':'image/webp'}})]) {
    assert.equal((await checkArticleImage('/images/articles/guide.webp', 'https://portal.ziyou-fudosan.com', (async () => response) as typeof fetch)).ok, false)
  }
  assert.equal((await checkArticleImage('https://external.test/image.webp', 'https://portal.ziyou-fudosan.com')).ok, false)
})

test('a truncated image with a readable header is not publishable', async () => {
 const full = await sharp({create:{width:120,height:120,channels:3,background:'#ffffff'}}).png().toBuffer()
 const broken = full.subarray(0,80)
 const hash = createHash('sha256').update(broken).digest('hex')
 const request = (async () => new Response(new Uint8Array(broken), {headers:{'content-type':'image/png'}})) as typeof fetch
 assert.equal((await checkArticleImage(`/images/articles/broken-${hash.slice(0,12)}.png`, 'https://portal.ziyou-fudosan.com', request)).ok, false)
})
