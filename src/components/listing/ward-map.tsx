import Link from 'next/link'
import { ArrowRight, MapPin } from 'lucide-react'
import { WARD_GRID, WARD_SLUGS, WARD_TILES, wardLabel } from '@/lib/ward-tile-map'

const copy = {
  ja: { index: '23区の特徴をくらべる', title: 'エリアから探す', note: '東京23区の位置関係で表示。数字は公開中の物件数です。', empty: '公開中の物件なし', more: '色が濃いほど物件が多い区です' },
  en: { index: 'Compare all 23 wards', title: 'Browse by area', note: 'Tokyo’s 23 wards in their rough positions. Numbers show listings for sale now.', empty: 'No listings now', more: 'Darker wards have more listings' },
  'zh-TW': { index: '比較23區特色', title: '依區域尋找', note: '依東京23區的相對位置排列，數字為目前刊登中的物件數。', empty: '目前無刊登物件', more: '顏色越深，物件越多' },
  'zh-CN': { index: '比较23区特点', title: '按区域查找', note: '按东京23区的相对位置排列，数字为当前在售房源数。', empty: '当前无在售房源', more: '颜色越深，房源越多' },
} as const

function tone(count: number, max: number): string {
  if (count === 0) return 'border-[#e5eaf0] bg-[#f6f8fa] text-[#5f6b78]'
  const share = count / Math.max(max, 1)
  if (share > 0.66) return 'border-[#18375f] bg-[#274d7d] text-white hover:bg-[#18375f]'
  if (share > 0.33) return 'border-[#5f84b0] bg-[#8fb0d6] text-[#0f2744] hover:bg-[#7aa0cc]'
  return 'border-[#b8cde4] bg-[#dbe8f4] text-[#1b3a5e] hover:bg-[#c9dcef]'
}

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
  const max = Math.max(0, ...Object.values(counts))
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
    <div className="mx-auto mt-4 grid max-w-3xl gap-1 sm:gap-1.5 md:gap-2" style={{ gridTemplateColumns: `repeat(${WARD_GRID.cols}, minmax(0, 1fr))` }}>
      {WARD_TILES.map(({ ward, row, col }) => {
        const count = counts[ward] ?? 0
        const label = wardLabel(ward, locale)
        const className = `flex aspect-square flex-col items-center justify-center rounded-md border p-0.5 text-center transition-colors sm:rounded-lg ${tone(count, max)} ${ward === current ? 'ring-2 ring-[#c2410c] ring-offset-2' : ''}`
        const content = <>
          <span className="w-full break-words text-[9px] font-semibold leading-tight sm:text-xs md:text-sm">{label}</span>
          <span className="mt-0.5 text-[10px] font-bold tabular-nums sm:text-sm md:text-base">{count}</span>
          {count === 0 && <span className="sr-only">{text.empty}</span>}
        </>
        const style = { gridRow: row + 1, gridColumn: col + 1 }
        return count > 0
          ? <Link key={ward} href={`/areas/${WARD_SLUGS[ward]}`} prefetch={false} style={style} className={className} aria-current={ward === current ? 'page' : undefined}>{content}</Link>
          : <div key={ward} style={style} className={className}>{content}</div>
      })}
    </div>
    {showIndexLink && <div className="mt-4 text-center"><Link href="/areas" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d] hover:underline">{text.index}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>}
  </section>
}
