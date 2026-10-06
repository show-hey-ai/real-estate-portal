import Link from 'next/link'
import { ArrowRight, Building2, MapPin, type LucideIcon } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { ListingCard } from '@/components/listing/listing-card'
import { UnitPriceChart } from '@/components/listing/unit-price-chart'
import { toCardListing, type PublicListingRow } from '@/lib/public-listing-cards'
import { localizedPath } from '@/lib/locale-url'
import { absoluteUrl, getSchemaLanguage } from '@/lib/site-config'
import { translatePropertyType } from '@/lib/translate-fields'
import { unitPriceOf } from '@/lib/unit-price'
import { WARD_SLUGS, countByWard, summarizeWard, wardLabel } from '@/lib/ward-tile-map'
import { formatYenWords } from '@/lib/yen-words'
import { extractBuildingName } from '@/lib/building-name'
import { withCardFacts } from '@/lib/card-facts'
import { ListingAlertForm } from '@/components/alerts/listing-alert-form'
import type { BudgetSlug, TypeSlug } from '@/lib/collections'

const labels = {
  ja: { home: 'ホーム', range: '掲載価格の範囲', types: '物件の種類', wards: 'エリア別', listings: '公開中の物件', unitTitle: '物件ごとの㎡単価', unitNote: '公開中の物件の売出価格を面積で割った参考値です。成約価格や相場ではありません。', all: '条件を指定して探す', match: '購入条件を整理する', count: (count: number) => `${count}件` },
  en: { home: 'Home', range: 'Asking-price range', types: 'Property types', wards: 'By ward', listings: 'Properties for sale', unitTitle: 'Price per m² by listing', unitNote: 'Asking price divided by area for each listing; not transaction prices or a market valuation.', all: 'Search with filters', match: 'Set your purchase criteria', count: (count: number) => `${count}` },
  'zh-TW': { home: '首頁', range: '刊登價格範圍', types: '物件類型', wards: '依區域', listings: '刊登中的物件', unitTitle: '各物件每平方公尺單價', unitNote: '以刊登物件的開價除以面積計算的參考值，並非成交價或市場行情。', all: '指定條件搜尋', match: '整理購屋條件', count: (count: number) => `${count}筆` },
  'zh-CN': { home: '首页', range: '挂牌价格范围', types: '房源类型', wards: '按区域', listings: '在售房源', unitTitle: '各房源每平方米单价', unitNote: '以在售房源的挂牌价除以面积计算的参考值，并非成交价或市场行情。', all: '指定条件搜索', match: '整理购房条件', count: (count: number) => `${count}套` },
} as const

interface CollectionViewProps {
  locale: string
  path: string
  title: string
  intro: string
  Icon: LucideIcon
  rows: PublicListingRow[]
  filterHref: string
  userId: string | null
  favorites: Set<string>
  /** Filters for the new-listing email form on this page. */
  alert?: { type?: TypeSlug; budget?: BudgetSlug; scopeLabel: string }
}

export function CollectionView({ locale, path, title, intro, Icon, rows, filterHref, userId, favorites, alert }: CollectionViewProps) {
  const text = labels[locale as keyof typeof labels] ?? labels.en
  const summary = summarizeWard(rows)
  const listings = rows.map(toCardListing)
  const pageUrl = absoluteUrl(localizedPath(path, locale))
  const wardCounts = Object.entries(countByWard(rows)).filter(([ward]) => WARD_SLUGS[ward]).sort((left, right) => right[1] - left[1])
  const unitBars = rows
    .map((row) => ({ row, value: unitPriceOf(row) }))
    .filter((item): item is { row: PublicListingRow; value: number } => item.value !== null)
    .sort((left, right) => left.value - right.value)
    .map(({ row, value }) => ({ label: `${row.city ? `${wardLabel(row.city, locale)} · ` : ''}${(locale !== 'en' && extractBuildingName(row.descriptionJa)) || translatePropertyType(row.propertyType, locale)} · ${formatYenWords(Number(row.price), locale)}`, value, href: `/listings/${row.id}` }))
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    url: pageUrl,
    inLanguage: getSchemaLanguage(locale),
    mainEntity: { '@type': 'ItemList', numberOfItems: listings.length, itemListElement: listings.map((home, index) => ({ '@type': 'ListItem', position: index + 1, url: absoluteUrl(localizedPath(`/listings/${home.id}`, locale)) })) },
  }
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: text.home, item: absoluteUrl(localizedPath('/', locale)) },
    { '@type': 'ListItem', position: 2, name: title, item: pageUrl },
  ] }

  return <div className="bg-white text-[#1b293a]" data-testid="collection-page">
    <JsonLd data={structured} />
    <JsonLd data={breadcrumb} />
    <div className="container pb-14 pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#536274]"><Link href="/" className="hover:underline">{text.home}</Link> / <span>{title}</span></nav>
      <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold md:text-3xl"><Icon aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{title}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536274]">{intro}</p>

      {summary.count > 0 && <dl className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4"><dt className="text-xs font-semibold text-[#4a6789]">{text.range}</dt><dd className="mt-1 text-lg font-bold">{summary.minPrice && summary.maxPrice ? `${formatYenWords(summary.minPrice, locale)} 〜 ${formatYenWords(summary.maxPrice, locale)}` : '—'}</dd></div>
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4"><dt className="text-xs font-semibold text-[#4a6789]">{text.types}</dt><dd className="mt-2 flex flex-wrap gap-2">{summary.types.map(({ type, count }) => <span key={type} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-[#dbe2e9]"><Building2 aria-hidden="true" className="h-3.5 w-3.5 text-[#274d7d]" />{translatePropertyType(type, locale)} {count}</span>)}</dd></div>
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4"><dt className="text-xs font-semibold text-[#4a6789]">{text.wards}</dt><dd className="mt-2 flex flex-wrap gap-2">{wardCounts.map(([ward, count]) => <Link key={ward} href={`/areas/${WARD_SLUGS[ward]}`} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-[#dbe2e9] hover:ring-[#274d7d]"><MapPin aria-hidden="true" className="h-3.5 w-3.5 text-[#274d7d]" />{wardLabel(ward, locale)} {text.count(count)}</Link>)}</dd></div>
      </dl>}

      {listings.length > 0 && <section className="mt-10" aria-labelledby="collection-listings-title">
        <h2 id="collection-listings-title" className="text-xl font-semibold">{text.listings}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((home) => <ListingCard key={home.id} listing={withCardFacts(home)} isFavorite={favorites.has(home.id)} userId={userId} />)}</div>
      </section>}

      {unitBars.length >= 2 && <UnitPriceChart locale={locale} title={text.unitTitle} note={text.unitNote} bars={unitBars} />}

      {alert && <ListingAlertForm type={alert.type} budget={alert.budget} scopeLabel={alert.scopeLabel} />}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
        <Link href={filterHref} className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{text.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        <Link href="/match" className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{text.match}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </div>
  </div>
}
