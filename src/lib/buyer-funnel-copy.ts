import { getPortalHomeCopy } from './portal-copy'
import { getBuyerJourneyCopy } from './buyer-journey-copy'
import type { FunnelVariant } from './buyer-funnel-policy'

export const funnelFields = ['consult','matchCta','matchTitle','contact','registerTitle','registerButton'] as const
export type FunnelField = typeof funnelFields[number]
const register = {
  ja: ['新規登録','登録する'], en: ['Register','Register'], 'zh-TW':['註冊','註冊'], 'zh-CN':['注册','注册'],
}
const alternatives = {
  ja: {
    criteria:['エリア・予算から相談する','エリアと予算を整理する','エリアと予算から、購入条件を整理','この条件でWhatsApp相談','希望の物件探しを始める','アカウントを作成する'],
    question:['物件探しについて相談する','希望の物件について相談する','まだ条件が決まっていなくても、ご相談ください','希望条件をWhatsAppで相談','物件の相談を始める','登録して相談へ進む'],
  },
  en: {
    criteria:['Discuss area and budget','Set my area and budget','Plan your search by area and budget','Discuss these criteria on WhatsApp','Start your property search','Create an account'],
    question:['Ask about my property search','Discuss the property I need','Not sure what you need? Discuss your search.','Discuss my needs on WhatsApp','Start a property conversation','Register to continue'],
  },
  'zh-TW': {
    criteria:['依地區與預算諮詢','整理地區與預算','從地區與預算整理購屋條件','透過 WhatsApp 諮詢這些條件','開始尋找理想物件','建立帳號'],
    question:['諮詢找房需求','諮詢理想物件','還沒決定條件？歡迎先諮詢。','透過 WhatsApp 諮詢需求','開始物件諮詢','註冊並繼續諮詢'],
  },
  'zh-CN': {
    criteria:['按地区与预算咨询','整理地区与预算','从地区与预算整理购房条件','通过 WhatsApp 咨询这些条件','开始寻找理想房产','创建账号'],
    question:['咨询找房需求','咨询理想房产','还没确定条件？欢迎先咨询。','通过 WhatsApp 咨询需求','开始房产咨询','注册并继续咨询'],
  },
} as const
export function funnelCopy(locale: string, variant: FunnelVariant): Record<FunnelField,string> {
  const l = locale in alternatives ? locale as keyof typeof alternatives : 'ja'
  const home=getPortalHomeCopy(l), buyer=getBuyerJourneyCopy(l)
  const values=variant==='original' ? [home.consult,home.matchCta,buyer.matchTitle,buyer.contact,...register[l]] : alternatives[l][variant]
  return Object.fromEntries(funnelFields.map((f,i)=>[f,values[i]])) as Record<FunnelField,string>
}
export const catalogFingerprint = JSON.stringify(['ja','en','zh-TW','zh-CN'].map(l=>['original','criteria','question'].map(v=>funnelCopy(l,v as FunnelVariant))))
