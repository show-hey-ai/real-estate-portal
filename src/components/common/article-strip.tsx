import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import type { getPublicArticles } from '@/lib/portal-articles'

type Article = Awaited<ReturnType<typeof getPublicArticles>>[number]

const copy = {
  ja: { title: '物件選びに役立つ記事', all: '記事一覧' },
  en: { title: 'Guides for buying in Tokyo', all: 'All articles' },
  'zh-TW': { title: '選購物件實用文章', all: '所有文章' },
  'zh-CN': { title: '选购房源实用文章', all: '全部文章' },
} as const

const MAX_ARTICLES = 3

interface ArticleStripProps {
  articles: Article[]
  locale: string
}

/** Newest articles with their illustrations, linking the home page into the article pages. */
export function ArticleStrip({ articles, locale }: ArticleStripProps) {
  const lang = (locale in copy ? locale : 'en') as Locale
  const text = copy[lang as keyof typeof copy]
  // Illustrated articles first; the sort is stable, so newest-first order holds within each group.
  const items = articles.filter((article) => article.locales[lang]?.title)
    .toSorted((left, right) => Number(Boolean(right.locales[lang].hero)) - Number(Boolean(left.locales[lang].hero)))
    .slice(0, MAX_ARTICLES)
  if (!items.length) return null
  return <section className="mt-12" aria-labelledby="home-articles-title" data-testid="home-articles">
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <h2 id="home-articles-title" className="flex items-center gap-2 text-xl font-semibold md:text-2xl"><BookOpen aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.title}</h2>
      <Link href="/articles" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#274d7d]">{text.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((article) => {
        const content = article.locales[lang]
        const href = `/articles/${article.slug}/${lang}`
        return <Link key={article.slug} href={href} className="group overflow-hidden rounded-xl border border-[#dbe2e9] bg-white transition-shadow hover:shadow-lg">
          <div className="relative aspect-[3/2] bg-[#eef2f6]">
            {content.hero
              ? <Image src={content.hero.url} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              : <div aria-hidden="true" className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#e8f1fb_0%,#dbe8f4_55%,#c9daea_100%)]"><BookOpen className="h-10 w-10 text-[#4a6789]" /></div>}
          </div>
          <div className="p-4">
            <h3 className="line-clamp-2 font-semibold leading-6 text-[#1b293a] group-hover:underline">{content.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#536274]">{content.description}</p>
          </div>
        </Link>
      })}
    </div>
  </section>
}
