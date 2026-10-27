'use client'

import { useEffect, useId, useState, type MouseEvent } from 'react'
import { CalendarCheck, FileText, HelpCircle, Images, Mail, SearchCheck } from 'lucide-react'
import { ChannelIcon } from '@/components/contact/channel-icon'
import { PrivateListingsNote } from '@/components/contact/private-listings-note'
import { browserCanOpenLineChat, lineDesktopNote } from '@/lib/line-desktop'
import { useLocale } from 'next-intl'
import {
  CONTACT_EMAIL, LINE_ADD_URL, WECHAT_DEEP_LINK, WECHAT_ID,
  lineMessageUrl, messagingOrder, whatsappUrl, type ContactChannel, type MessagingChannel,
} from '@/lib/contact-channels'
import { BuyerProfileSteps, useBuyerProfile } from '@/components/contact/buyer-profile-fields'
import { ChoiceChips } from '@/components/contact/choice-chips'
import { getProfileCopy, isProfileComplete, profileText } from '@/lib/buyer-profile'

type Intent = 'question' | 'photos' | 'documents' | 'viewing' | 'similar'

const INTENTS: { key: Intent; Icon: typeof Mail }[] = [
  { key: 'question', Icon: HelpCircle },
  { key: 'photos', Icon: Images },
  { key: 'documents', Icon: FileText },
  { key: 'viewing', Icon: CalendarCheck },
  { key: 'similar', Icon: SearchCheck },
]

