import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ChevronDown, TrainFront } from 'lucide-react'
import { StationPicker } from '@/components/transit/station-picker'
import { canonicalSearchQuery, searchNumber } from '@/lib/listing-search'
import { localeAlternates } from '@/lib/locale-url'
import { shareMetadata } from '@/lib/site-config'
import { getTransitCopy } from '@/lib/transit/copy'
import { getTransitIndex } from '@/lib/transit/public-index'

export const dynamic = 'force-dynamic'

/** Line and station search: pick lines and stations with listing counts, then see the listings. */

interface LinesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toSearchParams(params: Record<string, string | string[] | undefined>): URLSearchParams {
  return new URLSearchParams(Object.entries(params).flatMap(([key, value]) => {
    const single = Array.isArray(value) ? value[0] : value
    return typeof single === 'string' ? [[key, single]] : []
  }))
}

export async function generateMetadata({ searchParams }: LinesPageProps): Promise<Metadata> {
  const [locale, params] = await Promise.all([getLocale(), searchParams])
  const [copy, index] = [getTransitCopy(locale), await getTransitIndex(locale)]
  const description = copy.metaDescription(index.listings.filter((stations) => stations.length > 0).length)
  const alternates = localeAlternates('/lines', locale)
  return {
    title: { absolute: copy.metaTitle },
    description,
    alternates,
    ...shareMetadata({ title: copy.metaTitle, description, url: alternates.canonical, locale }),
    // A carried-over search (?stations=…) is not its own page; the language (?lang=) is.
    robots: Object.keys(params).some((key) => key !== 'lang') ? { index: false, follow: true } : undefined,
  }
}

export default async function LinesPage({ searchParams }: LinesPageProps) {
  const [locale, params] = await Promise.all([getLocale(), searchParams])
  const index = await getTransitIndex(locale)
  const copy = getTransitCopy(locale)
  // Only valid filters come through (canonicalSearchQuery drops anything else).
  const query = new URLSearchParams(canonicalSearchQuery(toSearchParams(params)))
  return <div className="container max-w-3xl py-8 text-[#1b293a] md:py-12">
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]"><TrainFront aria-hidden="true" className="h-4 w-4" />Welcome Home Tokyo</p>
    <h1 className="mt-3 text-2xl font-semibold leading-tight md:text-4xl">{copy.title}</h1>
    <p className="mt-3 text-sm leading-7 text-[#3d4a5a] md:text-base">{copy.intro}</p>
    <div className="mt-6">
      <StationPicker index={index} locale={locale} initialStations={query.get('stations')} initialLines={query.get('lines')}
        initialWalk={searchNumber(query.get('walkMax') ?? undefined, 'walk')} keep={query.toString()} />
    </div>
    {/* Bottom padding keeps the last links clear of the picker's fixed bar. The picker above already lists
        every line, so these page links start folded to avoid showing the same 55 lines twice. */}
    <details className="group mt-12 mb-40 rounded-xl border border-[#dbe2e9] px-4" aria-labelledby="line-pages-title">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <h2 id="line-pages-title" className="text-base font-semibold">{copy.linePages}</h2>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <ul className="grid gap-x-6 gap-y-1 pb-4 sm:grid-cols-2">
        {index.lines.filter((line) => line.count > 0).map((line) => <li key={line.id}>
          <Link href={`/lines/${line.id}`} className="flex min-h-9 items-center gap-2 text-sm text-[#274d7d] hover:underline">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: line.color }} />{line.label}<span className="text-xs text-[#657487]">{copy.count(line.count)}</span>
          </Link>
        </li>)}
      </ul>
    </details>
  </div>
}
