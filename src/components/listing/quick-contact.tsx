'use client'

import { useState } from 'react'
import { CalendarCheck, FileText, HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react'
import { useLocale } from 'next-intl'

// Company contact points approved for public use (company site / business card).
const WHATSAPP_NUMBER = '818084927068'
const CONTACT_EMAIL = 'admin@ziyou-fudosan.com'
const OFFICE_PHONE = '+81356877120'
const OFFICE_PHONE_LABEL = '03-5687-7120'

type Channel = 'whatsapp' | 'email' | 'phone'
type Intent = 'question' | 'documents' | 'viewing'

const INTENTS: { key: Intent; Icon: typeof Mail }[] = [
  { key: 'question', Icon: HelpCircle },
  { key: 'documents', Icon: FileText },
  { key: 'viewing', Icon: CalendarCheck },
]

const copy = {
  ja: { title: '登録なしですぐ相談', note: 'WhatsApp・メール・電話で、この物件について直接お問い合わせいただけます。', whatsapp: 'WhatsAppで相談', email: 'メールで相談', phone: '電話する', intentLabel: 'ご用件', intents: { question: '質問する', documents: '資料請求', viewing: '内見予約' }, intentMessage: { question: 'この物件について相談したいです。', documents: 'この物件の資料を希望します（重要事項調査報告書・長期修繕計画・管理規約など）。', viewing: 'この物件の内見を希望します（現地／オンライン）。希望日時：' }, message: (title: string, url: string) => `この物件について相談したいです。\n${title}\n${url}` },
  en: { title: 'Ask now, no sign-up', note: 'Contact us about this property directly by WhatsApp, email or phone.', whatsapp: 'Chat on WhatsApp', email: 'Email us', phone: 'Call', intentLabel: 'I want to', intents: { question: 'Ask a question', documents: 'Get documents', viewing: 'Book a viewing' }, intentMessage: { question: 'I would like to ask about this property.', documents: 'I would like the documents for this property (building management report, long-term repair plan, bylaws).', viewing: 'I would like to view this property (in person or by online video). Preferred dates: ' }, message: (title: string, url: string) => `I would like to ask about this property.\n${title}\n${url}` },
  'zh-TW': { title: '免註冊立即諮詢', note: '可透過 WhatsApp、電子郵件或電話直接詢問此物件。', whatsapp: 'WhatsApp 諮詢', email: '電子郵件諮詢', phone: '撥打電話', intentLabel: '諮詢內容', intents: { question: '提問', documents: '索取資料', viewing: '預約看房' }, intentMessage: { question: '我想諮詢這個物件。', documents: '希望索取此物件資料（重要事項調查報告書、長期修繕計畫、管理規約等）。', viewing: '希望預約看房（現場／線上）。希望日期：' }, message: (title: string, url: string) => `我想諮詢這個物件。\n${title}\n${url}` },
  'zh-CN': { title: '免注册立即咨询', note: '可通过 WhatsApp、电子邮件或电话直接咨询此房源。', whatsapp: 'WhatsApp 咨询', email: '邮件咨询', phone: '拨打电话', intentLabel: '咨询内容', intents: { question: '提问', documents: '索取资料', viewing: '预约看房' }, intentMessage: { question: '我想咨询这个房源。', documents: '希望索取此房源资料（重要事项调查报告书、长期修缮计划、管理规约等）。', viewing: '希望预约看房（现场／线上）。希望日期：' }, message: (title: string, url: string) => `我想咨询这个房源。\n${title}\n${url}` },
} as const

interface QuickContactProps {
  listingId: string
  listingTitle: string
  listingUrl: string
  /** 'bar' is a phone-only bar fixed to the bottom of the screen. */
  variant?: 'card' | 'bar'
}

function recordClick(listingId: string, channel: Channel, locale: string) {
  const payload = JSON.stringify({ locale, search: window.location.search, listingId, channel })
  if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics/contact-click', new Blob([payload], { type: 'application/json' }))
  else void fetch('/api/analytics/contact-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
}

export function QuickContact({ listingId, listingTitle, listingUrl, variant = 'card' }: QuickContactProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const [intent, setIntent] = useState<Intent>('question')
  const message = `${text.intentMessage[intent]}\n${listingTitle}\n${listingUrl}`
  const subject = intent === 'question' ? listingTitle : `${text.intents[intent]}: ${listingTitle}`
  const links: { channel: Channel; href: string; label: string; Icon: typeof Mail; tone: string; external: boolean }[] = [
    { channel: 'whatsapp', href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, label: text.whatsapp, Icon: MessageCircle, tone: 'bg-[#1f7a4d] text-white hover:bg-[#17633e]', external: true },
    { channel: 'email', href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, label: text.email, Icon: Mail, tone: 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]', external: false },
    { channel: 'phone', href: `tel:${OFFICE_PHONE}`, label: `${text.phone} ${OFFICE_PHONE_LABEL}`, Icon: Phone, tone: 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]', external: false },
  ]
  if (variant === 'bar') {
    const [whatsapp, , phone] = links
    return <nav aria-label={text.title} data-testid="quick-contact-bar" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-[#dbe2e9] bg-white/95 p-2 shadow-[0_-4px_16px_rgba(27,41,58,0.08)] backdrop-blur lg:hidden">
      {[whatsapp, { ...phone, label: text.phone }].map(({ channel, href, label, Icon, tone, external }) => <a key={channel} href={href} onClick={() => recordClick(listingId, channel, locale)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${tone}`}><Icon aria-hidden="true" className="h-4 w-4" />{label}</a>)}
    </nav>
  }
  return <section className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4" aria-labelledby="quick-contact-title" data-testid="quick-contact">
    <h2 id="quick-contact-title" className="font-semibold">{text.title}</h2>
    <p className="mt-1 text-xs leading-5 text-[#536274]">{text.note}</p>
    <div role="radiogroup" aria-label={text.intentLabel} className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-[#eef2f6] p-1">
      {INTENTS.map(({ key, Icon }) => <button key={key} type="button" role="radio" aria-checked={intent === key} onClick={() => setIntent(key)} className={`flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-xs font-semibold transition ${intent === key ? 'bg-white text-[#274d7d] shadow-sm' : 'text-[#536274] hover:bg-white/60'}`}><Icon aria-hidden="true" className="h-4 w-4" />{text.intents[key]}</button>)}
    </div>
    <div className="mt-3 grid gap-2">
      {links.map(({ channel, href, label, Icon, tone, external }) => <a key={channel} href={href} onClick={() => recordClick(listingId, channel, locale)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${tone}`}><Icon aria-hidden="true" className="h-4 w-4" />{label}</a>)}
    </div>
  </section>
}
