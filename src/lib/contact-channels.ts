/**
 * Company contact channels approved for public use (company site ziyou-fudosan.com / business card).
 */

export const WHATSAPP_NUMBER = '818084927068'
export const CONTACT_EMAIL = 'admin@ziyou-fudosan.com'
export const OFFICE_PHONE = '+81356877120'
export const OFFICE_PHONE_LABEL = '03-5687-7120'
export const LINE_ID = '@569fyrhn'
export const LINE_ADD_URL = `https://line.me/R/ti/p/${LINE_ID}`
export const WECHAT_ID = 'sf930217'
export const WECHAT_DEEP_LINK = `weixin://dl/chat?${WECHAT_ID}`

export type ContactChannel = 'whatsapp' | 'line' | 'wechat' | 'email' | 'phone'
export type MessagingChannel = Extract<ContactChannel, 'whatsapp' | 'line' | 'wechat'>

/** Messaging apps in the order people in each language most often use them. */
export const MESSAGING_ORDER: Record<string, MessagingChannel[]> = {
  ja: ['line', 'whatsapp', 'wechat'],
  'zh-TW': ['line', 'wechat', 'whatsapp'],
  'zh-CN': ['wechat', 'whatsapp', 'line'],
  en: ['whatsapp', 'line', 'wechat'],
}

export function messagingOrder(locale: string): MessagingChannel[] {
  return MESSAGING_ORDER[locale] ?? MESSAGING_ORDER.en
}

/** Opens the LINE official account chat with the message filled in. */
export function lineMessageUrl(message: string): string {
  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_ID)}/?${encodeURIComponent(message)}`
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}
