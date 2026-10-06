import { prisma } from '@/lib/db'
import { startChatInput, chatId } from '@/lib/private-chat-policy'
import { ChatError, chatViewer, chatMutation, chatResponse, chatFailure, startRoom, roomView, type PrivateRoom } from '@/lib/private-chat-server'

export async function GET(request: Request) {
  try {
    const viewer = await chatViewer()
    const url = new URL(request.url)
    const listing = url.searchParams.get('listing') || null
    const before = url.searchParams.get('before')
    if (before && !chatId.safeParse(before).success) throw new ChatError(400, 'INVALID_INPUT')
    const rows = await prisma.$queryRaw<PrivateRoom[]>`
      SELECT r.*, COALESCE(l."addressPublic", 'Property') AS title FROM property_chat_rooms r JOIN listings l ON l.id = r."listingId"
      WHERE ${viewer.id}::uuid IN (r."buyerSubject",r."sellerSubject")
      AND (${listing}::text IS NULL OR r."listingId" = ${listing})
      AND (${before}::uuid IS NULL OR (r."updatedAt",r.id) < (SELECT "updatedAt",id FROM property_chat_rooms WHERE id = ${before}::uuid AND ${viewer.id}::uuid IN ("buyerSubject","sellerSubject")))
      ORDER BY r."updatedAt" DESC, r.id DESC LIMIT 51`
    return chatResponse({ rooms: rows.slice(0, 50).map(r => roomView(r, viewer.id)), next: rows.length > 50 ? rows[49].id : null })
  } catch (error) { return chatFailure(error) }
}
export async function POST(request: Request) {
  try {
    const viewer = await chatViewer()
    const input = startChatInput.safeParse(await chatMutation(request))
    if (!input.success) throw new ChatError(400, 'INVALID_INPUT')
    return chatResponse({ id: await startRoom(input.data.listingId, viewer.id) })
  } catch (error) { return chatFailure(error) }
}
