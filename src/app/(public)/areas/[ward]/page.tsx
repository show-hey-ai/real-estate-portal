import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ArrowRight, Building2, MapPin } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { ListingCard } from '@/components/listing/listing-card'
import { WardMap } from '@/components/listing/ward-map'
import { createServiceClient } from '@/lib/supabase/server'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { getOptionalPublicViewer, getFavoriteIdsForViewer } from '@/lib/public-viewer'
import { getPublicArticle } from '@/lib/portal-articles'
import { localeAlternates, localizedPath } from '@/lib/locale-url'
import { absoluteUrl, getSchemaLanguage, shareMetadata } from '@/lib/site-config'
import { translatePropertyType } from '@/lib/translate-fields'
import { countByWard, summarizeWard, wardFromSlug, wardLabel } from '@/lib/ward-tile-map'
import { formatYenWords } from '@/lib/yen-words'
import { pickCoverImage } from '@/lib/cover-image'
import { unitPriceOf } from '@/lib/unit-price'
import { UnitPriceChart } from '@/components/listing/unit-price-chart'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ ward: string }> }

const copy = {
  ja: { unitTitle: '物件ごとの㎡単価', unitNote: '公開中の物件の売出価格を面積で割った参考値です。成約価格や相場ではありません。', title: (ward: string) => `${ward}の売買物件（マンション・戸建て・土地）`, intro: (ward: string, count: number) => `${ward}で公開中の売買物件は${count}件です。価格・広さ・駅距離を比べて、気になる物件は登録なしで相談できます。`, empty: (ward: string) => `${ward}で現在公開中の物件はありません。ご希望の条件をお知らせいただければ、紹介できる物件を確認します。`, range: '掲載価格の範囲', types: '物件の種類', listings: '公開中の物件', article: 'この区の物件比較記事を読む', all: '条件を指定して探す', match: '購入条件を整理する', home: 'ホーム', areas: 'エリア', description: (ward: string, count: number) => `${ward}の売買物件${count}件。中古マンション・戸建て・土地の価格、広さ、駅距離を比較。日本語・英語・中国語で購入相談に対応する自由不動産のポータル。` },
  en: { unitTitle: 'Price per m² by listing', unitNote: 'Asking price divided by area for each listing; not transaction prices or a market valuation.', title: (ward: string) => `Property for sale in ${ward}, Tokyo`, intro: (ward: string, count: number) => `${count} properties are for sale in ${ward} now. Compare prices, sizes and station access, and ask about any of them without signing up.`, empty: (ward: string) => `No properties are listed in ${ward} right now. Tell us what you are looking for and we will check what we can introduce.`, range: 'Asking-price range', types: 'Property types', listings: 'Properties for sale', article: 'Read the property comparison for this ward', all: 'Search with filters', match: 'Set your purchase criteria', home: 'Home', areas: 'Areas', description: (ward: string, count: number) => `${count} properties for sale in ${ward}, Tokyo. Compare condominium, house and land prices, sizes and station access, with support in English, Japanese and Chinese.` },
  'zh-TW': { unitTitle: '各物件每平方公尺單價', unitNote: '以刊登物件的開價除以面積計算的參考值，並非成交價或市場行情。', title: (ward: string) => `${ward}待售物件（公寓・獨棟・土地）`, intro: (ward: string, count: number) => `${ward}目前刊登中的待售物件共${count}筆。可比較價格、面積與車站距離，有興趣的物件免註冊即可諮詢。`, empty: (ward: string) => `${ward}目前沒有刊登中的物件。請告訴我們您的條件，我們會確認可介紹的物件。`, range: '刊登價格範圍', types: '物件類型', listings: '刊登中的物件', article: '閱讀本區物件比較文章', all: '指定條件搜尋', match: '整理購屋條件', home: '首頁', areas: '區域', description: (ward: string, count: number) => `東京${ward}待售物件${count}筆。比較公寓、獨棟與土地的價格、面積與車站距離，提供中文、日文、英文購屋諮詢。` },
  'zh-CN': { unitTitle: '各房源每平方米单价', unitNote: '以在售房源的挂牌价除以面积计算的参考值，并非成交价或市场行情。', title: (ward: string) => `${ward}在售房源（公寓・独栋・土地）`, intro: (ward: string, count: number) => `${ward}当前在售房源共${count}套。可比较价格、面积与车站距离，感兴趣的房源免注册即可咨询。`, empty: (ward: string) => `${ward}目前没有在售房源。请告诉我们您的条件，我们会确认可介绍的房源。`, range: '挂牌价格范围', types: '房源类型', listings: '在售房源', article: '阅读本区房源比较文章', all: '指定条件搜索', match: '整理购房条件', home: '首页', areas: '区域', description: (ward: string, count: number) => `东京${ward}在售房源${count}套。比较公寓、独栋与土地的价格、面积与车站距离，提供中文、日文、英文购房咨询。` },
} as const

function textFor(locale: string) {
  return copy[locale as keyof typeof copy] ?? copy.en
}

