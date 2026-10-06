import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { getLocale } from 'next-intl/server'
import { getPublicArticles } from '@/lib/portal-articles'
import { type Locale } from '@/i18n/config'
import { shareMetadata } from '@/lib/site-config'
import { localeAlternates } from '@/lib/locale-url'

export const dynamic = 'force-dynamic'
const indexCopy = {
  ja: { title: '東京の不動産購入に役立つ記事 | 自由不動産', description: '日本の不動産市場、購入の流れ、仲介の慣習を解説。公開中の東京の物件を比較した多言語の記事です。' },
  en: { title: 'Japan Real Estate Guides | Ziyou', description: 'Understand Japan property markets, buying procedures and brokerage customs. Compare current Tokyo listings with source-backed multilingual guides.' },
  'zh-TW': { title: '東京購屋實用文章 | 自由不動產', description: '解說日本不動產市場、購屋流程與仲介慣例，並比較目前刊登中的東京物件。' },
  'zh-CN': { title: '东京购房实用文章 | 自由不动产', description: '解说日本房产市场、购房流程与中介惯例，并比较当前在售的东京房源。' },
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
  return <div className="container py-12"><p className="mb-3 text-sm uppercase tracking-widest text-muted-foreground">Ziyou / Tokyo</p><h1 className="text-4xl font-semibold">{heading}</h1><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <article key={article.slug} className="rounded-xl border p-6">{article.locales[locale as Locale].hero && <Link href={`/articles/${article.slug}/${locale}`}><Image src={article.locales[locale as Locale].hero!.url} alt={article.locales[locale as Locale].hero!.alt} width={768} height={512} className="mb-5 aspect-[3/2] w-full rounded-lg object-cover" /></Link>}<time className="text-xs text-muted-foreground" dateTime={article.updatedAt.toISOString()}>{article.updatedAt.toLocaleDateString(locale, { timeZone: 'Asia/Tokyo' })}</time><h2 className="mt-4 text-xl font-semibold"><Link href={`/articles/${article.slug}/${locale}`} className="hover:underline">{article.locales[locale as Locale].title}</Link></h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{article.locales[locale as Locale].description}</p></article>)}</div>{!articles.length && <p className="mt-8 text-muted-foreground">{locale === 'ja' ? '公開物件の比較は物件一覧からご覧ください。' : 'Browse the current property selection to compare available listings.'} <Link href="/listings" className="underline">{locale === 'ja' ? '物件一覧' : 'View properties'}</Link></p>}</div>
}
