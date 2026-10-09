'use client'

import { useState, type MouseEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Mail, MessageCircle, MessagesSquare } from 'lucide-react'
import { useLocale } from 'next-intl'
import {
  CONTACT_EMAIL, WECHAT_DEEP_LINK, WECHAT_ID,
  lineMessageUrl, messagingOrder, whatsappUrl, type ContactChannel, type MessagingChannel,
} from '@/lib/contact-channels'

const copy = {
  ja: { title: '購入の相談は登録なしで', note: '物件探し、購入の流れ、費用のことなど、LINE・WhatsApp・WeChat・メールで直接ご相談いただけます。日本語・英語・中国語で対応します。', whatsapp: 'WhatsAppで相談', line: 'LINEで相談', wechat: 'WeChatで相談', email: 'メールで相談', wechatCopied: `WeChat ID「${WECHAT_ID}」をコピーしました。開かない場合は、友だち追加の検索に貼り付けてください。`, message: (topic: string) => `東京の不動産購入について相談したいです。\n（見ていたページ：${topic}）` },
  en: { title: 'Ask us, no sign-up', note: 'Questions about finding a property, the buying steps or costs? Message us on WhatsApp, LINE, WeChat or email. We reply in English, Japanese and Chinese.', whatsapp: 'Chat on WhatsApp', line: 'Chat on LINE', wechat: 'Chat on WeChat', email: 'Email us', wechatCopied: `WeChat ID “${WECHAT_ID}” copied. If WeChat does not open, paste it into Add Contacts.`, message: (topic: string) => `I'd like to ask about buying property in Tokyo.\n(Page I was reading: ${topic})` },
  'zh-TW': { title: '免註冊直接諮詢', note: '找物件、購屋流程、費用等問題，都可透過 LINE、WeChat、WhatsApp 或電子郵件直接詢問。提供中文、日文、英文服務。', whatsapp: 'WhatsApp 諮詢', line: 'LINE 諮詢', wechat: '微信諮詢', email: '電子郵件諮詢', wechatCopied: `已複製微信號「${WECHAT_ID}」。若微信未開啟，請在「新增朋友」中貼上搜尋。`, message: (topic: string) => `我想諮詢在東京買房的事。\n（正在看的頁面：${topic}）` },
  'zh-CN': { title: '免注册直接咨询', note: '找房源、购房流程、费用等问题，都可以通过微信、WhatsApp、LINE 或邮件直接咨询。提供中文、日语、英语服务。', whatsapp: 'WhatsApp 咨询', line: 'LINE 咨询', wechat: '微信咨询', email: '邮件咨询', wechatCopied: `已复制微信号“${WECHAT_ID}”。若微信未打开，请在“添加朋友”中粘贴搜索。`, message: (topic: string) => `我想咨询在东京买房的事。\n（正在看的页面：${topic}）` },
} as const

// White text needs at least 4.5:1 contrast, so brand greens are darkened (same tones as listing pages).
const PRIMARY_TONE: Record<MessagingChannel, string> = {
  whatsapp: 'bg-[#1f7a4d] text-white hover:bg-[#17633e]',
  line: 'bg-[#06733a] text-white hover:bg-[#055c2e]',
  wechat: 'bg-[#11763d] text-white hover:bg-[#0c5e30]',
}
const OUTLINE_TONE = 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]'
const BUTTON = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors'

function recordClick(channel: ContactChannel, locale: string) {
  const payload = JSON.stringify({ locale, search: window.location.search, channel, path: window.location.pathname })
  if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics/contact-click', new Blob([payload], { type: 'application/json' }))
  else void fetch('/api/analytics/contact-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
}

interface AskUsProps {
  /** What the visitor was reading (guide title or ward name), quoted in the prefilled message. Defaults to the page title. */
  topic?: string
  /** Absolute URL of the page, added to the prefilled message. Defaults to the current address. */
  pageUrl?: string
}

/** Direct contact for pages without a listing (guides, ward pages). */
export function AskUs({ topic, pageUrl }: AskUsProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const [wechatCopied, setWechatCopied] = useState(false)
  const messageFor = (title: string, url: string) => `${text.message(title)}\n${url}`
  const message = messageFor(topic ?? 'Welcome Home Tokyo', pageUrl ?? '')
  const hrefFor = (channel: ContactChannel, body: string) => channel === 'whatsapp' ? whatsappUrl(body)
    : channel === 'line' ? lineMessageUrl(body)
      : channel === 'wechat' ? WECHAT_DEEP_LINK
        : `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic ?? document.title)}&body=${encodeURIComponent(body)}`
  const hrefs: Record<MessagingChannel, string> = { whatsapp: whatsappUrl(message), line: lineMessageUrl(message), wechat: WECHAT_DEEP_LINK }
  const [primary, ...secondary] = messagingOrder(locale)
  const onClick = (channel: ContactChannel, event?: MouseEvent<HTMLAnchorElement>) => {
    // Without a topic, quote the page actually open (title and address are only known in the browser).
    if (event && (!topic || !pageUrl)) event.currentTarget.href = hrefFor(channel, messageFor(topic ?? document.title, pageUrl ?? window.location.href))
    recordClick(channel, locale)
    // WeChat has no web chat link: copy the ID as well, in case the app does not open.
    if (channel === 'wechat') {
      void navigator.clipboard?.writeText(WECHAT_ID).catch(() => undefined)
      setWechatCopied(true)
    }
  }
  const linkProps = (channel: MessagingChannel) => ({
    href: hrefs[channel],
    onClick: (event: MouseEvent<HTMLAnchorElement>) => onClick(channel, event),
    ...(channel === 'wechat' ? {} : { target: '_blank', rel: 'noopener noreferrer' }),
  })

  return <section className="mt-10 rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-5" aria-labelledby="ask-us-title" data-testid="ask-us">
    <h2 id="ask-us-title" className="text-lg font-semibold">{text.title}</h2>
    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#536274]">{text.note}</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-4">
      <a {...linkProps(primary)} className={`${BUTTON} ${PRIMARY_TONE[primary]}`}><MessageCircle aria-hidden="true" className="h-4 w-4" />{text[primary]}</a>
      {secondary.map((channel) => <a key={channel} {...linkProps(channel)} className={`${BUTTON} ${OUTLINE_TONE}`}><MessagesSquare aria-hidden="true" className="h-4 w-4" />{text[channel]}</a>)}
      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic ?? 'Welcome Home Tokyo')}&body=${encodeURIComponent(message)}`} onClick={(event) => onClick('email', event)} className={`${BUTTON} ${OUTLINE_TONE}`}><Mail aria-hidden="true" className="h-4 w-4" />{text.email}</a>
    </div>
    {wechatCopied && <p className="mt-3 rounded-lg bg-[#edf3e7] px-3 py-2 text-xs leading-5 text-[#3f5f39]" role="status">{text.wechatCopied}</p>}
  </section>
}

/** Pages that already show their own contact block, or where asking makes no sense. */
const OWN_CONTACT = [/^\/listings\/[^/]+$/, /^\/guides\/[^/]+$/, /^\/areas\/[^/]+$/, /^\/(chats|favorites|login|register|alerts|preview)(\/|$)/]

/** Site-wide contact block above the footer, except on pages listed in OWN_CONTACT. */
export function SiteAskUs() {
  const pathname = usePathname()
  if (OWN_CONTACT.some((pattern) => pattern.test(pathname))) return null
  return <div className="container pb-12"><AskUs /></div>
}
