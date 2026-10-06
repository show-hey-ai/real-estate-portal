import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, Globe2, MessagesSquare } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { ListingCard } from '@/components/listing/listing-card'
import { GuideReviewer } from '@/components/guides/guide-extras'
import { BUDGET_SLUGS, budgetBand } from '@/lib/collections'
import { CONTACT_EMAIL, LINE_ADD_URL, WECHAT_DEEP_LINK, WHATSAPP_NUMBER } from '@/lib/contact-channels'
import { approxBandLabel, getJpyRates } from '@/lib/fx'
import { withCardFacts } from '@/lib/card-facts'
import { localeAlternates } from '@/lib/locale-url'
import { priceBandRange } from '@/lib/price-bands'
import { getLatestListingCards } from '@/lib/public-listing-cards'
import { getSchemaLanguage, shareMetadata } from '@/lib/site-config'

/**
 * Entry page for international buyers: answers the first questions people search
 * ("can foreigners buy in Tokyo", "東京買房 外國人") and links to listings, tools and guides.
 */

interface QuickAnswer { question: string; answer: string; href: string }

const copy = {
  en: {
    title: 'Buying Property in Tokyo as a Foreigner: Listings, Costs and Steps',
    description: 'Yes, foreigners can buy property in Tokyo without a visa or residence. How mortgages, costs, taxes and the buying process work, with current listings in USD and yen.',
    lead: 'Yes. Foreigners can buy property in Tokyo without a visa or residence in Japan, with the same ownership rights as Japanese buyers. Most overseas buyers pay cash; a mortgage usually needs Japanese residence status or a company in Japan. Budget roughly 6–7% of the price for purchase costs in a cash purchase.',
    answers: [
      { question: 'Can foreigners own property in Japan?', answer: 'Yes, including the land, with no nationality restriction.', href: '/guides/buying-property-japan-visa' },
      { question: 'Do I get a visa by buying?', answer: 'No. Property does not give residence status.', href: '/guides/buying-property-japan-visa' },
      { question: 'Can I get a mortgage?', answer: 'Possible with Japanese residence status or through a Japanese company; otherwise cash is usual.', href: '/buying-guide' },
      { question: 'What does it cost on top of the price?', answer: 'About 6–7% in cash; each listing has an initial cost simulator.', href: '/buying-guide' },
      { question: 'How long does it take?', answer: 'Usually one to two months from offer to handover.', href: '/buying-guide' },
      { question: 'Can I rent it out from abroad?', answer: 'Yes, through a management company; rent to non-residents has 20.42% withheld.', href: '/guides/renting-out-tokyo-condo-from-overseas' },
    ] as QuickAnswer[],
    latest: 'Latest properties', all: 'All properties', budgets: 'Browse by budget', guides: 'Read the buying guide', contact: 'Talk to us in English, Chinese or Japanese', contactBody: 'No sign-up needed. We reply by WhatsApp, LINE, WeChat or email.',
  },
  'zh-TW': {
    title: '外國人在東京買房指南：物件、費用與流程',
    description: '外國人不需簽證或居留也能在東京買房。說明貸款、費用、稅金與購屋流程，並以新台幣與日圓顯示最新物件。',
    lead: '可以。外國人不需日本簽證或居留，也能在東京購買不動產，享有與日本人相同的所有權（包含土地）。海外買家多以現金購買；貸款通常需要日本在留資格或在日本設立公司。現金購買時，雜費約為物件價格的6〜7%。',
    answers: [
      { question: '外國人可以擁有日本不動產嗎？', answer: '可以，包含土地，沒有國籍限制。', href: '/guides/buying-property-japan-visa' },
      { question: '買房能拿到簽證嗎？', answer: '不能。持有不動產不會取得在留資格。', href: '/guides/buying-property-japan-visa' },
      { question: '可以貸款嗎？', answer: '持有日本在留資格或以日本法人名義有機會；否則多為現金購買。', href: '/buying-guide' },
      { question: '價格之外要多少費用？', answer: '現金購買約6〜7%，每個物件頁面都有初期費用試算。', href: '/buying-guide' },
      { question: '需要多久？', answer: '從出價到交屋通常1〜2個月。', href: '/buying-guide' },
      { question: '人在海外可以出租嗎？', answer: '可以，委託管理公司；支付給非居住者的租金需預扣20.42%。', href: '/guides/renting-out-tokyo-condo-from-overseas' },
    ] as QuickAnswer[],
    latest: '最新物件', all: '查看所有物件', budgets: '依預算尋找', guides: '閱讀購屋指南', contact: '可用中文、日文、英文諮詢', contactBody: '免註冊，可透過 LINE、微信、WhatsApp 或電子郵件聯絡。',
  },
  'zh-CN': {
    title: '外国人在东京买房指南：房源、费用与流程',
    description: '外国人无需签证或居留也能在东京买房。说明贷款、费用、税金与购房流程，并以人民币与日元显示最新房源。',
    lead: '可以。外国人无需日本签证或居留，也能在东京购买房产，享有与日本人相同的所有权（包括土地，即永久产权）。海外买家多为全款购买；贷款通常需要日本在留资格或在日本设立公司。全款购买时，杂费约为房价的6〜7%。',
    answers: [
      { question: '外国人可以拥有日本房产吗？', answer: '可以，包括土地，没有国籍限制。', href: '/guides/buying-property-japan-visa' },
      { question: '买房能拿到签证吗？', answer: '不能。持有房产不会获得在留资格。', href: '/guides/buying-property-japan-visa' },
      { question: '可以贷款吗？', answer: '持有日本在留资格或以日本法人名义有机会；否则多为全款购买。', href: '/buying-guide' },
      { question: '房价之外要多少费用？', answer: '全款约6〜7%，每个房源页面都有初期费用试算。', href: '/buying-guide' },
      { question: '需要多久？', answer: '从出价到交房通常1〜2个月。', href: '/buying-guide' },
      { question: '人在海外可以出租吗？', answer: '可以，委托管理公司；支付给非居住者的租金需预扣20.42%。', href: '/guides/renting-out-tokyo-condo-from-overseas' },
    ] as QuickAnswer[],
    latest: '最新房源', all: '查看全部房源', budgets: '按预算查找', guides: '阅读购房指南', contact: '可用中文、日语、英语咨询', contactBody: '无需注册，可通过微信、LINE、WhatsApp 或电子邮件联系。',
  },
  ja: {
    title: '外国人が東京で不動産を買うには：物件・費用・流れ',
    description: '外国人はビザや居住がなくても東京の不動産を購入できます。ローン・費用・税金・購入の流れと、公開中の物件をまとめました。',
    lead: '外国人の方も、日本のビザや居住がなくても東京の不動産を購入でき、日本人と同じ所有権（土地を含む）を持てます。海外のお客様は現金購入が中心で、ローンには日本の在留資格や日本法人が必要になることが多いです。現金購入の場合、諸費用は物件価格の6〜7%程度が目安です。',
    answers: [
      { question: '外国人も不動産を所有できますか？', answer: 'できます。土地も含め、国籍による制限はありません。', href: '/guides/buying-property-japan-visa' },
      { question: '買うとビザがもらえますか？', answer: 'もらえません。不動産の所有は在留資格になりません。', href: '/guides/buying-property-japan-visa' },
      { question: 'ローンは使えますか？', answer: '日本の在留資格がある場合や日本法人なら可能性があります。それ以外は現金購入が一般的です。', href: '/buying-guide' },
      { question: '価格のほかにいくらかかりますか？', answer: '現金購入で約6〜7%。物件ページごとに初期費用を試算できます。', href: '/buying-guide' },
      { question: 'どれくらいの期間がかかりますか？', answer: '申込から引渡しまで、通常1〜2か月です。', href: '/buying-guide' },
      { question: '海外から賃貸に出せますか？', answer: '管理会社に任せて貸せます。非居住者への家賃は20.42%が源泉徴収されます。', href: '/guides/renting-out-tokyo-condo-from-overseas' },
    ] as QuickAnswer[],
    latest: '最新の物件', all: 'すべての物件', budgets: '予算から探す', guides: '購入ガイドを読む', contact: '日本語・英語・中国語でご相談ください', contactBody: '登録不要。LINE・WhatsApp・WeChat・メールでお返事します。',
  },
} as const

