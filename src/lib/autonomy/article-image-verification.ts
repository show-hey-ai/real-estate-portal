import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { articleHeroSchema } from './editorial-policy'

export async function checkArticleImage(path: string, origin: string, request: typeof fetch = fetch) {
  const valid = articleHeroSchema.shape.url.safeParse(path)
  if (!valid.success) return { url: path, ok: false }
  const url = new URL(path, origin)
  try {
    const response = await request(url, { cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Ziyou-Autonomy-Health/1.0' } })
    const mime = response.headers.get('content-type')?.split(';')[0]
    if (!response.ok || !['image/webp', 'image/png'].includes(mime || '')) { await response.body?.cancel(); return { url: url.href, status: response.status, ok: false } }
    const reader = response.body?.getReader()
    if (!reader) return { url: url.href, ok: false }
    const chunks: Uint8Array[] = []
    let bytes = 0
    while (true) {
      const next = await reader.read()
      if (next.done) break
      bytes += next.value.length
      if (bytes > 2_000_000) { await reader.cancel(); return { url: url.href, ok: false } }
      chunks.push(next.value)
    }
    const image = Buffer.concat(chunks)
    const decoded = sharp(image, { failOn: 'warning', limitInputPixels: 4096 * 4096 })
    const metadata = await decoded.metadata()
    await decoded.stats() // Complete pixel decoding rejects truncated files with intact headers.
    const sha256 = createHash('sha256').update(image).digest('hex')
    const expected = /-([a-f0-9]{12})\.(?:webp|png)$/.exec(path)?.[1]
    return { url: url.href, status: response.status, bytes, sha256, width: metadata.width, height: metadata.height, ok: !!metadata.width && !!metadata.height && metadata.width >= 100 && metadata.height >= 100 && metadata.width <= 4096 && metadata.height <= 4096 && metadata.format === path.split('.').at(-1) && (!expected || sha256.startsWith(expected)) }
  } catch { return { url: url.href, ok: false } }
}
