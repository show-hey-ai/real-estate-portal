import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { Building2 } from 'lucide-react'
import { CollectionView } from '@/components/listing/collection-view'
import { TYPE_COLLECTIONS, isTypeSlug, type TypeSlug } from '@/lib/collections'
import { getPublicListingRows } from '@/lib/public-listing-cards'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { localeAlternates } from '@/lib/locale-url'
import { shareMetadata } from '@/lib/site-config'
import { pickCoverImage } from '@/lib/cover-image'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ type: string }> }

const copy = {
  ja: { title: (label: string) => `東京の${label}（売買）`, intro: (label: string, count: number) => count ? `東京23区で公開中の${label}は${count}件です。価格・広さ・駅距離を比べて、気になる物件は登録なしで相談できます。` : `現在公開中の${label}はありません。ご希望の条件をお知らせいただければ、紹介できる物件を確認します。`, description: (label: string, count: number) => `東京23区の${label}の売買物件${count}件。価格、㎡単価、広さ、駅距離を比較。日本語・英語・中国語で購入相談に対応。` },
  en: { title: (label: string) => `${label} for sale in Tokyo`, intro: (label: string, count: number) => count ? `${count} ${label.toLowerCase()} are for sale in Tokyo's 23 wards now. Compare prices, sizes and station access, and ask without signing up.` : `No ${label.toLowerCase()} are listed right now. Tell us what you are looking for and we will check what we can introduce.`, description: (label: string, count: number) => `${count} ${label.toLowerCase()} for sale in Tokyo. Compare prices, price per m², sizes and station access, with support in English, Japanese and Chinese.` },
  'zh-TW': { title: (label: string) => `東京${label}待售`, intro: (label: string, count: number) => count ? `東京23區目前刊登中的${label}共${count}筆。可比較價格、面積與車站距離，免註冊即可諮詢。` : `目前沒有刊登中的${label}。請告訴我們您的條件。`, description: (label: string, count: number) => `東京23區${label}待售物件${count}筆，比較價格、單價、面積與車站距離，提供中文購屋諮詢。` },
  'zh-CN': { title: (label: string) => `东京${label}在售`, intro: (label: string, count: number) => count ? `东京23区当前在售的${label}共${count}套。可比较价格、面积与车站距离，免注册即可咨询。` : `目前没有在售的${label}。请告诉我们您的条件。`, description: (label: string, count: number) => `东京23区${label}在售房源${count}套，比较价格、单价、面积与车站距离，提供中文购房咨询。` },
} as const

function textFor(locale: string) { return copy[locale as keyof typeof copy] ?? copy.en }
function labelFor(slug: TypeSlug, locale: string) { const labels = TYPE_COLLECTIONS[slug].label; return labels[locale as keyof typeof labels] ?? labels.en }
async function rowsFor(slug: TypeSlug) {
  const types = TYPE_COLLECTIONS[slug].types as readonly string[]
  return (await getPublicListingRows()).filter((row) => row.propertyType && types.includes(row.propertyType))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  if (!isTypeSlug(type)) return { robots: { index: false, follow: false } }
  const locale = await getLocale()
  const rows = await rowsFor(type)
  const label = labelFor(type, locale)
  const text = textFor(locale)
  const alternates = localeAlternates(`/types/${type}`, locale)
  const cover = rows.map((row) => pickCoverImage((row.media || []).filter((item) => item.isAdopted))).find(Boolean)
  return { title: text.title(label), description: text.description(label, rows.length), alternates, ...shareMetadata({ title: text.title(label), description: text.description(label, rows.length), url: alternates.canonical, locale, image: cover?.url }), robots: rows.length ? { index: true, follow: true } : { index: false, follow: true } }
}

export default async function TypePage({ params }: Props) {
  const { type } = await params
  if (!isTypeSlug(type)) notFound()
  const locale = await getLocale()
  const [rows, viewer] = await Promise.all([rowsFor(type), getOptionalPublicViewer()])
  const label = labelFor(type, locale)
  const text = textFor(locale)
  const favorites = viewer ? await getFavoriteIdsForViewer(viewer.id, rows.map((row) => row.id)) : new Set<string>()
  const firstType = TYPE_COLLECTIONS[type].types[0]
  return <CollectionView locale={locale} path={`/types/${type}`} title={text.title(label)} intro={text.intro(label, rows.length)} Icon={Building2} rows={rows} filterHref={`/listings?${new URLSearchParams({ type: firstType })}`} userId={viewer?.id ?? null} favorites={favorites} />
}
