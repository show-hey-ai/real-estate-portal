import { z } from 'zod'
import { sendChatInput } from './private-chat-policy'
import { getTradeChatCopy, stageLabel, tradeStages } from './trade-chat-copy'

export { getTradeChatCopy, stageLabel, tradeStages } from './trade-chat-copy'

const common = { language: z.enum(['ja','en','zh-CN','zh-TW']), nonce: z.uuid() }
const note = z.string().trim().max(1000).default('')
export const tradeInput = z.union([
  sendChatInput,
  z.object({ ...common, action: z.literal('viewing'), date: z.iso.date(), slot: z.string().trim().min(1).max(80), note }).strict(),
  z.object({ ...common, action: z.literal('offer'), amountYen: z.string().regex(/^[1-9]\d{0,11}$/), note }).strict(),
  z.object({ ...common, action: z.literal('stage'), stage: z.enum(tradeStages), note }).strict(),
])
export function prepareTradeMessage(input: z.infer<typeof tradeInput>) {
  if (!('action' in input)) return { body: input.body, kind: 'text', details: {}, stage: null }
  const c = getTradeChatCopy(input.language)
  const suffix = input.note ? `\n${c.note}: ${input.note}` : ''
  if (input.action==='viewing') return { body: `${c.viewingMessage}\n${c.date}: ${input.date}\n${c.slot}: ${input.slot}${suffix}`, kind: 'viewing', details: { date: input.date, slot: input.slot, note: input.note }, stage: null }
  if (input.action==='offer') return { body: `${c.offerMessage}\n${c.amount}: ${Number(input.amountYen).toLocaleString(input.language)}${suffix}`, kind: 'offer', details: { amountYen: input.amountYen, note: input.note }, stage: null }
  return { body: `${c.stageMessage}: ${stageLabel(input.stage,input.language)}${suffix}`, kind: 'stage', details: { stage: input.stage, note: input.note }, stage: input.stage }
}
