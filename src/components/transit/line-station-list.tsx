import Link from 'next/link'
import type { TransitLine } from '@/lib/transit/lines'

interface LineStationListProps {
  line: TransitLine
  counts: ReadonlyMap<string, number>
  label: (station: string) => string
  slug: (station: string) => string
  count: (count: number) => string
  branch: (from: string) => string
}

/** A line's stations in running order along a bar in the line colour; stations with listings link to their page. */
export function LineStationList({ line, counts, label, slug, count, branch }: LineStationListProps) {
  const segments = [{ title: null as string | null, stations: line.stations }, ...(line.branches ?? []).map((spur) => ({ title: branch(label(spur.from)), stations: spur.stations }))]
  return <div className="grid gap-x-8 sm:grid-cols-2">
    {segments.map(({ title, stations }) => <div key={title ?? 'main'} className={title ? 'mt-4 sm:mt-0' : ''}>
      {title && <p className="mb-1 pl-7 text-xs font-semibold text-[#657487]">{title}</p>}
      <ol className="relative">
        <span aria-hidden="true" className="absolute bottom-3 left-[7px] top-3 w-1 rounded-full" style={{ backgroundColor: line.color }} />
        {stations.map((station) => {
          const listings = counts.get(station) ?? 0
          const name = label(station)
          return <li key={station} className="relative flex min-h-10 items-center gap-3">
            <span aria-hidden="true" className="relative h-[18px] w-[18px] shrink-0 rounded-full border-[3px] bg-white" style={{ borderColor: line.color }} />
            {listings > 0
              ? <Link href={`/stations/${slug(station)}`} className="flex-1 text-sm font-semibold text-[#274d7d] hover:underline">{name}</Link>
              : <span className="flex-1 text-sm text-[#8d99a6]">{name}</span>}
            <span className={`text-xs tabular-nums ${listings ? 'font-semibold text-[#274d7d]' : 'text-[#a9b3bd]'}`}>{count(listings)}</span>
          </li>
        })}
      </ol>
    </div>)}
  </div>
}
