const blocksIndexing = (value: string) => /\b(?:noindex|none)\b/i.test(value)

/** A page heavier than this fails its check (and the check never holds more in memory). */
export const PAGE_MAX_BYTES = 2_000_000
/** Google reads sitemaps up to 50 MB uncompressed; the portal's passed 2 MB with the station pages. */
export const SITEMAP_MAX_BYTES = 50 * 1024 * 1024

/** Reads a response body, stopping once it passes maxBytes. */
export async function readBodyWithin(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<{ text: string; withinLimit: boolean }> {
  const reader = body?.getReader()
  if (!reader) return { text: '', withinLimit: false }
  const chunks: Uint8Array[] = []
  let size = 0
  while (size <= maxBytes) {
    const next = await reader.read()
    if (next.done) break
    chunks.push(next.value)
    size += next.value.length
  }
  await reader.cancel()
  return { text: Buffer.concat(chunks).toString('utf8'), withinLimit: size <= maxBytes }
}

export function isPageIndexable(body: string, robotsHeader: string | null) {
  if (robotsHeader && blocksIndexing(robotsHeader)) return false
  for (const tag of body.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = new Map([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)]
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]))
    if (/^(?:robots|googlebot|bingbot)$/i.test(attributes.get('name') ?? '') && blocksIndexing(attributes.get('content') ?? '')) return false
  }
  return true
}