async function getPublicRows() {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('id, city, propertyType, price, addressPublic, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, publishedAt, media (url, category, isAdopted)')
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    .order('publishedAt', { ascending: false })
    .limit(500)
  if (error) { console.error('Failed to load ward listings:', error); return [] }
  return data || []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { ward: slug } = await params
  const ward = wardFromSlug(slug)
  if (!ward) return { robots: { index: false, follow: false } }
  const locale = await getLocale()
  const text = textFor(locale)
  const label = wardLabel(ward, locale)
  const wardRows = (await getPublicRows()).filter((row) => row.city === ward)
  const count = wardRows.length
  const cover = wardRows.map((row) => pickCoverImage((row.media || []).filter((item) => item.isAdopted))).find(Boolean)
  const alternates = localeAlternates(`/areas/${slug}`, locale)
  // Empty wards stay reachable from the map but are not offered to search engines as thin pages.
  return { title: text.title(label), description: text.description(label, count), alternates, ...shareMetadata({ title: text.title(label), description: text.description(label, count), url: alternates.canonical, locale, image: cover?.url }), robots: count ? { index: true, follow: true } : { index: false, follow: true } }
}

export default async function WardPage({ params }: Props) {
  const { ward: slug } = await params
  const ward = wardFromSlug(slug)
  if (!ward) notFound()
  const locale = await getLocale()
  const text = textFor(locale)
  const label = wardLabel(ward, locale)
  const [rows, viewer, article] = await Promise.all([getPublicRows(), getOptionalPublicViewer(), getPublicArticle(`tokyo-${slug}-property-selection`)])
  const wardRows = rows.filter((row) => row.city === ward)
  const summary = summarizeWard(wardRows)
  const listings = wardRows.map((home) => ({
    ...home,
    price: home.price ? BigInt(home.price) : null,
    buildingArea: home.buildingArea ? Number(home.buildingArea) : null,
    landArea: home.landArea ? Number(home.landArea) : null,
    yieldGross: home.yieldGross ? Number(home.yieldGross) : null,
    media: (home.media || []).filter((item) => item.isAdopted),
  }))
  const unitBars = wardRows
    .map((row) => ({ row, value: unitPriceOf(row) }))
    .filter((item): item is { row: typeof wardRows[number]; value: number } => item.value !== null)
    .sort((left, right) => left.value - right.value)
    .map(({ row, value }) => ({ label: `${translatePropertyType(row.propertyType, locale)} · ${formatYenWords(Number(row.price), locale)}`, value, href: `/listings/${row.id}` }))
  const favorites = viewer ? await getFavoriteIdsForViewer(viewer.id, listings.map((home) => home.id)) : new Set<string>()
  const pageUrl = localeAlternates(`/areas/${slug}`, locale).canonical
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: text.title(label),
    url: pageUrl,
    inLanguage: getSchemaLanguage(locale),
    about: { '@type': 'Place', name: `${label}, Tokyo`, address: { '@type': 'PostalAddress', addressLocality: ward, addressRegion: '東京都', addressCountry: 'JP' } },
    mainEntity: { '@type': 'ItemList', numberOfItems: listings.length, itemListElement: listings.map((home, index) => ({ '@type': 'ListItem', position: index + 1, url: absoluteUrl(localizedPath(`/listings/${home.id}`, locale)) })) },
  }
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: text.home, item: absoluteUrl(localizedPath('/', locale)) },
    { '@type': 'ListItem', position: 2, name: text.title(label), item: pageUrl },
  ] }

  return <div className="bg-white text-[#1b293a]" data-testid="ward-page">
    <JsonLd data={structured} />
    <JsonLd data={breadcrumb} />
    <div className="container pb-14 pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#536274]"><Link href="/" className="hover:underline">{text.home}</Link> / <span>{label}</span></nav>
      <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold md:text-3xl"><MapPin aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.title(label)}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536274]">{summary.count ? text.intro(label, summary.count) : text.empty(label)}</p>

      {summary.count > 0 && <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4"><dt className="text-xs font-semibold text-[#4a6789]">{text.range}</dt><dd className="mt-1 text-lg font-bold">{summary.minPrice && summary.maxPrice ? `${formatYenWords(summary.minPrice, locale)} 〜 ${formatYenWords(summary.maxPrice, locale)}` : '—'}</dd></div>
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4"><dt className="text-xs font-semibold text-[#4a6789]">{text.types}</dt><dd className="mt-2 flex flex-wrap gap-2">{summary.types.map(({ type, count }) => <span key={type} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium ring-1 ring-[#dbe2e9]"><Building2 aria-hidden="true" className="h-3.5 w-3.5 text-[#274d7d]" />{translatePropertyType(type, locale)} {count}</span>)}</dd></div>
      </dl>}

      {listings.length > 0 && <section className="mt-10" aria-labelledby="ward-listings-title">
        <h2 id="ward-listings-title" className="text-xl font-semibold">{text.listings}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((home) => <ListingCard key={home.id} listing={home} isFavorite={favorites.has(home.id)} userId={viewer?.id ?? null} />)}</div>
      </section>}

      {unitBars.length >= 2 && <UnitPriceChart locale={locale} title={text.unitTitle} note={text.unitNote} bars={unitBars} />}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
        {article && <Link href={`/articles/${article.slug}/${locale}`} className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{text.article}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
        <Link href={`/listings?${new URLSearchParams({ ward })}`} className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{text.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        <Link href="/match" className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{text.match}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>

      <div className="mt-12"><WardMap locale={locale} counts={countByWard(rows)} current={ward} /></div>
    </div>
  </div>
}

