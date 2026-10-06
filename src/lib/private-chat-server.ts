import 'server-only'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createClient } from '@/lib/supabase/server'
import { getPublicListingScope } from '@/lib/public-listing-scope'
import { sameChatOrigin, boundedChatBody } from './private-chat-policy'

export class ChatError extends Error {
  constructor(public status: number, public code: string) { super(code) }
}
export async function chatViewer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !user.email_confirmed_at) throw new ChatError(401, 'LOGIN_REQUIRED')
  return user
}
export async function chatMutation(request: Request) {
  if (!sameChatOrigin(request)) throw new ChatError(403, 'ORIGIN_REJECTED')
  const body = await boundedChatBody(request)
  if (body === null) throw new ChatError(413, 'TOO_LARGE')
  try { return JSON.parse(body) as unknown } catch { throw new ChatError(400, 'INVALID_INPUT') }
}
export function chatResponse(value: unknown, status = 200) {
  return NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow' } })
}
export function chatFailure(error: unknown) {
  if (error instanceof ChatError) return chatResponse({ error: error.code }, error.status)
  // Do not log chat text, account identifiers, or database statements.
  if (String(error).includes('CHAT_RATE_LIMIT')) return chatResponse({ error: 'RATE_LIMIT' }, 429)
  return chatResponse({ error: 'CHAT_UNAVAILABLE' }, 503)
}
export type PrivateRoom = { id: string; listingId: string; buyerSubject: string; sellerSubject: string; sellerKind: 'seller' | 'manager'; stage: string; title: string; updatedAt: Date }
export type PrivateMessage = { id: string; body: string; language: string; senderSubject: string; createdAt: Date; kind: string; details: unknown }
export async function findRoom(id: string, viewer: string) {
  const rows = await prisma.$queryRaw<PrivateRoom[]>`
    SELECT r.*, COALESCE(l."addressPublic", 'Property') AS title FROM property_chat_rooms r
    JOIN listings l ON l.id = r."listingId"
    WHERE r.id = ${id}::uuid AND ${viewer}::uuid IN (r."buyerSubject", r."sellerSubject")`
  if (!rows[0]) throw new ChatError(404, 'CHAT_NOT_FOUND')
  return rows[0]
}
export function roomView(room: PrivateRoom, viewer: string) {
  return { id: room.id, listingId: room.listingId, title: room.title, role: room.buyerSubject === viewer ? 'buyer' : 'seller', sellerKind: room.sellerKind, stage: room.stage, updatedAt: room.updatedAt }
}
export function messageView(message: PrivateMessage, viewer: string) {
  return { id: message.id, body: message.body, language: message.language, mine: message.senderSubject === viewer, createdAt: message.createdAt, kind: message.kind, details: message.details }
}
export async function startRoom(listingId: string, viewer: string) {
  const listing = await prisma.listing.findFirst({ where: { id: listingId, ...getPublicListingScope() }, select: { id: true } })
  if (!listing) throw new ChatError(404, 'CHAT_NOT_FOUND')
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${viewer},0))`
    // Serialize starts with seller reassignment. Never infer the seller from the uploader.
    const sellers = await tx.$queryRaw<{ sellerSubject: string }[]>`SELECT "sellerSubject" FROM property_chat_sellers WHERE "listingId" = ${listingId} FOR UPDATE`
    const operators = sellers[0] ? [] : await tx.$queryRaw<{ subject: string }[]>`
      SELECT o.subject FROM property_chat_operator o JOIN auth.users a ON a.id=o.subject
      JOIN users u ON lower(u.email)=lower(a.email)
      WHERE o.id='default' AND u.role='ADMIN' AND a.email_confirmed_at IS NOT NULL AND (a.banned_until IS NULL OR a.banned_until<now()) FOR SHARE OF o`
    const seller = sellers[0]?.sellerSubject || operators[0]?.subject
    const kind = sellers[0] ? 'seller' : 'manager'
    if (!seller) throw new ChatError(409, 'SELLER_PENDING')
    if (seller === viewer) throw new ChatError(409, 'SELLER_OPEN_INBOX')
    const existing = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM property_chat_rooms WHERE "listingId" = ${listingId} AND "buyerSubject" = ${viewer}::uuid AND "sellerSubject" = ${seller}::uuid`
    if (existing[0]) return existing[0].id
    const count = await tx.$queryRaw<{ count: bigint }[]>`SELECT count(*) FROM property_chat_rooms WHERE "buyerSubject" = ${viewer}::uuid AND "createdAt" > now() - interval '1 hour'`
    if (Number(count[0].count) >= 50) throw new ChatError(429, 'RATE_LIMIT')
    const rows = await tx.$queryRaw<{ id: string }[]>`
      INSERT INTO property_chat_rooms (id,"listingId","buyerSubject","sellerSubject","sellerKind") VALUES (${randomUUID()}::uuid,${listingId},${viewer}::uuid,${seller}::uuid,${kind})
      ON CONFLICT ("listingId","buyerSubject","sellerSubject") DO UPDATE SET "listingId" = EXCLUDED."listingId" RETURNING id`
    return rows[0].id
  })
}
