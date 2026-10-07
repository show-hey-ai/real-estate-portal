import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, MapPin } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { WardMap } from '@/components/listing/ward-map'
import { ListingAlertForm } from '@/components/alerts/listing-alert-form'
import { wardProfile } from '@/content/ward-profiles'
import { formatCompactLocal, getJpyRates } from '@/lib/fx'
import { localeAlternates, localizedPath } from '@/lib/locale-url'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { absoluteUrl, getSchemaLanguage, shareMetadata } from '@/lib/site-config'
import { createServiceClient } from '@/lib/supabase/server'
import { WARD_SLUGS, countByWard, summarizeWard, wardLabel } from '@/lib/ward-tile-map'
import { formatYenWords } from '@/lib/yen-words'

export const dynamic = 'force-dynamic'

/** Index of Tokyo's 23 wards: a short profile of each, with how many listings and from what price. */

const copy = {
  ja: { title: '東京23区の特徴と売り物件：区ごとにくらべる', description: '東京23区それぞれの特徴（主な駅・街・雰囲気）と、公開中の売り物件の数・価格帯を一覧にしました。気になる区のページから物件を探せます。', lead: '23区それぞれの特徴と、いま公開中の物件の数・価格帯をまとめました。紹介は主な駅や街などの事実に限り、治安や相場の評価はしていません。', count: (n: number) => `${n}件`, none: '公開中の物件なし', from: (p: string) => `${p}〜`, see: '物件を見る', listTitle: '23区の一覧' },
  en: { title: 'Tokyo’s 23 wards compared: where to buy', description: 'Each of Tokyo’s 23 wards in a few lines — main stations, neighbourhoods and character — with how many homes are for sale now and their prices.', lead: 'A short, factual profile of each ward, with the homes for sale now and their prices. Profiles stick to stations and neighbourhoods; we don’t rate safety or market prices.', count: (n: number) => `${n} for sale`, none: 'No listings now', from: (p: string) => `from ${p}`, see: 'See listings', listTitle: 'All 23 wards' },
  'zh-TW': { title: '東京23區比較：各區特色與待售物件', description: '整理東京23區各區的特色（主要車站、街區、氛圍），以及目前刊登中的待售物件數與價格帶。', lead: '整理各區的特色，以及目前刊登中的物件數與價格帶。介紹僅限主要車站與街區等事實，不評價治安或行情。', count: (n: number) => `${n}件`, none: '目前無刊登物件', from: (p: string) => `${p}起`, see: '查看物件', listTitle: '23區一覽' },
  'zh-CN': { title: '东京23区比较：各区特点与在售房源', description: '整理东京23区各区的特点（主要车站、街区、氛围），以及当前在售房源数量和价格区间。', lead: '整理各区的特点，以及当前在售房源的数量和价格区间。介绍仅限主要车站和街区等事实，不评价治安或行情。', count: (n: number) => `${n}套`, none: '当前无在售房源', from: (p: string) => `${p}起`, see: '查看房源', listTitle: '23区一览' },
} as const

function textFor(locale: string) {
  return copy[locale as keyof typeof copy] ?? copy.en
}

async function getPublicRows() {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('city, propertyType, price')
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
    .limit(2000)
  if (error) { console.error('Failed to load listings for the ward index:', error); return [] }
  return data || []
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const text = textFor(locale)
  const alternates = localeAlternates('/areas', locale)
  return { title: text.title, description: text.description, alternates, ...shareMetadata({ title: text.title, description: text.description, url: alternates.canonical, locale }) }
}

export default async function AreasPage() {
  const [locale, rows, rates] = await Promise.all([getLocale(), getPublicRows(), getJpyRates()])
  const text = textFor(locale)
  const counts = countByWard(rows)
  const wards = Object.keys(WARD_SLUGS)
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: text.listTitle,
    inLanguage: getSchemaLanguage(locale),
    itemListElement: wards.map((ward, index) => ({ '@type': 'ListItem', position: index + 1, name: wardLabel(ward, locale), url: absoluteUrl(localizedPath(`/areas/${WARD_SLUGS[ward]}`, locale)) })),
  }
  return <div className="container py-12 text-[#1b293a]">
    <JsonLd data={structured} />
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]"><MapPin aria-hidden="true" className="h-4 w-4" />Welcome Home Tokyo</p>
    <h1 className="mt-4 max-w-4xl text-3xl font-semibold leading-tight md:text-5xl">{text.title}</h1>
    <p className="mt-5 max-w-3xl text-lg leading-8 text-[#3d4a5a]">{text.lead}</p>
    <div className="mt-8"><WardMap locale={locale} counts={counts} showIndexLink={false} /></div>
    <section className="mt-12" aria-labelledby="ward-list-title">
      <h2 id="ward-list-title" className="text-2xl font-semibold">{text.listTitle}</h2>
      <ul className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wards.map((ward) => {
          const summary = summarizeWard(rows.filter((row) => row.city === ward))
          const fromYen = summary.minPrice ? formatYenWords(summary.minPrice, locale) : null
          const fromLocal = summary.minPrice ? formatCompactLocal(summary.minPrice, locale, rates) : null
          return <li key={ward} className="flex min-w-0 flex-col rounded-xl border border-[#dbe2e9] bg-white p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">{wardLabel(ward, locale)}</h3>
              <span className={`shrink-0 text-sm font-semibold tabular-nums ${summary.count ? 'text-[#274d7d]' : 'text-[#5f6b78]'}`}>{summary.count ? text.count(summary.count) : text.none}</span>
            </div>
            {fromYen && <p className="mt-1 text-sm tabular-nums text-[#3d4a5a]">{text.from(fromYen)}{fromLocal && <span className="text-[#536274]">{locale === 'en' ? ` (≈ ${fromLocal})` : `（≈${fromLocal}）`}</span>}</p>}
            <p className="mt-3 flex-1 text-sm leading-6 text-[#536274]">{wardProfile(ward, locale)}</p>
            <Link href={`/areas/${WARD_SLUGS[ward]}`} className="mt-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d] hover:underline">{text.see}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
          </li>
        })}
      </ul>
    </section>
    <div className="mt-12"><ListingAlertForm /></div>
  </div>
}
