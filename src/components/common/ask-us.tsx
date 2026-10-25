'use client'

import { useId, useState, type MouseEvent } from 'react'
import { usePathname } from 'next/navigation'
import { Mail, MessageCircle, MessagesSquare } from 'lucide-react'
import { useLocale } from 'next-intl'
import {
  CONTACT_EMAIL, WECHAT_DEEP_LINK, WECHAT_ID,
  lineMessageUrl, messagingOrder, whatsappUrl, type ContactChannel, type MessagingChannel,
} from '@/lib/contact-channels'
import { BuyerProfileFields, useBuyerProfile } from '@/components/contact/buyer-profile-fields'
import { ChoiceChips } from '@/components/contact/choice-chips'
import { getProfileCopy, isProfileComplete, profileText } from '@/lib/buyer-profile'

const copy = {
  ja: { briefTitle: '条件を選んで送るだけ（登録不要）', briefNote: 'タップで条件を選び、LINE・WhatsApp・WeChat・メールで送ってください。サイトに載っていない物件も含めて探してご連絡します。', areaLabel: 'エリア（いくつでも）', areas: ['都心（千代田・中央・港）', '城南（品川・目黒・大田・世田谷）', '城西（新宿・渋谷・中野・杉並・練馬）', '城北（文京・豊島・北・板橋）', '城東（台東・墨田・江東・荒川・足立・葛飾・江戸川）', 'こだわらない'], timingLabel: '購入時期', timings: ['すぐにでも', '1年以内', 'まだ未定'], briefHeading: { areas: 'エリア：', timing: '時期：' }, briefMessage: '購入条件を相談したいです。サイトに載っていない物件も含めて、条件に合う物件を探してほしいです。', topicsLabel: 'ご相談の内容（任意・いくつでも）', topics: ['物件探し', '購入の流れ', '費用・税金', 'ローン', '外国籍・海外からの購入', '購入後の賃貸・管理'], budgetLabel: 'ご予算', budgets: ['〜3,000万円', '3,000万〜5,000万円', '5,000万〜1億円', '1億〜3億円', '3億円〜'], typesLabel: '物件の種類（いくつでも）', types: ['区分マンション', '一棟マンション・アパート', '戸建て', '土地'], answersHeading: { topics: '相談内容：', budget: '予算：', types: '種類：' }, unlistedTitle: 'ここに載っていない物件も探せます', unlistedNote: '公開前の物件や他社が扱う物件も含めて、条件に合う物件を探してご連絡します。登録は不要です。', unlistedMessage: (topic: string) => `サイトに載っていない物件も含めて、条件に合う物件を探してほしいです。\n条件：${topic}`, title: '購入の相談は登録なしで', note: '物件探し、購入の流れ、費用のことなど、LINE・WhatsApp・WeChat・メールで直接ご相談いただけます。日本語・英語・中国語で対応します。', whatsapp: 'WhatsAppで相談', line: 'LINEで相談', wechat: 'WeChatで相談', email: 'メールで相談', wechatCopied: `WeChat ID「${WECHAT_ID}」をコピーしました。開かない場合は、友だち追加の検索に貼り付けてください。`, message: (topic: string) => `東京の不動産購入について相談したいです。\n（見ていたページ：${topic}）` },
  en: { briefTitle: 'Just pick and send (no sign-up)', briefNote: 'Tap your conditions and send them by WhatsApp, LINE, WeChat or email. We search properties not listed here too, and get back to you.', areaLabel: 'Area (any)', areas: ['Central (Chiyoda, Chuo, Minato)', 'South (Shinagawa, Meguro, Ota, Setagaya)', 'West (Shinjuku, Shibuya, Nakano, Suginami, Nerima)', 'North (Bunkyo, Toshima, Kita, Itabashi)', 'East (Taito, Sumida, Koto, Arakawa, Adachi, Katsushika, Edogawa)', 'Anywhere'], timingLabel: 'When', timings: ['As soon as possible', 'Within a year', 'Not decided'], briefHeading: { areas: 'Area: ', timing: 'When: ' }, briefMessage: 'I would like to discuss what I am looking for. Could you find properties that match, including ones not listed on your site?', topicsLabel: 'What about? (optional, any)', topics: ['Finding a property', 'Buying steps', 'Costs & taxes', 'Loans', 'Buying as a foreigner / from abroad', 'Renting it out afterwards'], budgetLabel: 'Budget', budgets: ['Up to ¥30M', '¥30–50M', '¥50–100M', '¥100–300M', '¥300M+'], typesLabel: 'Property type (any)', types: ['Condominium', 'Whole building', 'House', 'Land'], answersHeading: { topics: 'About: ', budget: 'Budget: ', types: 'Type: ' }, unlistedTitle: 'Looking for something not listed here?', unlistedNote: 'We can search properties not yet published and those handled by other agents, and send you what matches. No sign-up.', unlistedMessage: (topic: string) => `Could you look for properties that match, including ones not listed on your site?\nSearch: ${topic}`, title: 'Ask us, no sign-up', note: 'Questions about finding a property, the buying steps or costs? Message us on WhatsApp, LINE, WeChat or email. We reply in English, Japanese and Chinese.', whatsapp: 'Chat on WhatsApp', line: 'Chat on LINE', wechat: 'Chat on WeChat', email: 'Email us', wechatCopied: `WeChat ID “${WECHAT_ID}” copied. If WeChat does not open, paste it into Add Contacts.`, message: (topic: string) => `I'd like to ask about buying property in Tokyo.\n(Page I was reading: ${topic})` },
  'zh-TW': { briefTitle: '選好條件直接傳送（免註冊）', briefNote: '點選條件後，透過 LINE、WeChat、WhatsApp 或電子郵件傳送。我們也會尋找網站上未刊登的物件並與您聯絡。', areaLabel: '區域（可複選）', areas: ['都心（千代田・中央・港）', '城南（品川・目黑・大田・世田谷）', '城西（新宿・澀谷・中野・杉並・練馬）', '城北（文京・豐島・北・板橋）', '城東（台東・墨田・江東・荒川・足立・葛飾・江戶川）', '不限'], timingLabel: '購買時間', timings: ['越快越好', '一年內', '尚未決定'], briefHeading: { areas: '區域：', timing: '時間：' }, briefMessage: '我想諮詢購屋條件。希望幫我找符合條件的物件，包含網站上未刊登的物件。', topicsLabel: '諮詢內容（選填，可複選）', topics: ['找物件', '購屋流程', '費用・稅金', '貸款', '外國人・海外購買', '購買後出租・管理'], budgetLabel: '預算', budgets: ['3,000萬日圓以下', '3,000萬〜5,000萬日圓', '5,000萬〜1億日圓', '1億〜3億日圓', '3億日圓以上'], typesLabel: '物件類型（可複選）', types: ['公寓（單戶）', '整棟公寓', '獨棟住宅', '土地'], answersHeading: { topics: '諮詢內容：', budget: '預算：', types: '類型：' }, unlistedTitle: '網站上沒有的物件也能幫您找', unlistedNote: '包含尚未公開或由其他公司經手的物件，我們會找出符合條件的物件並與您聯絡。免註冊。', unlistedMessage: (topic: string) => `希望幫我找符合條件的物件，包含網站上未刊登的物件。\n條件：${topic}`, title: '免註冊直接諮詢', note: '找物件、購屋流程、費用等問題，都可透過 LINE、WeChat、WhatsApp 或電子郵件直接詢問。提供中文、日文、英文服務。', whatsapp: 'WhatsApp 諮詢', line: 'LINE 諮詢', wechat: '微信諮詢', email: '電子郵件諮詢', wechatCopied: `已複製微信號「${WECHAT_ID}」。若微信未開啟，請在「新增朋友」中貼上搜尋。`, message: (topic: string) => `我想諮詢在東京買房的事。\n（正在看的頁面：${topic}）` },
  'zh-CN': { briefTitle: '选好条件直接发送（免注册）', briefNote: '点选条件后，通过微信、WhatsApp、LINE 或邮件发送。我们也会寻找网站上未刊登的房源并与您联系。', areaLabel: '区域（可多选）', areas: ['都心（千代田・中央・港）', '城南（品川・目黑・大田・世田谷）', '城西（新宿・涩谷・中野・杉并・练马）', '城北（文京・丰岛・北・板桥）', '城东（台东・墨田・江东・荒川・足立・葛饰・江户川）', '不限'], timingLabel: '购买时间', timings: ['越快越好', '一年内', '尚未决定'], briefHeading: { areas: '区域：', timing: '时间：' }, briefMessage: '我想咨询购房条件。希望帮我找符合条件的房源，包括网站上未刊登的房源。', topicsLabel: '咨询内容（选填，可多选）', topics: ['找房源', '购房流程', '费用・税金', '贷款', '外国人・海外购买', '购买后出租・管理'], budgetLabel: '预算', budgets: ['3,000万日元以下', '3,000万〜5,000万日元', '5,000万〜1亿日元', '1亿〜3亿日元', '3亿日元以上'], typesLabel: '房源类型（可多选）', types: ['公寓（单户）', '整栋公寓', '独栋住宅', '土地'], answersHeading: { topics: '咨询内容：', budget: '预算：', types: '类型：' }, unlistedTitle: '网站上没有的房源也能帮您找', unlistedNote: '包括尚未公开或由其他公司经手的房源，我们会找出符合条件的房源并与您联系。免注册。', unlistedMessage: (topic: string) => `希望帮我找符合条件的房源，包括网站上未刊登的房源。\n条件：${topic}`, title: '免注册直接咨询', note: '找房源、购房流程、费用等问题，都可以通过微信、WhatsApp、LINE 或邮件直接咨询。提供中文、日语、英语服务。', whatsapp: 'WhatsApp 咨询', line: 'LINE 咨询', wechat: '微信咨询', email: '邮件咨询', wechatCopied: `已复制微信号“${WECHAT_ID}”。若微信未打开，请在“添加朋友”中粘贴搜索。`, message: (topic: string) => `我想咨询在东京买房的事。\n（正在看的页面：${topic}）` },
} as const

