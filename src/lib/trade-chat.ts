import { z } from 'zod'
import { sendChatInput } from './private-chat-policy'

export const tradeStages = ['consultation','viewing','offer','contract','settlement','completed','cancelled'] as const
const common = { language: z.enum(['ja','en','zh-CN','zh-TW']), nonce: z.uuid() }
const note = z.string().trim().max(1000).default('')
export const tradeInput = z.union([
  sendChatInput,
  z.object({ ...common, action: z.literal('viewing'), date: z.iso.date(), slot: z.string().trim().min(1).max(80), note }).strict(),
  z.object({ ...common, action: z.literal('offer'), amountYen: z.string().regex(/^[1-9]\d{0,11}$/), note }).strict(),
  z.object({ ...common, action: z.literal('stage'), stage: z.enum(tradeStages), note }).strict(),
])
const ja = {
  manager: '管理窓口', managedNote: 'この物件の新しいチャットは、管理窓口へ自動で接続します。', start: '管理窓口と取引チャット', privacy: 'この会話の買主と対応する売主・管理窓口だけが閲覧できます。', progress: '取引の進捗',
  stages: ['相談中','内見調整','購入希望・条件交渉','契約手続き','決済・引渡し','完了','取り下げ'],
  viewing: '内見を希望する', offer: '購入希望を伝える', date: '希望日', slot: '希望時間帯', amount: '購入希望価格（円）', note: '補足・希望条件', submit: 'チャットに送信', update: '進捗を記録', cancel: '閉じる',
  requestNote: '希望内容を管理窓口へ送ります。日程・条件の確定は、このチャットで確認してください。',
  stageNote: '確認済みの取引状況を記録します。契約の締結や支払いは、この操作では実行されません。',
  viewingMessage: '内見希望', offerMessage: '購入希望', stageMessage: '進捗の記録',
}
type TradeCopy = typeof ja
const en: TradeCopy = {
  manager: 'Management desk', managedNote: 'New conversations for this property connect automatically to the management desk.', start: 'Chat with management', privacy: 'Only this buyer and the responding seller or management desk can read this conversation.', progress: 'Transaction progress', stages: ['Enquiry','Viewing arrangements','Purchase request / negotiation','Contract process','Settlement / handover','Completed','Withdrawn'],
  viewing: 'Request a viewing', offer: 'Send a purchase request', date: 'Preferred date', slot: 'Preferred time', amount: 'Proposed price (JPY)', note: 'Notes / conditions', submit: 'Send to chat', update: 'Record progress', cancel: 'Close', requestNote: 'Your request will be sent to management. Confirm the date and terms in this chat.', stageNote: 'Record verified progress. This action does not sign a contract or execute a payment.', viewingMessage: 'Viewing request', offerMessage: 'Purchase request', stageMessage: 'Progress recorded',
}
const cn: TradeCopy = { manager: '管理窗口', managedNote: '此房源的新对话会自动连接管理窗口。', start: '与管理方交易聊天', privacy: '仅此买家及负责的卖家或管理窗口可查看对话。', progress: '交易进度', stages: ['咨询中','安排看房','购买意向 / 条件协商','合同手续','结算 / 交房','已完成','已撤回'], viewing: '申请看房', offer: '提交购买意向', date: '希望日期', slot: '希望时间', amount: '意向价格（日元）', note: '备注 / 条件', submit: '发送到聊天', update: '记录进度', cancel: '关闭', requestNote: '向管理方发送意向。请在聊天中确认日期和条件。', stageNote: '记录已确认的进度。本操作不签署合同或执行付款。', viewingMessage: '看房申请', offerMessage: '购买意向', stageMessage: '进度记录' }
const tw: TradeCopy = { manager: '管理窗口', managedNote: '此房源的新對話會自動連接管理窗口。', start: '與管理方交易聊天', privacy: '僅此買家及負責的賣家或管理窗口可查看對話。', progress: '交易進度', stages: ['諮詢中','安排看房','購買意向 / 條件協商','合約手續','結算 / 交屋','已完成','已撤回'], viewing: '申請看房', offer: '提交購買意向', date: '希望日期', slot: '希望時間', amount: '意向價格（日圓）', note: '備註 / 條件', submit: '傳送到聊天', update: '記錄進度', cancel: '關閉', requestNote: '向管理方傳送意向。請在聊天中確認日期和條件。', stageNote: '記錄已確認的進度。本操作不簽署合約或執行付款。', viewingMessage: '看房申請', offerMessage: '購買意向', stageMessage: '進度記錄' }
export function getTradeChatCopy(locale: string): TradeCopy { return locale==='ja' ? ja : locale==='zh-CN' ? cn : locale==='zh-TW' ? tw : en }
export function stageLabel(stage: string, locale: string) { return getTradeChatCopy(locale).stages[tradeStages.indexOf(stage as typeof tradeStages[number])] || getTradeChatCopy(locale).stages[0] }
export function prepareTradeMessage(input: z.infer<typeof tradeInput>) {
  if (!('action' in input)) return { body: input.body, kind: 'text', details: {}, stage: null }
  const c = getTradeChatCopy(input.language)
  const suffix = input.note ? `\n${c.note}: ${input.note}` : ''
  if (input.action==='viewing') return { body: `${c.viewingMessage}\n${c.date}: ${input.date}\n${c.slot}: ${input.slot}${suffix}`, kind: 'viewing', details: { date: input.date, slot: input.slot, note: input.note }, stage: null }
  if (input.action==='offer') return { body: `${c.offerMessage}\n${c.amount}: ${Number(input.amountYen).toLocaleString(input.language)}${suffix}`, kind: 'offer', details: { amountYen: input.amountYen, note: input.note }, stage: null }
  return { body: `${c.stageMessage}: ${stageLabel(input.stage,input.language)}${suffix}`, kind: 'stage', details: { stage: input.stage, note: input.note }, stage: input.stage }
}