function textFor(locale: string) {
  return copy[locale as keyof typeof copy] ?? copy.en
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const text = textFor(locale)
  const alternates = localeAlternates('/buy-property-in-tokyo', locale)
  return { title: text.title, description: text.description, alternates, ...shareMetadata({ title: text.title, description: text.description, url: alternates.canonical, locale }) }
}

export default async function BuyPropertyInTokyoPage() {
  const [locale, rates, latest] = await Promise.all([getLocale(), getJpyRates(), getLatestListingCards(6)])
  const text = textFor(locale)
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: getSchemaLanguage(locale),
    mainEntity: text.answers.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })),
  }
  const button = 'inline-flex min-h-11 items-center gap-2 rounded-lg border border-[#cfd9e3] bg-white px-4 text-sm font-semibold text-[#274d7d] hover:bg-[#f2f6fa]'
  return <div className="container py-12 text-[#1b293a]">
    <JsonLd data={faq} />
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]"><Globe2 aria-hidden="true" className="h-4 w-4" />Welcome Home Tokyo</p>
    <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{text.title}</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-[#3d4a5a]">{text.lead}</p>
    <div className="max-w-3xl"><GuideReviewer locale={locale} /></div>

    <section className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="FAQ">
      {text.answers.map((item) => <Link key={item.question} href={item.href} className="group rounded-xl border border-[#dbe2e9] bg-white p-5 transition-shadow hover:shadow-lg">
        <h2 className="font-semibold group-hover:underline">{item.question}</h2>
        <p className="mt-2 text-sm leading-6 text-[#536274]">{item.answer}</p>
      </Link>)}
    </section>

    {latest.length > 0 && <section className="mt-12" aria-labelledby="intl-latest">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <h2 id="intl-latest" className="text-2xl font-semibold">{text.latest}</h2>
        <Link href="/listings" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d]">{text.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{latest.map((home) => <ListingCard key={home.id} listing={withCardFacts(home)} showFavoriteButton={false} />)}</div>
    </section>}

    <section className="mt-12" aria-labelledby="intl-budgets">
      <h2 id="intl-budgets" className="text-2xl font-semibold">{text.budgets}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {BUDGET_SLUGS.map((slug) => {
          const band = budgetBand(slug)!
          const local = approxBandLabel(band, locale, rates)
          return <li key={slug}><Link href={`/budget/${slug}`} className={button}>{priceBandRange(band, locale)}{local && <span className="font-normal text-[#536274]">{local}</span>}</Link></li>
        })}
      </ul>
      <Link href="/buying-guide" className="mt-6 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d]">{text.guides}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </section>

    <section className="mt-12 rounded-2xl bg-[#f4f7fb] p-6" aria-labelledby="intl-contact">
      <h2 id="intl-contact" className="flex items-center gap-2 text-xl font-semibold"><MessagesSquare aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.contact}</h2>
      <p className="mt-2 text-sm text-[#536274]">{text.contactBody}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className={button}>WhatsApp</a>
        <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" className={button}>LINE</a>
        <a href={WECHAT_DEEP_LINK} className={button}>WeChat</a>
        <a href={`mailto:${CONTACT_EMAIL}`} className={button}>{CONTACT_EMAIL}</a>
      </div>
    </section>
  </div>
}
