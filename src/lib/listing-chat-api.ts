import { createHash } from 'node:crypto'
import { z } from 'zod'
import { answerListingQuestion, type ChatListingFacts } from './listing-chat'

const payloadSchema = z
  .object({
    message: z.string().trim().min(1).max(600),
    locale: z.enum(['ja', 'en', 'zh-TW', 'zh-CN']),
  })
  .strict()

/** Instance-local abuse control. No paid provider calls or shared conversation storage. */
export class ChatRateLimiter {
  private buckets = new Map<string, { start: number; count: number }>()
  constructor(
    private max = 12,
    private windowMs = 60_000,
    private clock = Date.now
  ) {}
  take(key: string) {
    const now = this.clock()
    let bucket = this.buckets.get(key)
    if (!bucket || now - bucket.start >= this.windowMs) {
      if (this.buckets.size >= 5000) {
        for (const [id, entry] of this.buckets)
          if (now - entry.start >= this.windowMs) this.buckets.delete(id)
        if (this.buckets.size >= 5000) return Math.ceil(this.windowMs / 1000)
      }
      bucket = { start: now, count: 0 }
      this.buckets.set(key, bucket)
    }
    if (bucket.count >= this.max)
      return Math.max(1, Math.ceil((bucket.start + this.windowMs - now) / 1000))
    bucket.count++
    return 0
  }
}

async function readJson(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return { status: 400 as const }
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 4096) {
        await reader.cancel()
        return { status: 413 as const }
      }
      chunks.push(value)
    }
    return { data: JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  } catch {
    return { status: 400 as const }
  } finally {
    reader.releaseLock()
  }
}

const response = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) =>
  Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  })

export function createListingChatHandler({
  getListing,
  limiter,
}: {
  getListing: (id: string) => Promise<ChatListingFacts | null>
  limiter: ChatRateLimiter
}) {
  return async (request: Request, listingId: string) => {
    if (!/^[a-zA-Z0-9_-]{1,80}$/u.test(listingId))
      return response({ error: 'invalid' }, 400)
    const origin = request.headers.get('origin')
    if (
      (origin && origin !== new URL(request.url).origin) ||
      request.headers.get('sec-fetch-site') === 'cross-site'
    )
      return response({ error: 'origin' }, 403)
    if (
      request.headers
        .get('content-type')
        ?.split(';')[0]
        .trim()
        .toLowerCase() !== 'application/json'
    )
      return response({ error: 'invalid' }, 415)
    const ip = (
      request.headers.get('x-vercel-forwarded-for') ||
      request.headers.get('x-forwarded-for') ||
      'unknown'
    )
      .split(',')[0]
      .trim()
      .slice(0, 100)
    const retry = limiter.take(createHash('sha256').update(ip).digest('hex'))
    if (retry)
      return response({ error: 'rate_limit' }, 429, {
        'Retry-After': String(retry),
      })
    const body = await readJson(request)
    if ('status' in body) return response({ error: 'invalid' }, body.status)
    const parsed = payloadSchema.safeParse(body.data)
    if (!parsed.success) return response({ error: 'invalid' }, 400)
    try {
      const listing = await getListing(listingId)
      if (!listing || listing.id !== listingId)
        return response({ error: 'unavailable' }, 404)
      return response({
        listingId,
        ...answerListingQuestion(
          listing,
          parsed.data.message,
          parsed.data.locale
        ),
      })
    } catch {
      return response({ error: 'unavailable' }, 503)
    }
  }
}
