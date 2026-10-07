'use client'

import { useLocale } from 'next-intl'
import { Mail, MessagesSquare } from 'lucide-react'
import { CONTACT_EMAIL, LINE_ADD_URL, WECHAT_DEEP_LINK, WECHAT_ID, messagingOrder, whatsappUrl, type MessagingChannel } from '@/lib/contact-channels'

const copy = {
  ja: { title: '登録しなくても相談できます', body: 'アカウントがなくても、物件探しや購入の相談はすぐにできます。', greeting: '物件について相談したいです。' },
  en: { title: 'No account needed to ask', body: 'You can ask about properties and buying right away, without signing up.', greeting: 'I would like to ask about buying in Tokyo.' },
  'zh-TW': { title: '免註冊也能諮詢', body: '不需帳號，也能立即諮詢找房與購屋。', greeting: '我想諮詢東京購屋。' },
  'zh-CN': { title: '无需注册也能咨询', body: '无需账号，也能立即咨询找房与购房。', greeting: '我想咨询东京购房。' },
} as const

/** Shown on login and sign-up pages so visitors who do not want an account can still reach us. */
export function NoSignupContact() {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const links: Record<MessagingChannel, { href: string; label: string; external: boolean }> = {
    line: { href: LINE_ADD_URL, label: 'LINE', external: true },
    whatsapp: { href: whatsappUrl(text.greeting), label: 'WhatsApp', external: true },
    wechat: { href: WECHAT_DEEP_LINK, label: `WeChat ${WECHAT_ID}`, external: false },
  }
  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#cfd9e3] bg-white px-3 text-sm font-semibold text-[#274d7d] hover:bg-[#f2f6fa]'
  return <section className="mt-4 rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-5" aria-labelledby="no-signup-title" data-testid="no-signup-contact">
    <h2 id="no-signup-title" className="flex items-center gap-2 font-semibold"><MessagesSquare aria-hidden="true" className="h-4 w-4 text-[#274d7d]" />{text.title}</h2>
    <p className="mt-1 text-sm text-[#536274]">{text.body}</p>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {messagingOrder(locale).map((channel) => { const link = links[channel]; return <a key={channel} href={link.href} {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={button}>{link.label}</a> })}
      <a href={`mailto:${CONTACT_EMAIL}`} className={button}><Mail aria-hidden="true" className="h-4 w-4" />Email</a>
    </div>
  </section>
}