// White text needs at least 4.5:1 contrast, so brand greens are darkened (same tones as listing pages).
const PRIMARY_TONE: Record<MessagingChannel, string> = {
  whatsapp: 'bg-[#1f7a4d] text-white hover:bg-[#17633e]',
  line: 'bg-[#06733a] text-white hover:bg-[#055c2e]',
  wechat: 'bg-[#11763d] text-white hover:bg-[#0c5e30]',
}
const OUTLINE_TONE = 'border border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]'
const BUTTON = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition-colors'

export function recordClick(channel: ContactChannel, locale: string) {
  const payload = JSON.stringify({ locale, search: window.location.search, channel, path: window.location.pathname })
  if (navigator.sendBeacon) navigator.sendBeacon('/api/analytics/contact-click', new Blob([payload], { type: 'application/json' }))
  else void fetch('/api/analytics/contact-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
}

interface AskUsProps {
  /** What the visitor was reading (guide title or ward name), quoted in the prefilled message. Defaults to the page title. */
  topic?: string
  /** Absolute URL of the page, added to the prefilled message. Defaults to the current address. */
  pageUrl?: string
  /** 'unlisted' asks us to search beyond the listings on the site, for the topic's conditions;
   *  'brief' collects a whole search (area, budget, type, timing) by tapping only. */
  variant?: 'general' | 'unlisted' | 'brief'
  /** Purpose from /match?purpose=; a land search preselects land as the type. */
  initialPurpose?: BriefPurpose | ''
}

export type BriefPurpose = 'investment' | 'residential' | 'land'
const LAND_TYPE_INDEX = 3

/** Direct contact for pages without a listing (guides, ward pages). */
export function AskUs({ topic, pageUrl, variant = 'general', initialPurpose = '' }: AskUsProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const [wechatCopied, setWechatCopied] = useState(false)
  const unlisted = variant === 'unlisted'
  const brief = variant === 'brief'
  const [profile, answer] = useBuyerProfile()
  const [triedToSend, setTriedToSend] = useState(false)
  const ready = isProfileComplete(profile)
  const fieldsId = useId()
  const [topics, setTopics] = useState<string[]>([])
  const [budget, setBudget] = useState<string[]>([])
  // The buyer questions already ask whether they will live in it or let it, so only a land search carries over.
  const [types, setTypes] = useState<string[]>(initialPurpose === 'land' ? [text.types[LAND_TYPE_INDEX]] : [])
  const [areas, setAreas] = useState<string[]>([])
  const [timing, setTiming] = useState<string[]>([])
  const join = (items: string[]) => items.join(locale === 'en' ? ', ' : '、')
  const answerRows: (readonly [string, readonly string[]])[] = brief
    ? [[text.briefHeading.areas, areas], [text.answersHeading.budget, budget], [text.answersHeading.types, types], [text.briefHeading.timing, timing]]
    : unlisted ? [[text.answersHeading.budget, budget], [text.answersHeading.types, types]] : [[text.answersHeading.topics, topics]]
  const answers = answerRows.filter(([, chosen]) => chosen.length).map(([heading, chosen]) => `\n${heading}${join([...chosen])}`).join('')
  const intro = (title: string) => brief ? text.briefMessage : unlisted ? text.unlistedMessage(title) : text.message(title)
  const messageFor = (title: string, url: string) => `${intro(title)}${answers}\n${url}\n\n${profileText(profile, locale)}`
  const message = messageFor(topic ?? 'Welcome Home Tokyo', pageUrl ?? '')
  const hrefFor = (channel: ContactChannel, body: string) => channel === 'whatsapp' ? whatsappUrl(body)
    : channel === 'line' ? lineMessageUrl(body)
      : channel === 'wechat' ? WECHAT_DEEP_LINK
        : `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic ?? document.title)}&body=${encodeURIComponent(body)}`
  const hrefs: Record<MessagingChannel, string> = { whatsapp: whatsappUrl(message), line: lineMessageUrl(message), wechat: WECHAT_DEEP_LINK }
  const [primary, ...secondary] = messagingOrder(locale)
  const onClick = (channel: ContactChannel, event?: MouseEvent<HTMLAnchorElement>) => {
    // The buyer questions are required: point at them instead of sending.
    if (!ready) {
      event?.preventDefault()
      setTriedToSend(true)
      document.getElementById(fieldsId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
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

  return <section className={`${brief ? '' : 'mt-10 '}rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-5`} aria-labelledby="ask-us-title" data-testid={brief ? 'ask-us-brief' : unlisted ? 'ask-us-unlisted' : 'ask-us'}>
    <h2 id="ask-us-title" className="text-lg font-semibold">{brief ? text.briefTitle : unlisted ? text.unlistedTitle : text.title}</h2>
    <p className="mt-1 max-w-2xl text-sm leading-6 text-[#536274]">{brief ? text.briefNote : unlisted ? text.unlistedNote : text.note}</p>
    <div className="mt-4 max-w-2xl space-y-3">
      {brief
        ? <><ChoiceChips label={text.areaLabel} options={text.areas} chosen={areas} onChange={setAreas} /><ChoiceChips label={text.budgetLabel} options={text.budgets} chosen={budget} onChange={setBudget} single /><ChoiceChips label={text.typesLabel} options={text.types} chosen={types} onChange={setTypes} /><ChoiceChips label={text.timingLabel} options={text.timings} chosen={timing} onChange={setTiming} single /></>
        : unlisted
        ? <><ChoiceChips label={text.budgetLabel} options={text.budgets} chosen={budget} onChange={setBudget} single /><ChoiceChips label={text.typesLabel} options={text.types} chosen={types} onChange={setTypes} /></>
        : <ChoiceChips label={text.topicsLabel} options={text.topics} chosen={topics} onChange={setTopics} />}
    </div>
    <div id={fieldsId} className="mt-4 max-w-2xl scroll-mt-24"><BuyerProfileFields locale={locale} profile={profile} onAnswer={answer} showMissing={triedToSend} idPrefix={fieldsId} /></div>
    {triedToSend && !ready && <p className="mt-2 text-xs font-semibold text-[#b42318]" role="alert">{getProfileCopy(locale).missing}</p>}
    <div className={`mt-4 grid gap-2 sm:grid-cols-4 ${ready ? '' : 'opacity-60'}`}>
      <a {...linkProps(primary)} className={`${BUTTON} ${PRIMARY_TONE[primary]}`}><MessageCircle aria-hidden="true" className="h-4 w-4" />{text[primary]}</a>
      {secondary.map((channel) => <a key={channel} {...linkProps(channel)} className={`${BUTTON} ${OUTLINE_TONE}`}><MessagesSquare aria-hidden="true" className="h-4 w-4" />{text[channel]}</a>)}
      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(topic ?? 'Welcome Home Tokyo')}&body=${encodeURIComponent(message)}`} onClick={(event) => onClick('email', event)} className={`${BUTTON} ${OUTLINE_TONE}`}><Mail aria-hidden="true" className="h-4 w-4" />{text.email}</a>
    </div>
    {wechatCopied && <p className="mt-3 rounded-lg bg-[#edf3e7] px-3 py-2 text-xs leading-5 text-[#3f5f39]" role="status">{text.wechatCopied}</p>}
  </section>
}

/** Pages that already show their own contact block, or where asking makes no sense. */
const OWN_CONTACT = [/^\/(match|other-listings|listings|lines\/[^/]+|stations\/[^/]+)$/, /^\/listings\/[^/]+$/, /^\/guides\/[^/]+$/, /^\/areas\/[^/]+$/, /^\/(chats|favorites|login|register|alerts|preview)(\/|$)/]

/** Site-wide contact block above the footer, except on pages listed in OWN_CONTACT. */
export function SiteAskUs() {
  const pathname = usePathname()
  if (OWN_CONTACT.some((pattern) => pattern.test(pathname))) return null
  return <div className="container pb-12"><AskUs /></div>
}
