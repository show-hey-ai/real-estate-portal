import { confirmedFunnelEvent } from '@/lib/buyer-funnel-server'
import { randomUUID } from 'node:crypto'
import { prisma } from '@/lib/db'
import { chatId } from '@/lib/private-chat-policy'
import { tradeInput, prepareTradeMessage } from '@/lib/trade-chat'
import { ChatError, chatViewer, chatMutation, chatResponse, chatFailure, findRoom, roomView, messageView, type PrivateMessage } from '@/lib/private-chat-server'

type Context = { params: Promise<{ id: string }> }
async function authorized(context: Context) {
  const viewer = await chatViewer()
  const { id } = await context.params
  if (!chatId.safeParse(id).success) throw new ChatError(404, 'CHAT_NOT_FOUND')
  const room = await findRoom(id, viewer.id)
  return { viewer, room }
}
export async function GET(request: Request, context: Context) {
  try {
    const { viewer, room } = await authorized(context)
    const before = new URL(request.url).searchParams.get('before')
    if (before && !chatId.safeParse(before).success) throw new ChatError(400, 'INVALID_INPUT')
    const rows = await prisma.$queryRaw<PrivateMessage[]>`
      SELECT m.* FROM property_chat_messages m WHERE m."roomId" = ${room.id}::uuid
      AND (${before}::uuid IS NULL OR (m."createdAt",m.id) < (SELECT "createdAt",id FROM property_chat_messages WHERE id = ${before}::uuid AND "roomId" = ${room.id}::uuid))
      ORDER BY m."createdAt" DESC,m.id DESC LIMIT 51`
    return chatResponse({ room: roomView(room, viewer.id), messages: rows.slice(0, 50).reverse().map(m => messageView(m, viewer.id)), next: rows.length > 50 ? rows[49].id : null })
  } catch (error) { return chatFailure(error) }
}
export async function POST(request: Request, context: Context) {
  try {
    const { viewer, room } = await authorized(context)
    const input = tradeInput.safeParse(await chatMutation(request))
    if (!input.success) throw new ChatError(400, 'INVALID_INPUT')
    if ('action' in input.data && ((input.data.action==='stage' && room.sellerSubject!==viewer.id) || (input.data.action!=='stage' && room.buyerSubject!==viewer.id))) throw new ChatError(403,'FORBIDDEN')
    const { language, nonce } = input.data
    const { body, kind, details, stage } = prepareTradeMessage(input.data)
    const rows = await prisma.$queryRaw<PrivateMessage[]>`SELECT * FROM property_chat_trade_send(${room.id}::uuid,${viewer.id}::uuid,${nonce}::uuid,${randomUUID()}::uuid,${body},${language},${kind},${JSON.stringify(details)}::jsonb,${stage}::text)`
    if (room.buyerSubject === viewer.id && rows[0]) await confirmedFunnelEvent(viewer, 'consultation', new Date(rows[0].createdAt), request.headers)
    return chatResponse({ message: messageView(rows[0], viewer.id) })
  } catch (error) { return chatFailure(error) }
}
