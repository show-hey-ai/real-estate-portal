import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Wallet } from 'lucide-react'
import { CollectionView } from '@/components/listing/collection-view'
import { budgetBand, inBudget } from '@/lib/collections'
import { priceBandQuery, priceBandRange, type PriceBand } from '@/lib/price-bands'
import { getPublicListingRows } from '@/lib/public-listing-cards'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { localeAlternates } from '@/lib/locale-url'
import { shareMetadata } from '@/lib/site-config'
import { countedTitle } from '@/lib/home-snippet'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ band: string }> }

const copy = {
  ja: { title: (range: string) => `${range}の東京の売買物件`, intro: (range: string, count: number) => count ? `価格${range}で公開中の東京の物件は${count}件です。エリア・種類・㎡単価を比べて、気になる物件は登録なしで相談できます。` : `この価格帯で公開中の物件はありません。ご予算とご希望をお知らせください。`, description: (range: string, count: number) => `${range}で買える東京23区の売買物件${count}件。マンション・戸建て・土地の価格、㎡単価、駅距離を比較。` },
  en: { title: (range: string) => `Tokyo property for sale: ${range}`, intro: (range: string, count: number) => count ? `${count} Tokyo properties are for sale at ${range}. Compare areas, types and price per m², and ask without signing up.` : `No properties are listed in this price range right now. Tell us your budget and what you are looking for.`, description: (range: string, count: number) => `${count} Tokyo properties for sale at ${range}. Compare condominium, house and land prices, price per m² and station access.` },
  'zh-TW': { title: (range: string) => `${range}的東京待售物件`, intro: (range: string, count: number) => count ? `價格${range}、目前刊登中的東京物件共${count}筆。可比較區域、類型與單價，免註冊即可諮詢。` : `此價格帶目前沒有刊登中的物件。請告訴我們您的預算與條件。`, description: (range: string, count: number) => `${range}可購買的東京23區待售物件${count}筆，比較價格、單價與車站距離。` },
  'zh-CN': { title: (range: string) => `${range}的东京在售房源`, intro: (range: string, count: number) => count ? `价格${range}、当前在售的东京房源共${count}套。可比较区域、类型与单价，免注册即可咨询。` : `此价格段目前没有在售房源。请告诉我们您的预算与条件。`, description: (range: string, count: number) => `${range}可购买的东京23区在售房源${count}套，比较价格、单价与车站距离。` },
} as const

function textFor(locale: string) { return copy[locale as keyof typeof copy] ?? copy.en }
async function rowsFor(band: PriceBand) { return (await getPublicListingRows()).filter((row) => inBudget(row.price, band)) }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { band: slug } = await params
  const band = budgetBand(slug)
  if (!band) return { robots: { index: false, follow: false } }
  const locale = await getLocale()
  const rows = await rowsFor(band)
  const range = priceBandRange(band, locale)
  const text = textFor(locale)
  const alternates = localeAlternates(`/budget/${slug}`, locale)
  return { title: countedTitle(text.title(range), rows.length, locale), description: text.description(range, rows.length), alternates, ...shareMetadata({ title: countedTitle(text.title(range), rows.length, locale), description: text.description(range, rows.length), url: alternates.canonical, locale }), robots: rows.length ? { index: true, follow: true } : { index: false, follow: true } }
}

export default async function BudgetPage({ params }: Props) {
  const { band: slug } = await params
  const band = budgetBand(slug)
  if (!band) notFound()
  const locale = await getLocale()
  const [rows, viewer] = await Promise.all([rowsFor(band), getOptionalPublicViewer()])
  const range = priceBandRange(band, locale)
  const text = textFor(locale)
  const favorites = viewer ? await getFavoriteIdsForViewer(viewer.id, rows.map((row) => row.id)) : new Set<string>()
  return <CollectionView locale={locale} path={`/budget/${slug}`} title={text.title(range)} intro={text.intro(range, rows.length)} Icon={Wallet} rows={rows} filterHref={`/listings?${priceBandQuery(band)}`} userId={viewer?.id ?? null} favorites={favorites} />
}
