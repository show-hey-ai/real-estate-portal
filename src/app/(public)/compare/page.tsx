import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, Columns3, Trophy } from 'lucide-react'
import { CompareToggle } from '@/components/listing/browser-lists-client'
import { createServiceClient } from '@/lib/supabase/server'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import { COMPARE_LIMIT } from '@/lib/browser-lists'
import { pickCoverImage } from '@/lib/cover-image'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import { formatTransitAccessLabel, translateCurrentStatus, translatePropertyType } from '@/lib/translate-fields'
import { formatUnitPrice, unitPriceOf } from '@/lib/unit-price'
import { wardLabel } from '@/lib/ward-tile-map'
import { formatYenWords } from '@/lib/yen-words'

export const dynamic = 'force-dynamic'

const copy = {
  ja: { title: '物件を比較', intro: '比較リストに追加した物件を並べています。物件ページの「比較に追加」で最大3件まで選べます。', empty: '比較リストに物件がありません。物件ページの「比較に追加」を押してください。', browse: '物件を探す', price: '価格', unit: '㎡単価', area: '面積', type: '種別', ward: 'エリア', built: '築年', station: '最寄駅', status: '現況', floors: '階数', detail: '物件ページへ', best: { price: '最安', unit: '㎡単価が最安', built: '最も新しい', walk: '駅に最も近い', area: '最も広い' }, walk: (minutes: number) => `徒歩${minutes}分`, age: (year: number, age: number) => `${year}年（築${age}年）`, floorsValue: (count: number) => `${count}階建` },
  en: { title: 'Compare properties', intro: 'Listings you added to the compare list, side by side. Add up to three from any listing page.', empty: 'Your compare list is empty. Use “Add to compare” on a listing page.', browse: 'Browse properties', price: 'Price', unit: 'Price per m²', area: 'Area', type: 'Type', ward: 'Area', built: 'Built', station: 'Nearest station', status: 'Status', floors: 'Floors', detail: 'View listing', best: { price: 'Lowest price', unit: 'Lowest per m²', built: 'Newest', walk: 'Closest to station', area: 'Largest' }, walk: (minutes: number) => `${minutes} min walk`, age: (year: number, age: number) => `${year} (${age} yrs)`, floorsValue: (count: number) => `${count} floors` },
  'zh-TW': { title: '比較物件', intro: '並列顯示加入比較清單的物件。可在物件頁面加入最多3筆。', empty: '比較清單中沒有物件。請在物件頁面按「加入比較」。', browse: '尋找物件', price: '價格', unit: '每平方公尺單價', area: '面積', type: '類型', ward: '區域', built: '屋齡', station: '最近車站', status: '現況', floors: '樓層', detail: '查看物件', best: { price: '最低價', unit: '單價最低', built: '最新', walk: '離車站最近', area: '最寬敞' }, walk: (minutes: number) => `步行${minutes}分鐘`, age: (year: number, age: number) => `${year}年（屋齡${age}年）`, floorsValue: (count: number) => `${count}層樓` },
  'zh-CN': { title: '比较房源', intro: '并列显示加入比较清单的房源。可在房源页面加入最多3套。', empty: '比较清单中没有房源。请在房源页面点击“加入比较”。', browse: '查找房源', price: '价格', unit: '每平方米单价', area: '面积', type: '类型', ward: '区域', built: '房龄', station: '最近车站', status: '现状', floors: '楼层', detail: '查看房源', best: { price: '最低价', unit: '单价最低', built: '最新', walk: '离车站最近', area: '最宽敞' }, walk: (minutes: number) => `步行${minutes}分钟`, age: (year: number, age: number) => `${year}年（房龄${age}年）`, floorsValue: (count: number) => `${count}层` },
} as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  return { title: text.title, robots: { index: false, follow: true } }
}

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

async function getCompared(ids: string[]) {
  if (!ids.length) return []
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('id, city, propertyType, price, buildingArea, landArea, builtYear, floorCount, currentStatus, stations, media (url, category, isAdopted, sortOrder)')
    .in('id', ids)
    .eq('status', 'PUBLISHED').eq('adAllowed', true).eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES]).is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0]).or(publicFreshnessFilters()[1])
  if (error || !data) return []
  return ids.flatMap((id) => data.filter((row) => row.id === id))
}

