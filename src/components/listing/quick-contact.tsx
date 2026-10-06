'use client'

import { Mail, MessageCircle, Phone } from 'lucide-react'
import { useLocale } from 'next-intl'

// Company contact points approved for public use (company site / business card).
const WHATSAPP_NUMBER = '818084927068'
const CONTACT_EMAIL = 'admin@ziyou-fudosan.com'
const OFFICE_PHONE = '+81356877120'
const OFFICE_PHONE_LABEL = '03-5687-7120'

type Channel = 'whatsapp' | 'email' | 'phone'

const copy = {
  ja: { title: '登録なしですぐ相談', note: 'WhatsApp・メール・電話で、この物件について直接お問い合わせいただけます。', whatsapp: 'WhatsAppで相談', email: 'メールで相談', phone: '電話する', message: (title: string, url: string) => `この物件について相談したいです。\n${title}\n${url}` },
  en: { title: 'Ask now, no sign-up', note: 'Contact us about this property directly by WhatsApp, email or phone.', whatsapp: 'Chat on WhatsApp', email: 'Email us', phone: 'Call', message: (title: string, url: string) => `I would like to ask about this property.\n${title}\n${url}` },
  'zh-TW': { title: '免註冊立即諮詢', note: '可透過 WhatsApp、電子郵件或電話直接詢問此物件。', whatsapp: 'WhatsApp 諮詢', email: '電子郵件諮詢', phone: '撥打電話', message: (title: string, url: string) => `我想諮詢這個物件。\n${title}\n${url}` },
  'zh-CN': { title: '免注册立即咨询', note: '可通过 WhatsApp、电子邮件或电话直接咨询此房源。', whatsapp: 'WhatsApp 咨询', email: '邮件咨询', phone: '拨打电话', message: (title: string, url: string) => `我想咨询这个房源。\n${title}\n${url}` },
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
  const message = text.message(listingTitle, listingUrl)
  const links: { channel: Channel; href: string; label: string; Icon: typeof Mail; tone: string; external: boolean }[] = [
    { channel: 'whatsapp', href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, label: text.whatsapp, Icon: MessageCircle, tone: 'bg-[#1f7a4d] text-white hover:bg-[#17633e]', external: true },
    { channel: 'email', href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(listingTitle)}&body=${encodeURIComponent(message)}`, label: text.email, Icon: Mail, tone: 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]', external: false },
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
    <div className="mt-3 grid gap-2">
      {links.map(({ channel, href, label, Icon, tone, external }) => <a key={channel} href={href} onClick={() => recordClick(listingId, channel, locale)} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors ${tone}`}><Icon aria-hidden="true" className="h-4 w-4" />{label}</a>)}
    </div>
  </section>
}
