import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { WARD_LAND_PRICE, WARD_SLUGS, landPriceTier, wardLabel } from '@/lib/ward-tile-map'
import { WARD_SHAPES, WARD_SHAPES_VIEWBOX, type WardShape } from '@/lib/ward-shapes'

// CC BY 4.0: the terms ask for the dataset name and that we edited it.
const MAP_CREDIT_URL = 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-N03-2026.html'

const copy = {
  ja: { index: '23区の特徴をくらべる', title: 'エリアから探す', note: '東京23区の地図です。数字は公開中の物件数です。', empty: '公開中の物件なし', more: '色が濃いほど住宅地の平均地価が高い区', source: (year: number) => `地価：東京都 ${year}年地価公示 住宅地平均（1月1日時点）`, map: '地図：「国土数値情報（行政区域データ）」（国土交通省）をもとに自由不動産合同会社が加工して作成', price: (yen: string) => `住宅地平均 ${yen}円/㎡`, listings: (count: number) => `${count}件` },
  en: { index: 'Compare all 23 wards', title: 'Browse by area', note: 'A map of Tokyo’s 23 wards. Numbers show listings for sale now.', empty: 'No listings now', more: 'Darker wards have higher residential land prices', source: (year: number) => `Land prices: Tokyo Metropolitan Government, ${year} official land prices, residential average (1 January)`, map: 'Map: based on “National Land Numerical Information (Administrative Areas)” (MLIT), edited by Ziyou Real Estate LLC', price: (yen: string) => `Residential land ¥${yen}/m²`, listings: (count: number) => `${count} ${count === 1 ? 'listing' : 'listings'}` },
  'zh-TW': { index: '比較23區特色', title: '依區域尋找', note: '東京23區地圖，數字為目前刊登中的物件數。', empty: '目前無刊登物件', more: '顏色越深，住宅地平均地價越高', source: (year: number) => `地價：東京都 ${year}年地價公示 住宅地平均（1月1日）`, map: '地圖：依據日本國土交通省「國土數值資訊（行政區域資料）」（国土数値情報）由自由不動產合同會社加工製作', price: (yen: string) => `住宅地平均 ${yen}日圓/㎡`, listings: (count: number) => `${count}件` },
  'zh-CN': { index: '比较23区特点', title: '按区域查找', note: '东京23区地图，数字为当前在售房源数。', empty: '当前无在售房源', more: '颜色越深，住宅地平均地价越高', source: (year: number) => `地价：东京都 ${year}年地价公示 住宅地平均（1月1日）`, map: '地图：依据日本国土交通省“国土数值信息（行政区域数据）”（国土数値情報）由自由不动产合同会社加工制作', price: (yen: string) => `住宅地平均 ${yen}日元/㎡`, listings: (count: number) => `${count}套` },
} as const

// Shade by the official average residential land price (owner decision 2026-10-25), not by how
// many listings a ward has; the number on each ward is still the listing count.
const FILLS = [
  'fill-[#dbe8f4] group-hover:fill-[#c9dcef]',
  'fill-[#8fb0d6] group-hover:fill-[#7aa0cc]',
  'fill-[#274d7d] group-hover:fill-[#18375f]',
] as const
const LABEL_FILLS = ['fill-[#1b3a5e]', 'fill-[#0f2744]', 'fill-white'] as const
const HALO_STROKES = ['stroke-[#dbe8f4]', 'stroke-[#8fb0d6]', 'stroke-[#274d7d]'] as const
const OUTLINE = 'stroke-white [stroke-linejoin:round] [stroke-width:1.2] [vector-effect:non-scaling-stroke]'

interface WardMapProps {
  locale: string
  counts: Record<string, number>
  /** Ward whose page is being shown; it is outlined on the map. */
  current?: string
  /** Link to the 23-ward index below the map (off on the index itself). */
  showIndexLink?: boolean
}

