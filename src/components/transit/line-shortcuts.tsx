import Link from 'next/link'
import { ArrowRight, TrainFront } from 'lucide-react'
import { getTransitCopy } from '@/lib/transit/copy'
import type { TransitIndex } from '@/lib/transit/search'

const SHORTCUTS = 10

/** Home-page entry to line search: the lines with the most listings, then every line. */
export function LineShortcuts({ index, locale }: { index: TransitIndex; locale: string }) {
  const copy = getTransitCopy(locale)
  const busiest = [...index.lines].filter((line) => line.count > 0).sort((left, right) => right.count - left.count).slice(0, SHORTCUTS)
  return <section aria-labelledby="line-shortcuts-title" data-testid="line-shortcuts" className="rounded-2xl border border-[#dbe2e9] bg-[#f8fafc] p-4 md:p-6">
    <h2 id="line-shortcuts-title" className="flex items-center gap-2 text-lg font-semibold md:text-xl"><TrainFront aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{copy.entryTitle}</h2>
    <p className="mt-1 text-xs leading-5 text-[#657487] md:text-sm">{copy.entryNote}</p>
    <ul className="mt-4 flex flex-wrap gap-2">
      {busiest.map((line) => <li key={line.id}>
        <Link href={`/listings?lines=${line.id}`} prefetch={false} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#cfd9e3] bg-white px-3 text-sm font-semibold text-[#1b293a] hover:bg-[#f3f6f9]">
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ backgroundColor: line.color }} />
          {line.label}
          <span className="text-xs font-normal tabular-nums text-[#657487]">{copy.count(line.count)}</span>
        </Link>
      </li>)}
    </ul>
    <div className="mt-4 text-center"><Link href="/lines" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d] hover:underline">{copy.allLines}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
  </section>
}
