import { z } from 'zod'

export const chatId = z.uuid()
export const startChatInput = z.object({ listingId: z.string().min(1).max(100) }).strict()
export const sendChatInput = z.object({ body: z.string().trim().min(1).max(4000), language: z.enum(['ja', 'en', 'zh-CN', 'zh-TW']), nonce: z.uuid() }).strict()
export function isChatParticipant(subject: string, room: { buyerSubject: string; sellerSubject: string }) {
  return subject === room.buyerSubject || subject === room.sellerSubject
}
export function sameChatOrigin(request: Request) {
  return request.headers.get('origin') === new URL(request.url).origin
}
export async function boundedChatBody(request: Request): Promise<string | null> {
  if (Number(request.headers.get('content-length')) > 24000) return null
  if (!request.body) return ''
  const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true })
  let length = 0, text = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) return text + decoder.decode()
      length += value.byteLength
      if (length > 24000) { await reader.cancel(); return null }
      text += decoder.decode(value, { stream: true })
    }
  } finally { reader.releaseLock() }
}
export function translatorLanguage(locale: string) {
  return locale === 'zh-TW' ? 'zh-Hant' : locale === 'zh-CN' ? 'zh' : locale === 'ja' ? 'ja' : 'en'
}
