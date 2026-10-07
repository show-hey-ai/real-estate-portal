import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { BookOpen } from 'lucide-react'
import { getPublicArticles } from '@/lib/portal-articles'
import { getGuideArticles } from '@/content/guides'
import { GuideCard } from '@/components/guides/guide-card'
import { getGuideUiCopy, normalizeGuideLocale } from '@/lib/guides'
import { type Locale } from '@/i18n/config'
import { shareMetadata } from '@/lib/site-config'
import { localeAlternates } from '@/lib/locale-url'

export const dynamic = 'force-dynamic'

const GUIDE_ORDER = ['buying-property-japan-visa', 'how-to-buy-japan-investment-property', 'japan-property-foreign-exchange-report', 'tokyo-fixed-asset-tax-city-planning-tax', 'japanese-property-listing-terms', 'japan-earthquake-standards-1981', 'tokyo-earthquake-flood-risk-check', 'tokyo-condo-management-fee-repair-reserve', 'renting-out-tokyo-condo-from-overseas', 'selling-tokyo-property-costs-taxes', 'leasehold-vs-freehold-tokyo', 'renovating-resale-condo-tokyo', 'tokyo-condo-minpaku-short-term-rental-rules', 'tokyo-cap-rate-guide', 'personal-vs-company-japan-property']
const SECTION_TEXT = {
  ja: { guides: (count: number) => `購入ガイド（${count}本）`, allGuides: 'ガイド一覧', insights: '物件選びの記事' },
  en: { guides: (count: number) => `Buying guides (${count})`, allGuides: 'All guides', insights: 'Property insights' },
  'zh-TW': { guides: (count: number) => `購屋指南（${count}篇）`, allGuides: '所有指南', insights: '物件分析文章' },
  'zh-CN': { guides: (count: number) => `购房指南（${count}篇）`, allGuides: '全部指南', insights: '房源分析文章' },
} as const
const indexCopy = {
  ja: { title: '東京の不動産購入に役立つ記事｜Welcome Home Tokyo', description: '日本の不動産市場、購入の流れ、仲介の慣習を解説。公開中の東京の物件を比較した多言語の記事です。' },
  en: { title: 'Japan Real Estate Guides | Welcome Home Tokyo', description: 'Understand Japan property markets, buying procedures and brokerage customs. Compare current Tokyo listings with source-backed multilingual guides.' },
  'zh-TW': { title: '東京購屋實用文章｜Welcome Home Tokyo', description: '解說日本不動產市場、購屋流程與仲介慣例，並比較目前刊登中的東京物件。' },
  'zh-CN': { title: '东京购房实用文章｜Welcome Home Tokyo', description: '解说日本房产市场、购房流程与中介惯例，并比较当前在售的东京房源。' },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = indexCopy[locale as keyof typeof indexCopy] ?? indexCopy.en
  const alternates = localeAlternates('/articles', locale)
  return { title: { absolute: copy.title }, description: copy.description, alternates, ...shareMetadata({ title: copy.title, description: copy.description, url: alternates.canonical, locale }) }
}

export default async function ArticlesPage() {
  const [articles, locale] = await Promise.all([getPublicArticles(), getLocale()])
  const heading = { ja: '日本の不動産を知る・選ぶ', en: 'Understanding and buying property in Japan', 'zh-TW': '了解日本不動產與購屋', 'zh-CN': '了解日本房产与购房' }[locale as Locale]
  const guideLocale = normalizeGuideLocale(locale)
  const guideUi = getGuideUiCopy(guideLocale)
  // Foreign-buyer basics first; the guide list is short enough to show in full.
  const guides = getGuideArticles(guideLocale).toSorted((left, right) => GUIDE_ORDER.indexOf(left.slug) - GUIDE_ORDER.indexOf(right.slug))
  const sectionText = SECTION_TEXT[locale as keyof typeof SECTION_TEXT] ?? SECTION_TEXT.en
  return <div className="container py-12"><p className="mb-3 text-sm uppercase tracking-widest text-muted-foreground">Welcome Home Tokyo</p><h1 className="text-4xl font-semibold">{heading}</h1>
    <section className="mt-10" aria-labelledby="guides-title">
      <div className="flex flex-wrap items-end justify-between gap-3"><h2 id="guides-title" className="text-2xl font-semibold">{sectionText.guides(guides.length)}</h2><Link href="/guides" className="text-sm font-semibold text-[#274d7d] hover:underline">{sectionText.allGuides} →</Link></div>
      <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{guides.map((guide) => <GuideCard key={guide.slug} article={guide} locale={guideLocale} ctaLabel={guideUi.readArticle} />)}</div>
    </section>
    {articles.length > 0 && <h2 className="mt-14 text-2xl font-semibold">{sectionText.insights}</h2>}<div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.slug} className="rounded-xl border p-6"><Link href={`/articles/${article.slug}/${locale}`} tabIndex={-1} aria-hidden="true">{article.locales[locale as Locale].hero ? <Image src={article.locales[locale as Locale].hero!.url} alt="" width={768} height={512} className="mb-5 aspect-[3/2] w-full rounded-lg object-cover" /> : <div className="mb-5 flex aspect-[3/2] w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,#e8f1fb_0%,#dbe8f4_55%,#c9daea_100%)]"><BookOpen className="h-10 w-10 text-[#4a6789]" /></div>}</Link><time className="text-xs text-muted-foreground" dateTime={article.updatedAt.toISOString()}>{article.updatedAt.toLocaleDateString(locale, { timeZone: 'Asia/Tokyo' })}</time><h2 className="mt-4 text-xl font-semibold"><Link href={`/articles/${article.slug}/${locale}`} className="hover:underline">{article.locales[locale as Locale].title}</Link></h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{article.locales[locale as Locale].description}</p></article>)}</div>{!articles.length && <p className="mt-8 text-muted-foreground">{locale === 'ja' ? '公開物件の比較は物件一覧からご覧ください。' : 'Browse the current property selection to compare available listings.'} <Link href="/listings" className="underline">{locale === 'ja' ? '物件一覧' : 'View properties'}</Link></p>}</div>
}