function bestIndex(values: (number | null)[], prefer: 'min' | 'max'): number | null {
  const present = values.map((value, index) => ({ value, index })).filter((item): item is { value: number; index: number } => item.value !== null)
  if (present.length < 2) return null
  const target = prefer === 'min' ? Math.min(...present.map((item) => item.value)) : Math.max(...present.map((item) => item.value))
  const winners = present.filter((item) => item.value === target)
  // A tie is not a distinction, so no badge is shown.
  return winners.length === 1 ? winners[0].index : null
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const [{ ids: raw }, locale] = await Promise.all([searchParams, getLocale()])
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const ids = [...new Set((raw ?? '').split(',').filter((id) => ID_PATTERN.test(id)))].slice(0, COMPARE_LIMIT)
  const rows = await getCompared(ids)
  const currentYear = new Date().getFullYear()
  const facts = rows.map((row) => {
    const stations = normalizeTransitStations(row.stations as never)
    const nearest = [...stations].sort((left, right) => (left.walk_minutes ?? 99) - (right.walk_minutes ?? 99))[0]
    const area = Number(row.propertyType === '土地' ? row.landArea : row.buildingArea) || null
    return { row, area, unit: unitPriceOf(row), price: Number(row.price) || null, nearest, walk: nearest?.walk_minutes ?? null, cover: pickCoverImage((row.media || []).filter((item) => item.isAdopted)) }
  })
  const best = {
    price: bestIndex(facts.map((item) => item.price), 'min'),
    unit: bestIndex(facts.map((item) => item.unit), 'min'),
    built: bestIndex(facts.map((item) => item.row.builtYear), 'max'),
    walk: bestIndex(facts.map((item) => item.walk), 'min'),
    area: bestIndex(facts.map((item) => item.area), 'max'),
  }
  const badge = (key: keyof typeof best, index: number) => best[key] === index
    ? <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#fff4e5] px-2 py-0.5 text-[11px] font-semibold text-[#9a4d00]"><Trophy aria-hidden="true" className="h-3 w-3" />{text.best[key]}</span>
    : null
  const rowsSpec: { label: string; render: (item: (typeof facts)[number], index: number) => React.ReactNode }[] = [
    { label: text.price, render: (item, index) => <>{item.price ? formatYenWords(item.price, locale) : '—'}{badge('price', index)}</> },
    { label: text.unit, render: (item, index) => <>{formatUnitPrice(item.price, item.area, locale) ?? '—'}{badge('unit', index)}</> },
    { label: text.area, render: (item, index) => <>{item.area ? `${item.area} m²` : '—'}{badge('area', index)}</> },
    { label: text.type, render: (item) => translatePropertyType(item.row.propertyType, locale) ?? '—' },
    { label: text.ward, render: (item) => item.row.city ? wardLabel(item.row.city, locale) : '—' },
    { label: text.built, render: (item, index) => <>{item.row.builtYear ? text.age(item.row.builtYear, currentYear - item.row.builtYear) : '—'}{badge('built', index)}</> },
    { label: text.station, render: (item, index) => item.nearest ? <>{formatTransitAccessLabel(item.nearest, locale)}{item.walk !== null && ` · ${text.walk(item.walk)}`}{badge('walk', index)}</> : '—' },
    { label: text.floors, render: (item) => item.row.floorCount ? text.floorsValue(item.row.floorCount) : '—' },
    { label: text.status, render: (item) => translateCurrentStatus(item.row.currentStatus, locale) ?? '—' },
  ]

  return <div className="container py-10 text-[#1b293a]" data-testid="compare-page">
    <h1 className="flex items-center gap-2 text-2xl font-semibold md:text-3xl"><Columns3 aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.title}</h1>
    <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536274]">{rows.length ? text.intro : text.empty}</p>
    {!rows.length && <Link href="/listings" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#274d7d] px-5 text-sm font-semibold text-white">{text.browse}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
    {rows.length > 0 && <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[640px] table-fixed border-separate border-spacing-0 text-sm">
        <thead><tr>
          <th scope="col" className="w-28 md:w-36" />
          {facts.map((item) => <th key={item.row.id} scope="col" className="px-3 pb-4 text-left align-top font-normal">
            <Link href={`/listings/${item.row.id}`} className="block overflow-hidden rounded-lg border border-[#dbe2e9]"><div className="relative aspect-[4/3] bg-[#eef2f6]">{item.cover && <Image src={item.cover.url} alt="" fill sizes="(max-width: 768px) 50vw, 30vw" className={item.cover.category === 'FLOORPLAN' ? 'bg-white object-contain p-2' : 'object-cover'} />}</div></Link>
            <div className="mt-2 flex items-center justify-between gap-2"><Link href={`/listings/${item.row.id}`} className="inline-flex items-center gap-1 font-semibold text-[#274d7d] hover:underline">{text.detail}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link><CompareToggle listingId={item.row.id} compact /></div>
          </th>)}
        </tr></thead>
        <tbody>{rowsSpec.map((spec) => <tr key={spec.label}>
          <th scope="row" className="border-t border-[#e5eaf0] py-3 pr-3 text-left align-top text-xs font-semibold text-[#4a6789]">{spec.label}</th>
          {facts.map((item, index) => <td key={item.row.id} className="border-t border-[#e5eaf0] px-3 py-3 align-top font-medium">{spec.render(item, index)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>}
  </div>
}
