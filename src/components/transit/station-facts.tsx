import Link from 'next/link'
import { ChartColumn, ChevronDown, CircleHelp, Route } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { formatUnitPrice } from '@/lib/unit-price'
import { STATIONS } from '@/lib/transit'
import { lineLabel, stationLabel } from '@/lib/transit/search'
import { getStationFactsCopy } from '@/lib/transit/station-facts-copy'
import type { HubAccess, StationMarket } from '@/lib/transit/station-facts'

// Medians of two listings fall between round prices; show them to the nearest ¥100,000.
const roundPrice = (value: number) => Math.round(value / 100_000) * 100_000

function priceRange(market: StationMarket, locale: string): string {
  if (market.priceMin === null || market.priceMax === null) return '-'
  const min = formatPrice(market.priceMin, locale)
  return market.priceMin === market.priceMax ? min : `${min} – ${formatPrice(market.priceMax, locale)}`
}

export interface StationFaqInput {
  locale: string
  station: string
  market: StationMarket | null
  hubs: HubAccess[]
}

/** Questions and answers shown on the page and given to search engines as FAQ data; same text in both. */
export function stationFaq({ locale, station, market, hubs }: StationFaqInput): { question: string; answer: string }[] {
  const text = getStationFactsCopy(locale)
  const items: { question: string; answer: string }[] = []
  if (market) {
    const median = market.priceMedian === null ? null : formatPrice(roundPrice(market.priceMedian), locale)
    items.push({ question: text.faqCountQ(station), answer: text.faqCountA(market.count, priceRange(market, locale), median) })
  }
  if (hubs.length) {
    const list = hubs.map((hub) => text.hubEntry(stationLabel(hub.hub, locale), lineLabel(hub.line, locale), hub.stops)).join(text.join)
    items.push({ question: text.faqAccessQ(station), answer: text.faqAccessA(list) })
  }
  items.push({ question: text.faqForeignQ(station), answer: text.faqForeignA })
  items.push({ question: text.faqUnlistedQ, answer: text.faqUnlistedA })
  return items
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-lg bg-white p-3 ring-1 ring-[#e3e9ef]">
    <dt className="text-xs font-semibold text-[#4a6789]">{label}</dt>
    <dd className="mt-1 text-sm font-semibold text-[#1b293a]">{children}</dd>
  </div>
}

interface StationMarketProps {
  locale: string
  station: string
  market: StationMarket
  hubs: HubAccess[]
}

/** What is for sale near the station, and where its lines go without changing trains. */
export function StationMarketFacts({ locale, station, market, hubs }: StationMarketProps) {
  const text = getStationFactsCopy(locale)
  const [within5, within10, beyond10] = text.walkBuckets
  return <div className="mt-8 grid gap-4 lg:grid-cols-2">
    <section className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4" aria-labelledby="station-market-title" data-testid="station-market">
      <h2 id="station-market-title" className="flex items-center gap-2 text-lg font-semibold"><ChartColumn aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.marketTitle(station)}</h2>
      <dl className="mt-3 grid grid-cols-2 gap-2">
        <Fact label={text.count}>{text.countValue(market.count)}</Fact>
        <Fact label={text.priceRange}>{priceRange(market, locale)}</Fact>
        {market.priceMedian !== null && <Fact label={text.priceMedian}>{formatPrice(roundPrice(market.priceMedian), locale)}</Fact>}
        {market.unitPriceMedian !== null && <Fact label={text.unitPrice}>{formatUnitPrice(market.unitPriceMedian, 1, locale)}</Fact>}
        {market.layouts.length > 0 && <Fact label={text.layouts}>{market.layouts.map((item) => item.layout).join(' / ')}</Fact>}
        <Fact label={text.walk}><span className="block text-xs font-normal leading-5 text-[#3d4a5a]">{within5} {market.walk.within5} · {within10} {market.walk.within10} · {beyond10} {market.walk.beyond10}</span></Fact>
      </dl>
      <p className="mt-3 text-xs leading-5 text-[#657487]">{text.marketNote}</p>
    </section>
    {hubs.length > 0 && <section className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4" aria-labelledby="station-access-title" data-testid="station-access">
      <h2 id="station-access-title" className="flex items-center gap-2 text-lg font-semibold"><Route aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.accessTitle(station)}</h2>
      <ul className="mt-3 divide-y divide-[#e3e9ef] rounded-lg bg-white ring-1 ring-[#e3e9ef]">
        {hubs.map((hub) => <li key={hub.hub} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
          <Link href={`/stations/${STATIONS[hub.hub]?.slug}`} className="font-semibold text-[#274d7d] hover:underline">{stationLabel(hub.hub, locale)}</Link>
          <span className="flex min-w-0 items-center gap-2 text-right text-xs text-[#536274]"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: hub.line.color }} /><span className="truncate">{lineLabel(hub.line, locale)}</span><span className="shrink-0 font-semibold text-[#1b293a]">{text.stops(hub.stops)}</span></span>
        </li>)}
      </ul>
      <p className="mt-3 text-xs leading-5 text-[#657487]">{text.accessNote}</p>
    </section>}
  </div>
}

export function StationFaq({ locale, items }: { locale: string; items: { question: string; answer: string }[] }) {
  const text = getStationFactsCopy(locale)
  return <section className="mt-10" aria-labelledby="station-faq-title" data-testid="station-faq">
    <h2 id="station-faq-title" className="flex items-center gap-2 text-lg font-semibold"><CircleHelp aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.faqTitle}</h2>
    <div className="mt-3 divide-y divide-[#e3e9ef] rounded-xl border border-[#dbe2e9] bg-white">
      {items.map((item) => <details key={item.question} className="group px-4">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">{item.question}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary>
        <p className="pb-4 text-sm leading-7 text-[#3d4a5a]">{item.answer}</p>
      </details>)}
    </div>
  </section>
}
