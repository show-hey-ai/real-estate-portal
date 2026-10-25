import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { getOrderedGuideArticles } from '@/content/guides'
import { normalizeGuideLocale } from '@/lib/guides'

const HEADING: Record<string, { title: string; all: string }> = {
  ja: { title: '購入・保有ガイド', all: 'ガイド一覧' },
  en: { title: 'Buying and owning guides', all: 'All guides' },
  'zh-TW': { title: '購屋與持有指南', all: '所有指南' },
  'zh-CN': { title: '购房与持有指南', all: '所有指南' },
}

const PHONE_GUIDE_COUNT = 5

/** Server-rendered guide links for the footer, so every page links to every guide without shipping guide content to the browser. */
export async function FooterGuides() {
  const locale = normalizeGuideLocale(await getLocale())
  const heading = HEADING[locale] ?? HEADING.en
  const guides = getOrderedGuideArticles(locale)

  return (
    <nav aria-label={heading.title} className="mt-10">
      <h2 className="mb-3 text-sm font-semibold"><Link href="/guides" className="hover:underline">{heading.title}</Link></h2>
      <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {/* Phones list the first few guides; "All guides" leads to the rest. */}
        {guides.map((guide, index) => <li key={guide.slug} className={index >= PHONE_GUIDE_COUNT ? 'hidden sm:list-item' : undefined}><Link href={`/guides/${guide.slug}`} className="text-white/65 transition-colors hover:text-white">{guide.title}</Link></li>)}
        <li><Link href="/guides" className="font-medium text-white/85 transition-colors hover:text-white">{heading.all} →</Link></li>
      </ul>
    </nav>
  )
}
