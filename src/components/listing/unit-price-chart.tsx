import Link from 'next/link'
import { BarChart3 } from 'lucide-react'

export interface UnitPriceBar {
  label: string
  value: number
  href?: string
  highlight?: boolean
}

const unitLabel: Record<string, (value: number) => string> = {
  ja: (value) => `${(value / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}万円/㎡`,
  en: (value) => `¥${Math.round(value).toLocaleString('en-US')}/m²`,
  'zh-TW': (value) => `${(value / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}萬日圓/㎡`,
  'zh-CN': (value) => `${(value / 10_000).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}万日元/㎡`,
}

interface UnitPriceChartProps {
  locale: string
  title: string
  note: string
  bars: UnitPriceBar[]
}

/** Horizontal bars of asking price per m²; the highlighted bar is the listing being viewed. */
export function UnitPriceChart({ locale, title, note, bars }: UnitPriceChartProps) {
  const format = unitLabel[locale] ?? unitLabel.en
  const max = Math.max(1, ...bars.map((bar) => bar.value))
  return <section className="mt-6 rounded-xl border border-[#dbe2e9] bg-white p-4 md:p-6" data-testid="unit-price-chart">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 aria-hidden="true" className="h-5 w-5 text-primary" />{title}</h2>
    <ul className="mt-4 space-y-3">
      {bars.map((bar, index) => {
        const row = <>
          <div className="flex items-baseline justify-between gap-3 text-sm"><span className={`min-w-0 truncate ${bar.highlight ? 'font-semibold text-[#1b293a]' : 'text-[#536274]'}`}>{bar.label}</span><span className="shrink-0 font-semibold tabular-nums">{format(bar.value)}</span></div>
          <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true"><div className={`h-full rounded-full ${bar.highlight ? 'bg-[#c2410c]' : 'bg-[#8fb0d6]'}`} style={{ width: `${Math.max(4, (bar.value / max) * 100)}%` }} /></div>
        </>
        return <li key={index}>{bar.href ? <Link href={bar.href} className="block rounded-md hover:bg-[#f4f7fb]">{row}</Link> : row}</li>
      })}
    </ul>
    <p className="mt-4 text-xs leading-5 text-[#536274]">{note}</p>
  </section>
}
