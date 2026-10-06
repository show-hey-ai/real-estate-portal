import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, BadgeCheck, BookOpen, Building2, ListChecks, Mail } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { GUIDE_SUPERVISOR, GUIDE_SUPERVISOR_PHOTO } from '@/components/guides/guide-extras'
import { CONTACT_EMAIL, LINE_ADD_URL, LINE_ID, WECHAT_DEEP_LINK, WECHAT_ID, WHATSAPP_NUMBER } from '@/lib/contact-channels'
import { localeAlternates } from '@/lib/locale-url'
import { OPERATOR_NAME, OPERATOR_NAME_JA, SITE_NAME, absoluteUrl, getSchemaLanguage, shareMetadata } from '@/lib/site-config'

const copy = {
  ja: {
    title: '運営会社・監修者', description: 'Welcome Home Tokyo の運営会社（自由不動産合同会社・宅地建物取引業 東京都知事（1）第108831号）、監修者、物件掲載と記事作成のルールについて。',
    intro: 'Welcome Home Tokyo は、東京23区の中古マンション・一棟・土地を、海外のお客様にも分かるように日本語・英語・中国語で紹介する物件ポータルです。東京都知事免許の不動産会社が運営しています。',
    company: '運営会社', companyRows: [['会社名', OPERATOR_NAME_JA], ['宅地建物取引業免許', '東京都知事（1）第108831号'], ['所在地', '〒111-0052 東京都台東区柳橋1丁目11番5号 柳橋ビル305号室'], ['対応言語', '日本語・英語・中国語']],
    supervisor: '監修者', supervisorName: `${GUIDE_SUPERVISOR.ja}（宅地建物取引士）`, supervisorBody: '物件ページの情報とガイド記事の内容を監修しています。',
    listings: '物件掲載のルール', listingRules: ['広告掲載の許可が確認できた物件だけを掲載しています（REINSの「広告転載：可」、または売主・元付業者の承諾）。', '価格は売主の売出価格で、成約価格や相場ではありません。', '販売状況は変わることがあります。最新の状況はお問い合わせください。', '番地・部屋番号などは、掲載が許可された範囲で表示しています。'],
    editorial: '記事の作り方', editorialRules: ['税金・法律などは国税庁・国土交通省などの公的な情報を確認し、出典を記載しています。', '計算例は目安で、個別の税務・法律の助言ではありません。', '「よくあるケース」は実際の取引ではなく、想定例であることを明記しています。', '内容は監修者が確認し、制度の変更にあわせて更新します。'],
    contact: 'お問い合わせ', contactBody: '登録なしで、メール・LINE・WhatsApp・WeChatからご相談いただけます。', listingsCta: '物件を探す',
  },
  en: {
    title: 'About us', description: 'Who runs Welcome Home Tokyo (Ziyou Real Estate LLC, real estate brokerage licence Tokyo Governor (1) No. 108831), who reviews our content, and how we list properties and write guides.',
    intro: "Welcome Home Tokyo presents resale condominiums, whole buildings and land in Tokyo's 23 wards in English, Japanese and Chinese for international buyers. It is run by a Tokyo-licensed real estate brokerage.",
    company: 'Company', companyRows: [['Company', `${OPERATOR_NAME} (${OPERATOR_NAME_JA})`], ['Brokerage licence', 'Tokyo Governor (1) No. 108831'], ['Office', 'Yanagibashi Bldg. 305, 1-11-5 Yanagibashi, Taito-ku, Tokyo 111-0052, Japan'], ['Languages', 'English, Japanese, Chinese']],
    supervisor: 'Content review', supervisorName: `${GUIDE_SUPERVISOR.en}, licensed real estate transaction specialist (宅地建物取引士)`, supervisorBody: 'Reviews the information on listing pages and the content of our guides.',
    listings: 'How we list properties', listingRules: ['We only list properties with confirmed advertising permission (REINS ad permission, or consent from the seller or listing agent).', 'Prices are asking prices, not transaction prices or market values.', 'Availability can change; contact us for the latest status.', 'Street numbers and unit numbers appear only as far as publication is permitted.'],
    editorial: 'How we write guides', editorialRules: ['Tax and legal points are checked against official sources such as the National Tax Agency and MLIT, which we link.', 'Worked examples are illustrations, not individual tax or legal advice.', 'Common situations are labelled as illustrative cases, not real deals.', 'Content is reviewed by our supervisor and updated when rules change.'],
    contact: 'Contact', contactBody: 'Ask us by email, LINE, WhatsApp or WeChat, no sign-up needed.', listingsCta: 'Browse properties',
  },
  'zh-TW': {
    title: '營運公司與監修者', description: 'Welcome Home Tokyo 的營運公司（自由不動產合同會社・宅地建物交易業 東京都知事（1）第108831號）、監修者，以及物件刊登與文章撰寫的規則。',
    intro: 'Welcome Home Tokyo 以中文、日文、英文介紹東京23區的中古公寓、整棟建物與土地，讓海外買家也能看懂。由東京都知事許可的不動產公司營運。',
    company: '營運公司', companyRows: [['公司名稱', '自由不動產合同會社'], ['宅地建物交易業許可', '東京都知事（1）第108831號'], ['地址', '〒111-0052 東京都台東區柳橋1丁目11番5號 柳橋大樓305號室'], ['對應語言', '中文・日文・英文']],
    supervisor: '監修者', supervisorName: `${GUIDE_SUPERVISOR.ja}（宅地建物交易士）`, supervisorBody: '監修物件頁面資訊與指南文章內容。',
    listings: '物件刊登規則', listingRules: ['僅刊登已確認廣告刊登許可的物件（REINS「可轉載廣告」或賣方・委託業者同意）。', '價格為賣方開價，並非成交價或行情。', '銷售狀況可能變動，最新情況請洽詢。', '門牌與房號等僅在獲准刊登的範圍內顯示。'],
    editorial: '文章撰寫方式', editorialRules: ['稅務與法律等內容會確認國稅廳、國土交通省等官方資訊並註明出處。', '計算範例僅供參考，並非個別稅務或法律建議。', '「常見情況」為假設案例，並非實際交易，並會明確標示。', '內容由監修者確認，並隨制度變更更新。'],
    contact: '聯絡我們', contactBody: '免註冊即可透過電子郵件、LINE、WhatsApp 或微信諮詢。', listingsCta: '尋找物件',
  },
  'zh-CN': {
    title: '运营公司与审校者', description: 'Welcome Home Tokyo 的运营公司（自由不动产合同会社・宅地建物交易业 东京都知事（1）第108831号）、审校者，以及房源刊登与文章撰写的规则。',
    intro: 'Welcome Home Tokyo 以中文、日文、英文介绍东京23区的二手公寓、整栋建筑与土地，让海外买家也能看懂。由东京都知事许可的房产公司运营。',
    company: '运营公司', companyRows: [['公司名称', '自由不动产合同会社'], ['宅地建物交易业许可', '东京都知事（1）第108831号'], ['地址', '〒111-0052 东京都台东区柳桥1丁目11番5号 柳桥大楼305号室'], ['对应语言', '中文・日文・英文']],
    supervisor: '审校者', supervisorName: `${GUIDE_SUPERVISOR.ja}（宅地建物交易士）`, supervisorBody: '审校房源页面信息与指南文章内容。',
    listings: '房源刊登规则', listingRules: ['仅刊登已确认广告刊登许可的房源（REINS“可转载广告”或卖方・委托中介同意）。', '价格为卖方挂牌价，并非成交价或市场行情。', '销售情况可能变化，最新情况请咨询。', '门牌与房号等仅在获准刊登的范围内显示。'],
    editorial: '文章撰写方式', editorialRules: ['税务与法律等内容会核对国税厅、国土交通省等官方信息并注明出处。', '计算示例仅供参考，并非个别税务或法律建议。', '“常见情况”为假设案例，并非实际交易，并会明确标示。', '内容由审校者确认，并随制度变化更新。'],
    contact: '联系我们', contactBody: '无需注册即可通过电子邮件、LINE、WhatsApp 或微信咨询。', listingsCta: '查找房源',
  },
} as const