const copy = {
  ja: { title: '登録なしですぐ相談', note: 'LINE・WhatsApp・WeChat・メールで、この物件について直接お問い合わせいただけます。掲載以外の写真が見たいときは「追加の写真」を選んで送ってください。', whatsapp: 'WhatsAppで相談', line: 'LINEで相談', wechat: 'WeChatで相談', wechatCopied: `① WeChat ID「${WECHAT_ID}」をコピーしました。WeChatの「友だち追加」で検索に貼り付けて追加してください。`, wechatMessage: '② 問い合わせ文をコピー（ご購入者情報入り）', wechatMessageCopied: 'コピーしました。WeChatのトークに貼り付けて送ってください。', email: 'メールで相談', intentLabel: 'ご用件', intents: { question: '質問する', photos: '追加の写真', documents: '資料請求', viewing: '内見予約', similar: '似た物件を探してほしい' }, intentMessage: { question: 'この物件について相談したいです。', photos: 'この物件の追加の写真を見たいです（室内・眺望・共用部など）。', documents: 'この物件の資料を希望します（重要事項調査報告書・長期修繕計画・管理規約など）。', viewing: 'この物件の内見を希望します。', similar: 'この物件に似た物件（エリア・価格帯・広さが近いもの）を、サイトに載っていない物件も含めて探してほしいです。' }, details: { question: ['価格・条件', '管理費・修繕積立金', '周辺環境', '購入の流れ・費用', 'ローン'], photos: ['室内', '眺望', '共用部', '外観・周辺'], documents: ['重要事項調査報告書', '長期修繕計画', '管理規約', '間取り図・図面'], viewing: ['現地で見たい', 'オンラインで見たい', 'できるだけ早く', '平日', '土日'], similar: ['同じくらいの条件で', 'もっと安く', 'もっと広く', '駅に近く', '別のエリアも'] }, detailLabel: '詳しく（任意・いくつでも）', detailOpen: '＋ 詳しく選ぶ（任意）', detailHeading: '詳細：' },
  en: { title: 'Ask now, no sign-up', note: 'Contact us about this property directly by WhatsApp, LINE, WeChat or email. Want to see more than the photos here? Choose “More photos” and send.', whatsapp: 'Chat on WhatsApp', line: 'Chat on LINE', wechat: 'Chat on WeChat', wechatCopied: `1. WeChat ID “${WECHAT_ID}” copied. Paste it into Add Contacts in WeChat to add us.`, wechatMessage: '2. Copy my message (with my answers)', wechatMessageCopied: 'Copied. Paste it into the WeChat chat and send.', email: 'Email us', intentLabel: 'I want to', intents: { question: 'Ask a question', photos: 'More photos', documents: 'Get documents', viewing: 'Book a viewing', similar: 'Find me similar properties' }, intentMessage: { question: 'I would like to ask about this property.', photos: 'I would like to see more photos of this property (rooms, view, common areas).', documents: 'I would like the documents for this property (building management report, long-term repair plan, bylaws).', viewing: 'I would like to view this property.', similar: 'Could you look for properties similar to this one (area, price, size), including ones not listed on your site?' }, details: { question: ['Price & terms', 'Monthly fees', 'Neighborhood', 'Buying steps & costs', 'Loans'], photos: ['Rooms', 'View', 'Common areas', 'Outside & area'], documents: ['Building management report', 'Long-term repair plan', 'Bylaws', 'Floor plans'], viewing: ['In person', 'By video call', 'As soon as possible', 'Weekdays', 'Weekends'], similar: ['Similar terms', 'Cheaper', 'Larger', 'Closer to a station', 'Other areas too'] }, detailLabel: 'Details (optional, choose any)', detailOpen: '+ Add details (optional)', detailHeading: 'Details: ' },
  'zh-TW': { title: '免註冊立即諮詢', note: '可透過 LINE、WeChat、WhatsApp 或電子郵件直接詢問此物件。想看更多照片，請選擇「更多照片」後傳送。', whatsapp: 'WhatsApp 諮詢', line: 'LINE 諮詢', wechat: '微信諮詢', wechatCopied: `① 已複製微信號「${WECHAT_ID}」。請在微信「新增朋友」中貼上搜尋並加入。`, wechatMessage: '② 複製諮詢內容（含購買者資訊）', wechatMessageCopied: '已複製。請貼到微信聊天中傳送。', email: '電子郵件諮詢', intentLabel: '諮詢內容', intents: { question: '提問', photos: '更多照片', documents: '索取資料', viewing: '預約看屋', similar: '幫我找類似物件' }, intentMessage: { question: '我想諮詢這個物件。', photos: '我想看此物件的更多照片（室內、景觀、公共區域等）。', documents: '希望索取此物件資料（重要事項調查報告書、長期修繕計畫、管理規約等）。', viewing: '希望預約看屋。', similar: '希望幫我找與此物件相似的物件（區域、價格帶、面積相近），包含網站上未刊登的物件。' }, details: { question: ['價格、條件', '管理費、修繕基金', '周邊環境', '購屋流程、費用', '貸款'], photos: ['室內', '景觀', '公共區域', '外觀、周邊'], documents: ['重要事項調查報告書', '長期修繕計畫', '管理規約', '格局圖、圖面'], viewing: ['現場看屋', '線上看屋', '越快越好', '平日', '週末'], similar: ['條件相近', '更便宜', '更大', '離車站更近', '其他區域也可'] }, detailLabel: '詳細（選填，可複選）', detailOpen: '＋ 選擇詳細（選填）', detailHeading: '詳細：' },
  'zh-CN': { title: '免注册立即咨询', note: '可通过微信、WhatsApp、LINE 或电子邮件直接咨询此房源。想看更多照片，请选择“更多照片”后发送。', whatsapp: 'WhatsApp 咨询', line: 'LINE 咨询', wechat: '微信咨询', wechatCopied: `① 已复制微信号“${WECHAT_ID}”。请在微信“添加朋友”中粘贴搜索并添加。`, wechatMessage: '② 复制咨询内容（含购买者信息）', wechatMessageCopied: '已复制。请粘贴到微信聊天中发送。', email: '邮件咨询', intentLabel: '咨询内容', intents: { question: '提问', photos: '更多照片', documents: '索取资料', viewing: '预约看房', similar: '帮我找类似房源' }, intentMessage: { question: '我想咨询这个房源。', photos: '我想看此房源的更多照片（室内、景观、公共区域等）。', documents: '希望索取此房源资料（重要事项调查报告书、长期修缮计划、管理规约等）。', viewing: '希望预约看房。', similar: '希望帮我找与此房源相似的房源（区域、价格区间、面积相近），包括网站上未刊登的房源。' }, details: { question: ['价格、条件', '管理费、修缮基金', '周边环境', '购房流程、费用', '贷款'], photos: ['室内', '景观', '公共区域', '外观、周边'], documents: ['重要事项调查报告书', '长期修缮计划', '管理规约', '户型图、图纸'], viewing: ['现场看房', '线上看房', '越快越好', '工作日', '周末'], similar: ['条件相近', '更便宜', '更大', '离车站更近', '其他区域也可'] }, detailLabel: '详细（选填，可多选）', detailOpen: '＋ 选择详细（选填）', detailHeading: '详细：' },
} as const

