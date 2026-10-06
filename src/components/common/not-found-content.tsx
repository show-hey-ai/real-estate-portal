import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, BookOpen, Search, SlidersHorizontal } from 'lucide-react'
import { ListingCard } from '@/components/listing/listing-card'
import { getLatestListingCards } from '@/lib/public-listing-cards'
import { withCardFacts } from '@/lib/card-facts'

const copy = {
  ja: { title: 'ページが見つかりません', body: '物件の販売が終了したか、URLが変更された可能性があります。公開中の物件から探すか、ご希望の条件をお知らせください。', listings: '公開中の物件を見る', match: '購入条件を整理する', guide: '購入ガイドを読む', latest: '新着の物件' },
  en: { title: 'Page not found', body: 'The property may have been sold or the address may have changed. Browse the properties for sale now, or tell us what you are looking for.', listings: 'Browse properties for sale', match: 'Set your purchase criteria', guide: 'Read the buying guide', latest: 'Newly listed' },
  'zh-TW': { title: '找不到此頁面', body: '物件可能已售出或網址已變更。請瀏覽目前刊登中的物件，或告訴我們您的條件。', listings: '查看刊登中的物件', match: '整理購屋條件', guide: '閱讀購屋指南', latest: '最新物件' },
  'zh-CN': { title: '找不到此页面', body: '房源可能已售出或网址已变更。请浏览当前在售房源，或告诉我们您的条件。', listings: '查看在售房源', match: '整理购房条件', guide: '阅读购房指南', latest: '最新房源' },
} as const

export async function NotFoundContent() {
  const locale = await getLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const latest = await getLatestListingCards(3)
  const links = [
    { href: '/listings', label: text.listings, Icon: Search, primary: true },
    { href: '/match', label: text.match, Icon: SlidersHorizontal, primary: false },
    { href: '/buying-guide', label: text.guide, Icon: BookOpen, primary: false },
  ]
  return <main className="container max-w-5xl py-16 text-center text-[#1b293a] md:py-24" data-testid="not-found">
    <p className="text-sm font-semibold tracking-widest text-[#4a6789]">404</p>
    <h1 className="mt-3 text-2xl font-semibold md:text-3xl">{text.title}</h1>
    <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#536274]">{text.body}</p>
    <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
      {links.map(({ href, label, Icon, primary }) => <Link key={href} href={href} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold ${primary ? 'bg-[#274d7d] text-white hover:bg-[#18375f]' : 'border border-[#cfd9e3] text-[#274d7d] hover:bg-[#f2f6fa]'}`}><Icon aria-hidden="true" className="h-4 w-4" />{label}{primary && <ArrowRight aria-hidden="true" className="h-4 w-4" />}</Link>)}
    </div>
    {latest.length > 0 && <section className="mt-14 text-left" aria-labelledby="not-found-latest">
      <h2 id="not-found-latest" className="text-lg font-semibold">{text.latest}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{latest.map((home) => <ListingCard key={home.id} listing={withCardFacts(home)} showFavoriteButton={false} />)}</div>
    </section>}
  </main>
}
