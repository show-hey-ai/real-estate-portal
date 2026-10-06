import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { locales, type Locale, localeNames } from '@/i18n/config'
import { getPublicArticle } from '@/lib/portal-articles'
import { absoluteUrl, getSchemaLanguage } from '@/lib/site-config'
import { JsonLd } from '@/components/common/json-ld'
import { ArticleSourceGallery } from '@/components/articles/article-source-gallery'
import { prisma } from '@/lib/db'

const COVER_PRIORITY = ['EXTERIOR', 'INTERIOR', 'FLOORPLAN'] as const

async function coverImages(listingIds: string[]): Promise<Map<string, string>> {
  if (!listingIds.length) return new Map()
  const media = await prisma.media.findMany({ where: { listingId: { in: listingIds }, isAdopted: true, category: { in: [...COVER_PRIORITY] } }, select: { listingId: true, url: true, category: true, sortOrder: true }, orderBy: { sortOrder: 'asc' } }).catch(() => [])
  const covers = new Map<string, string>()
  for (const category of COVER_PRIORITY) for (const item of media) if (item.category === category && !covers.has(item.listingId)) covers.set(item.listingId, item.url)
  return covers
}

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string; lang: string }> }
function validLocale(lang: string): lang is Locale { return locales.includes(lang as Locale) }
function articleUrl(slug: string, lang: string) { return absoluteUrl(`/articles/${slug}/${lang}`) }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params
  const article = validLocale(lang) ? await getPublicArticle(slug) : null
  if (!article || !validLocale(lang)) return { robots: { index: false, follow: false } }
  const content = article.locales[lang]
  const url = articleUrl(slug, lang)
  return { title: content.title, description: content.description, alternates: { canonical: url, languages: { ...Object.fromEntries(locales.map((locale) => [getSchemaLanguage(locale), articleUrl(slug, locale)])), 'x-default': articleUrl(slug, 'en') } }, openGraph: { type: 'article', url, title: content.title, description: content.description, images: content.hero ? [{ url: absoluteUrl(content.hero.url), width: 1536, height: 1024, alt: content.hero.alt }] : undefined, modifiedTime: article.updatedAt.toISOString(), publishedTime: article.publishedAt?.toISOString() }, robots: { index: true, follow: true } }
}

export default async function ArticlePage({ params }: Props) {
  const { slug, lang } = await params
  if (!validLocale(lang)) notFound()
  const article = await getPublicArticle(slug)
  if (!article) notFound()
  const content = article.locales[lang]
  const covers = await coverImages(article.sources.map((source) => source.id))
  const labels = {
    ja: { back: '物件選びの記事', sources: '参照物件', all: article.city ? 'この区の物件を探す' : '東京の物件を探す', references: '出典・参考資料', updated: '更新', author: 'Welcome Home Tokyo' },
    en: { back: 'Property insights', sources: 'Source listings', all: article.city ? 'Browse properties in this ward' : 'Browse Tokyo properties', references: 'Sources and further reading', updated: 'Updated', author: 'Welcome Home Tokyo' },
    'zh-TW': { back: '購屋資訊', sources: '參照物件', all: article.city ? '查看本區物件' : '查看東京物件', references: '出處與參考資料', updated: '更新', author: 'Welcome Home Tokyo' },
    'zh-CN': { back: '购房资讯', sources: '参考房产', all: article.city ? '查看本区房产' : '查看东京房产', references: '出处与参考资料', updated: '更新', author: 'Welcome Home Tokyo' },
  }[lang]
  const structured = { '@context': 'https://schema.org', '@type': 'Article', headline: content.title, description: content.description, inLanguage: getSchemaLanguage(lang), datePublished: article.publishedAt?.toISOString(), dateModified: article.updatedAt.toISOString(), author: { '@type': 'Organization', name: labels.author, url: absoluteUrl('/') }, mainEntityOfPage: articleUrl(slug, lang), image: content.hero ? absoluteUrl(content.hero.url) : undefined, citation: [...article.sources.map((source) => absoluteUrl(`/listings/${source.id}`)), ...(content.references?.map(ref => ref.url) || [])] }
  return <article data-article-slug={slug} data-source-hash={article.sourceHash} lang={getSchemaLanguage(lang)} className="container max-w-4xl py-12"><JsonLd data={structured} /><Link href="/articles" className="text-sm text-muted-foreground hover:underline">← {labels.back}</Link><h1 className="mt-6 text-3xl font-semibold leading-tight md:text-4xl">{content.title}</h1><p className="mt-4 text-sm text-muted-foreground">{labels.author} · {labels.updated} <time dateTime={article.updatedAt.toISOString()}>{article.updatedAt.toLocaleDateString(lang, { timeZone: 'Asia/Tokyo' })}</time></p><nav aria-label="Languages" className="my-6 flex flex-wrap gap-4 text-sm">{locales.map((locale) => <Link key={locale} href={`/articles/${slug}/${locale}`} hrefLang={getSchemaLanguage(locale)} className={locale === lang ? 'font-semibold' : 'underline'}>{localeNames[locale]}</Link>)}</nav><p className="text-lg leading-8 text-muted-foreground">{content.description}</p>{content.hero && <figure className="mt-8 overflow-hidden rounded-2xl"><Image src={content.hero.url} alt={content.hero.alt} width={1536} height={1024} priority className="h-auto w-full" /><figcaption className="mt-3 text-sm text-muted-foreground">{content.hero.caption}</figcaption></figure>}<nav aria-label={content.title} className="mt-8 rounded-xl bg-muted/30 p-5"><ol className="space-y-2 text-sm">{content.sections.map((section, index) => <li key={index}><a href={`#section-${index}`} className="hover:underline">{section.heading}</a></li>)}</ol></nav>{content.sections.map((section, sectionIndex) => <section id={`section-${sectionIndex}`} key={section.heading} className="mt-10 scroll-mt-44"><h2 className="mb-4 text-2xl font-semibold">{section.heading}</h2><div className="space-y-4">{section.paragraphs.map((paragraph, index) => <p key={index} className="leading-8 text-muted-foreground">{paragraph}</p>)}</div></section>)}{article.sources.length > 0 && <><ArticleSourceGallery locale={lang} sources={article.sources.map((source) => ({ ...source, imageUrl: covers.get(source.id) ?? null }))} />{article.city && <Link href={`/listings?ward=${encodeURIComponent(article.city)}`} className="mt-5 inline-block text-sm font-semibold text-[#274d7d] underline">{labels.all}</Link>}</>}{content.references && <section className="mt-10 border-t pt-6"><h2 className="text-lg font-semibold">{labels.references}</h2><ul className="mt-3 space-y-2 text-sm">{content.references.map(ref => <li key={ref.url}><a href={ref.url} target="_blank" rel="noopener noreferrer" className="underline">{ref.title}</a></li>)}</ul></section>}<p className="my-7 text-sm leading-7 text-muted-foreground">{content.notice}</p><Link href="/match" className="inline-block rounded-md bg-primary px-6 py-3 text-primary-foreground">{content.cta}</Link></article>
}