function textFor(locale: string) {
  return copy[locale as keyof typeof copy] ?? copy.en
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const text = textFor(locale)
  const alternates = localeAlternates('/about', locale)
  return { title: text.title, description: text.description, alternates, ...shareMetadata({ title: text.title, description: text.description, url: alternates.canonical, locale }) }
}

export default async function AboutPage() {
  const locale = await getLocale()
  const text = textFor(locale)
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: text.title,
    inLanguage: getSchemaLanguage(locale),
    url: localeAlternates('/about', locale).canonical,
    about: {
      '@type': 'RealEstateAgent',
      name: OPERATOR_NAME,
      alternateName: [OPERATOR_NAME_JA, SITE_NAME],
      url: absoluteUrl('/'),
      email: CONTACT_EMAIL,
      address: { '@type': 'PostalAddress', streetAddress: '柳橋1丁目11番5号 柳橋ビル305号室', addressLocality: '台東区', addressRegion: '東京都', postalCode: '111-0052', addressCountry: 'JP' },
      employee: { '@type': 'Person', name: locale === 'en' ? GUIDE_SUPERVISOR.en : GUIDE_SUPERVISOR.ja, jobTitle: '宅地建物取引士', image: absoluteUrl(GUIDE_SUPERVISOR_PHOTO) },
    },
  }
  const section = 'mt-10 rounded-2xl border border-[#dbe2e9] bg-white p-6'
  const heading = 'flex items-center gap-2 text-xl font-semibold'
  return <div className="container max-w-4xl py-12 text-[#1b293a]">
    <JsonLd data={structured} />
    <h1 className="text-3xl font-semibold md:text-4xl">{text.title}</h1>
    <p className="mt-4 leading-8 text-[#536274]">{text.intro}</p>

    <section className={section} aria-labelledby="about-company">
      <h2 id="about-company" className={heading}><Building2 aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.company}</h2>
      <dl className="mt-4 divide-y divide-[#eef2f6] text-sm">{text.companyRows.map(([label, value]) => <div key={label} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr]"><dt className="font-semibold text-[#4a6789]">{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>

    <section className={section} aria-labelledby="about-supervisor">
      <h2 id="about-supervisor" className={heading}><BadgeCheck aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.supervisor}</h2>
      <div className="mt-4 flex items-center gap-4">
        <Image src={GUIDE_SUPERVISOR_PHOTO} alt={text.supervisorName} width={96} height={96} className="h-24 w-24 rounded-full object-cover" />
        <div><p className="font-semibold">{text.supervisorName}</p><p className="mt-1 text-sm leading-6 text-[#536274]">{text.supervisorBody}</p></div>
      </div>
    </section>

    <section className={section} aria-labelledby="about-listings">
      <h2 id="about-listings" className={heading}><ListChecks aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.listings}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#3d4a5a]">{text.listingRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
    </section>

    <section className={section} aria-labelledby="about-editorial">
      <h2 id="about-editorial" className={heading}><BookOpen aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.editorial}</h2>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-[#3d4a5a]">{text.editorialRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
    </section>

    <section className={section} aria-labelledby="about-contact">
      <h2 id="about-contact" className={heading}><Mail aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.contact}</h2>
      <p className="mt-3 text-sm leading-7 text-[#536274]">{text.contactBody}</p>
      <ul className="mt-3 flex flex-wrap gap-2 text-sm">
        <li><a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd9e3] px-4 font-semibold text-[#274d7d] hover:bg-[#f2f6fa]">{CONTACT_EMAIL}</a></li>
        <li><a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd9e3] px-4 font-semibold text-[#274d7d] hover:bg-[#f2f6fa]">LINE {LINE_ID}</a></li>
        <li><a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd9e3] px-4 font-semibold text-[#274d7d] hover:bg-[#f2f6fa]">WhatsApp</a></li>
        <li><a href={WECHAT_DEEP_LINK} className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd9e3] px-4 font-semibold text-[#274d7d] hover:bg-[#f2f6fa]">WeChat {WECHAT_ID}</a></li>
      </ul>
    </section>

    <Link href="/listings" className="mt-10 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#274d7d] px-6 font-semibold text-white hover:bg-[#18375f]">{text.listingsCta}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
  </div>
}