// White text needs at least 4.5:1 contrast, so brand greens are darkened.
const PRIMARY_TONE: Record<MessagingChannel, string> = {
  whatsapp: 'bg-[#1f7a4d] text-white hover:bg-[#17633e]',
  line: 'bg-[#06733a] text-white hover:bg-[#055c2e]',
  wechat: 'bg-[#11763d] text-white hover:bg-[#0c5e30]',
}
const CHANNEL_NAME: Record<MessagingChannel, string> = { whatsapp: 'WhatsApp', line: 'LINE', wechat: 'WeChat' }
const OUTLINE_TONE = 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]'
/** A WeChat tap in the bottom bar opens the WeChat steps in the contact box, which holds the note. */
const WECHAT_TAPPED = 'ziyou-wechat-tapped'

interface QuickContactProps {
  listingId: string
  listingTitle: string
  listingUrl: string
  /** 'bar' is a phone-only bar fixed to the bottom of the screen. */
  variant?: 'card' | 'bar'
}

interface ContactLink {
  channel: ContactChannel
  href: string
  label: string
  external: boolean
}

function recordClick(listingId: string, channel: ContactChannel, locale: string) {
  const payload = JSON.stringify({ locale, search: window.location.search, listingId, channel })
  if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics/contact-click', new Blob([payload], { type: 'application/json' }))
  else void fetch('/api/analytics/contact-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
}

export function QuickContact({ listingId, listingTitle, listingUrl, variant = 'card' }: QuickContactProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const [intent, setIntent] = useState<Intent>('question')
  // WeChat links cannot carry a message: first the ID is copied to add us, then the message on request.
  const [wechatStep, setWechatStep] = useState<'id' | 'message' | null>(null)
  const [lineOnComputer, setLineOnComputer] = useState(false)
  const [profile, answer] = useBuyerProfile()
  const [triedToSend, setTriedToSend] = useState(false)
  const ready = isProfileComplete(profile)
  const fieldsId = useId()
  const [details, setDetails] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const detailLine = details.length ? `\n${text.detailHeading}${details.join(locale === 'en' ? ', ' : '、')}` : ''
  const message = `${text.intentMessage[intent]}${detailLine}\n${listingTitle}\n${listingUrl}\n\n${profileText(profile, locale)}`
  const subject = intent === 'question' ? listingTitle : `${text.intents[intent]}: ${listingTitle}`

  const messaging: Record<MessagingChannel, ContactLink> = {
    whatsapp: { channel: 'whatsapp', href: whatsappUrl(message), label: text.whatsapp, external: true },
    line: { channel: 'line', href: lineMessageUrl(message), label: text.line, external: true },
    wechat: { channel: 'wechat', href: WECHAT_DEEP_LINK, label: text.wechat, external: false },
  }
  const order = messagingOrder(locale)
  const [primary, ...secondary] = order.map((channel) => messaging[channel])
  const email: ContactLink = { channel: 'email', href: `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`, label: text.email, external: false }

  const onClick = (channel: ContactChannel, event: MouseEvent<HTMLAnchorElement>) => {
    // The buyer questions are required: point at them instead of sending.
    if (!ready) {
      event.preventDefault()
      setTriedToSend(true)
      document.getElementById(fieldsId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    recordClick(listingId, channel, locale)
    if (channel === 'line' && !browserCanOpenLineChat()) {
      event.preventDefault()
      void navigator.clipboard?.writeText(message).catch(() => undefined)
      window.open(LINE_ADD_URL, '_blank', 'noopener,noreferrer')
      setLineOnComputer(true)
      return
    }
    // WeChat has no web chat link: copy the ID to add us; the box then offers the message itself.
    if (channel === 'wechat') {
      void navigator.clipboard?.writeText(WECHAT_ID).catch(() => undefined)
      window.dispatchEvent(new Event(WECHAT_TAPPED))
      if (variant === 'bar') document.getElementById('quick-contact-inline')?.scrollIntoView({ block: 'center' })
    }
  }
  const linkProps = (link: ContactLink) => ({
    href: link.href,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => onClick(link.channel, event),
    'aria-disabled': !ready,
    ...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
  })

  useEffect(() => {
    if (variant === 'bar') return
    const show = () => setWechatStep((step) => step ?? 'id')
    window.addEventListener(WECHAT_TAPPED, show)
    return () => window.removeEventListener(WECHAT_TAPPED, show)
  }, [variant])
  const copyMessage = () => {
    void navigator.clipboard?.writeText(message).catch(() => undefined)
    setWechatStep('message')
  }

  if (variant === 'bar') {
    // Until the buyer questions are answered, the bar takes visitors to the contact box that asks them.
    const barProps = (link: ContactLink) => (ready ? linkProps(link) : { href: '#quick-contact-inline' })
    return <nav aria-label={text.title} data-testid="quick-contact-bar" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-[#dbe2e9] bg-white/95 p-2 shadow-[0_-4px_16px_rgba(27,41,58,0.08)] backdrop-blur lg:hidden">
      <a {...barProps(primary)} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${PRIMARY_TONE[primary.channel as MessagingChannel]}`}><ChannelIcon channel={primary.channel as MessagingChannel} variant="mark" />{primary.label}</a>
      <a {...barProps(secondary[0])} className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold ${OUTLINE_TONE}`}><ChannelIcon channel={secondary[0].channel as MessagingChannel} />{secondary[0].label}</a>
    </nav>
  }

  const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors'
  return <section className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4" aria-labelledby="quick-contact-title" data-testid="quick-contact">
    <h2 id="quick-contact-title" className="font-semibold">{text.title}</h2>
    {/* Phones skip the explanation: the buttons below say the same, and the box sat at 1,300px. */}
    <p className="mt-1 hidden text-xs leading-5 text-[#536274] lg:block">{text.note}</p>
    <PrivateListingsNote locale={locale} className="mt-2" />
    <div role="radiogroup" aria-label={text.intentLabel} className="mt-3 flex flex-wrap gap-1.5">
      {INTENTS.map(({ key, Icon }) => <button key={key} type="button" role="radio" aria-checked={intent === key} onClick={() => { setIntent(key); setDetails([]) }} className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${intent === key ? 'border-[#274d7d] bg-[#274d7d] text-white' : 'border-[#cfd9e3] bg-white text-[#1b293a] hover:bg-[#f3f6f9]'}`}><Icon aria-hidden="true" className="h-3.5 w-3.5" />{text.intents[key]}</button>)}
    </div>
    <div className="mt-2">
      {showDetails
        ? <ChoiceChips label={text.detailLabel} options={text.details[intent]} chosen={details} onChange={setDetails} />
        : <button type="button" aria-expanded={false} onClick={() => setShowDetails(true)} className="inline-flex min-h-9 items-center text-xs font-semibold text-[#274d7d] hover:underline">{text.detailOpen}</button>}
    </div>
    <div id={fieldsId} className="mt-3 scroll-mt-24"><BuyerProfileSteps locale={locale} profile={profile} onAnswer={answer} showMissing={triedToSend} idPrefix={fieldsId} /></div>
    {triedToSend && !ready && <p className="mt-2 text-xs font-semibold text-[#b42318]" role="alert">{getProfileCopy(locale).missing}</p>}
    {/* The buttons stay fully readable; until the answers are in, a tap scrolls to the questions instead of sending. */}
    {!triedToSend && !ready && <p className="mt-2 text-xs text-[#536274]">{getProfileCopy(locale).answerFirst}</p>}
    <div className="mt-3 grid gap-2">
      <a {...linkProps(primary)} className={`${button} ${PRIMARY_TONE[primary.channel as MessagingChannel]}`}><ChannelIcon channel={primary.channel as MessagingChannel} variant="mark" />{primary.label}</a>
      <div className="grid grid-cols-2 gap-2">
        {/* Half-width buttons show just the app name, so "WhatsAppで相談" does not wrap onto two lines on phones. */}
        {secondary.map((link) => <a key={link.channel} {...linkProps(link)} aria-label={link.label} className={`${button} ${OUTLINE_TONE}`}><ChannelIcon channel={link.channel as MessagingChannel} />{CHANNEL_NAME[link.channel as MessagingChannel]}</a>)}
      </div>
      {wechatStep && <div className="rounded-lg bg-[#edf3e7] px-3 py-2 text-xs leading-5 text-[#3f5f39]" role="status" data-testid="wechat-steps">
        <p>{text.wechatCopied}</p>
        <button type="button" onClick={copyMessage} className="mt-2 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-[#b9d3ae] bg-white px-3 font-semibold text-[#2f5a27] hover:bg-[#f4f9f1]">{text.wechatMessage}</button>
        {wechatStep === 'message' && <p className="mt-1 font-semibold">{text.wechatMessageCopied}</p>}
      </div>}
      {lineOnComputer && <p className="rounded-lg bg-[#edf3e7] px-3 py-2 text-xs leading-5 text-[#3f5f39]" role="status">{lineDesktopNote(locale)}</p>}
      {[email].map((link) => <a key={link.channel} {...linkProps(link)} className={`${button} ${OUTLINE_TONE}`}><Mail aria-hidden="true" className="h-4 w-4" />{link.label}</a>)}
    </div>
  </section>
}
