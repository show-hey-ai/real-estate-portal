import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getAdminUserFromSession } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/server'
import { ChatError, chatViewer, chatMutation, chatResponse, chatFailure } from '@/lib/private-chat-server'

type Context = { params: Promise<{ id: string }> }
export async function GET(_request: Request, context: Context) {
  try {
    if (!await getAdminUserFromSession()) throw new ChatError(403, 'FORBIDDEN')
    const { id } = await context.params
    const rows = await prisma.$queryRaw<{ sellerSubject: string }[]>`SELECT "sellerSubject" FROM property_chat_sellers WHERE "listingId" = ${id}`
    if (!rows[0]) {
      const operators=await prisma.$queryRaw<{subject:string}[]>`SELECT subject FROM property_chat_operator WHERE id='default'`
      return chatResponse({ email: null, managed: Boolean(operators[0]) })
    }
    const { data, error } = await createServiceClient().auth.admin.getUserById(rows[0].sellerSubject)
    if (error) throw new ChatError(503, 'CHAT_UNAVAILABLE')
    return chatResponse({ email: data.user?.email || null })
  } catch (error) { return chatFailure(error) }
}
export async function PUT(request: Request, context: Context) {
  try {
    const actor = await chatViewer()
    if (!await getAdminUserFromSession()) throw new ChatError(403, 'FORBIDDEN')
    const input = z.object({ email: z.email(), authorized: z.literal(true) }).strict().safeParse(await chatMutation(request))
    if (!input.success) throw new ChatError(400, 'INVALID_INPUT')
    const { id } = await context.params
    if (!await prisma.listing.findUnique({ where: { id }, select: { id: true } })) throw new ChatError(404, 'CHAT_NOT_FOUND')
    const service = createServiceClient()
    let subject: string | null = null
    for (let page = 1; page <= 20; page++) {
      const { data, error } = await service.auth.admin.listUsers({ page, perPage: 100 })
      if (error) throw new ChatError(503, 'CHAT_UNAVAILABLE')
      const match = data.users.find(u => {
        const bannedUntil = (u as typeof u & { banned_until?: string }).banned_until
        return u.email?.toLowerCase() === input.data.email.toLowerCase() && u.email_confirmed_at && (!bannedUntil || Date.parse(bannedUntil) <= Date.now())
      })
      if (match) { subject = match.id; break }
      if (data.users.length < 100) break
    }
    if (!subject) throw new ChatError(409, 'SELLER_NOT_REGISTERED')
    await prisma.$executeRaw`INSERT INTO property_chat_sellers ("listingId","sellerSubject","assignedBy") VALUES (${id},${subject}::uuid,${actor.id}::uuid)
      ON CONFLICT ("listingId") DO UPDATE SET "sellerSubject" = EXCLUDED."sellerSubject", "assignedBy" = EXCLUDED."assignedBy", "assignedAt" = now()`
    return chatResponse({ saved: true })
  } catch (error) { return chatFailure(error) }
}