export function WardMap({ locale, counts, current, showIndexLink = true }: WardMapProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const currentShape = WARD_SHAPES.find((shape) => shape.ward === current)
  return <section aria-labelledby="ward-map-title" data-testid="ward-map" className="rounded-2xl border border-[#dbe2e9] bg-[#f8fafc] p-4 md:p-6">
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 id="ward-map-title" className="flex items-center gap-2 text-lg font-semibold md:text-xl"><MapPin aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#657487] md:text-sm">{text.note}</p>
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-[#657487]">
        <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#dbe8f4]" /><span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#8fb0d6]" /><span aria-hidden="true" className="h-3 w-3 rounded-sm bg-[#274d7d]" />{text.more}
      </p>
    </div>
    <svg viewBox={`0 0 ${WARD_SHAPES_VIEWBOX.width} ${WARD_SHAPES_VIEWBOX.height}`} aria-labelledby="ward-map-title" className="mx-auto mt-4 block h-auto w-full max-w-2xl select-none">
      {WARD_SHAPES.map((shape) => <WardArea key={shape.ward} shape={shape} count={counts[shape.ward] ?? 0} locale={locale} text={text} current={shape.ward === current} />)}
      {currentShape && <path d={currentShape.d} aria-hidden="true" className="pointer-events-none fill-none stroke-[#c2410c] [stroke-linejoin:round] [stroke-width:3] [vector-effect:non-scaling-stroke]" />}
      {WARD_SHAPES.map((shape) => <WardLabel key={shape.ward} shape={shape} count={counts[shape.ward] ?? 0} locale={locale} />)}
    </svg>
    <p className="mt-3 text-center text-[11px] leading-4 text-[#536274]">
      <a href={WARD_LAND_PRICE.source} target="_blank" rel="noopener noreferrer" className="hover:underline">{text.source(WARD_LAND_PRICE.year)}</a>
      <span aria-hidden="true"> / </span>
      <a href={MAP_CREDIT_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">{text.map}</a>
    </p>
    {showIndexLink && <div className="mt-4 text-center"><Link href="/areas" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d] hover:underline">{text.index}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>}
  </section>
}

interface WardAreaProps { shape: WardShape; count: number; locale: string; text: (typeof copy)[keyof typeof copy]; current: boolean }

function WardArea({ shape, count, locale, text, current }: WardAreaProps) {
  const tier = landPriceTier(shape.ward)
  const price = text.price((WARD_LAND_PRICE.yenPerSqm[shape.ward] ?? 0).toLocaleString('en-US'))
  const name = `${wardLabel(shape.ward, locale)}: ${count > 0 ? text.listings(count) : text.empty}. ${price}`
  const area = <path d={shape.d} className={`transition-colors ${FILLS[tier]} ${OUTLINE}`} />
  if (count === 0) return <g role="img" aria-label={name} className="group"><title>{name}</title>{area}</g>
  return <Link href={`/areas/${WARD_SLUGS[shape.ward]}`} prefetch={false} aria-label={name} aria-current={current ? 'page' : undefined} className="group outline-none [&:focus-visible>path]:stroke-[#c2410c] [&:focus-visible>path]:[stroke-width:3]">
    <title>{name}</title>
    {area}
  </Link>
}

function WardLabel({ shape, count, locale }: { shape: WardShape; count: number; locale: string }) {
  const tier = landPriceTier(shape.ward)
  const [x, y] = shape.label
  const paint = `${LABEL_FILLS[tier]} ${HALO_STROKES[tier]} [paint-order:stroke] [stroke-linejoin:round] [stroke-width:3px]`
  return <text x={x} y={y} textAnchor="middle" aria-hidden="true" className={`pointer-events-none font-semibold ${paint}`}>
    <tspan x={x} dy="-0.15em" className="text-[18px] md:text-[13px]">{wardLabel(shape.ward, locale)}</tspan>
    <tspan x={x} dy="1.15em" className="text-[20px] font-bold tabular-nums md:text-[15px]">{count}</tspan>
  </text>
}
