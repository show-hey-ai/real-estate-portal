'use client'

import { ChevronDown } from 'lucide-react'
import type { TransitCopy } from '@/lib/transit/copy'
import type { IndexLine, IndexStation } from '@/lib/transit/search'

interface LineRowProps {
  line: IndexLine
  stations: readonly IndexStation[]
  copy: TransitCopy
  open: boolean
  lineSelected: boolean
  selected: ReadonlySet<number>
  onOpen: () => void
  onToggleLine: () => void
  onToggleStation: (station: number) => void
}

/** One line: a header that opens the line, then its stations along a bar in the line's colour. */
export function LineRow({ line, stations, copy, open, lineSelected, selected, onOpen, onToggleLine, onToggleStation }: LineRowProps) {
  const panelId = `line-${line.id}`
  const chosen = line.stations.filter((station) => selected.has(station)).length
  const segments = [{ title: null as string | null, members: line.stations.slice(0, line.branches[0]?.[0] ?? line.stations.length) }]
  line.branches.forEach(([start, from], position) => {
    const end = line.branches[position + 1]?.[0] ?? line.stations.length
    segments.push({ title: copy.branch(stations[from].label), members: line.stations.slice(start, end) })
  })
  return <li className="border-b border-[#e3e9ef] last:border-b-0">
    <button type="button" onClick={onOpen} aria-expanded={open} aria-controls={panelId} className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left hover:bg-[#f3f6f9]">
      <span aria-hidden="true" className="h-6 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: line.color }} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#1b293a]">{line.label}</span>
        {(line.loop || chosen > 0) && <span className="block text-[11px] text-[#657487]">{[line.loop ? copy.loop : null, chosen > 0 ? `✓ ${chosen}` : null].filter(Boolean).join(' · ')}</span>}
      </span>
      <span className={`shrink-0 text-xs tabular-nums ${line.count ? 'font-semibold text-[#274d7d]' : 'text-[#9aa6b2]'}`}>{copy.count(line.count)}</span>
      <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#657487] transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div id={panelId} className="px-3 pb-4">
      <label className="mb-2 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-[#f3f6f9] px-3 text-sm font-semibold text-[#274d7d]">
        <input type="checkbox" checked={lineSelected} onChange={onToggleLine} className="h-4 w-4 accent-[#274d7d]" />
        <span className="flex-1">{copy.allStations}</span>
        <span className="text-xs tabular-nums">{copy.count(line.count)}</span>
      </label>
      {segments.map(({ title, members }) => <div key={title ?? 'main'}>
        {title && <p className="mb-1 mt-3 pl-8 text-[11px] font-semibold text-[#657487]">{title}</p>}
        <ul className="relative">
          <span aria-hidden="true" className="absolute bottom-3 left-[13px] top-3 w-1 rounded-full" style={{ backgroundColor: line.color }} />
          {members.map((station) => {
            const item = stations[station]
            return <li key={station}>
              <label className="relative flex min-h-10 cursor-pointer items-center gap-3 rounded-md pl-1.5 pr-2 hover:bg-[#f3f6f9]">
                <input type="checkbox" checked={selected.has(station)} onChange={() => onToggleStation(station)} className="relative h-4 w-4 accent-[#274d7d]" />
                <span className={`flex-1 text-sm ${item.count ? 'text-[#1b293a]' : 'text-[#8d99a6]'}`}>{item.label}</span>
                <span className={`text-xs tabular-nums ${item.count ? 'font-semibold text-[#274d7d]' : 'text-[#a9b3bd]'}`}>{copy.count(item.count)}</span>
              </label>
            </li>
          })}
        </ul>
      </div>)}
    </div>}
  </li>
}
