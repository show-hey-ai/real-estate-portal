'use client'

import { useRef, useState } from 'react'
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
  /** Turn a run of neighbouring stations on or off at once. */
  onSetStations: (stations: number[], on: boolean) => void
}

interface Drag { segment: string; members: number[]; from: number; to: number; on: boolean; active: boolean }

/** One line: a header that opens the line, then its stations along a bar in the line's colour. */
export function LineRow({ line, stations, copy, open, lineSelected, selected, onOpen, onToggleLine, onToggleStation, onSetStations }: LineRowProps) {
  const panelId = `line-${line.id}`
  const [drag, setDrag] = useState<Drag | null>(null)
  const anchor = useRef<{ segment: string; position: number } | null>(null)
  const shiftClick = useRef(false)
  const chosen = line.stations.filter((station) => selected.has(station)).length
  const segments = [{ title: null as string | null, members: line.stations.slice(0, line.branches[0]?.[0] ?? line.stations.length) }]
  line.branches.forEach(([start, from], position) => {
    const end = line.branches[position + 1]?.[0] ?? line.stations.length
    segments.push({ title: copy.branch(stations[from].label), members: line.stations.slice(start, end) })
  })
  const range = (members: number[], from: number, to: number) => members.slice(Math.min(from, to), Math.max(from, to) + 1)
  const inDrag = (segment: string, position: number) => Boolean(drag?.active && drag.segment === segment && position >= Math.min(drag.from, drag.to) && position <= Math.max(drag.from, drag.to))

  // Dragging starts on a tick box (so touch scrolling elsewhere still works) and covers the rows it passes.
  function stationAt(event: React.PointerEvent): number | null {
    const row = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>(`[data-line="${line.id}"][data-segment="${drag?.segment}"]`)
    return row ? Number(row.dataset.position) : null
  }
  function onPointerMove(event: React.PointerEvent<HTMLUListElement>) {
    if (!drag) return
    const position = stationAt(event)
    if (position === null) return
    if (position !== drag.from && !drag.active) event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({ ...drag, to: position, active: drag.active || position !== drag.from })
  }
  function onPointerUp() {
    if (drag?.active) onSetStations(range(drag.members, drag.from, drag.to), drag.on)
    setDrag(null)
  }

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
      <label className="mb-1 flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-[#f3f6f9] px-3 text-sm font-semibold text-[#274d7d]">
        <input type="checkbox" checked={lineSelected} onChange={onToggleLine} className="h-4 w-4 accent-[#274d7d]" />
        <span className="flex-1">{copy.allStations}</span>
        <span className="text-xs tabular-nums">{copy.count(line.count)}</span>
      </label>
      <p className="mb-2 px-1 text-[11px] leading-4 text-[#657487]">{copy.rangeHint}</p>
      {segments.map(({ title, members }) => { const segment = title ?? 'main'; return <div key={segment}>
        {title && <p className="mb-1 mt-3 pl-8 text-[11px] font-semibold text-[#657487]">{title}</p>}
        <ul className="relative" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)}>
          <span aria-hidden="true" className="absolute bottom-3 left-[13px] top-3 w-1 rounded-full" style={{ backgroundColor: line.color }} />
          {members.map((station, position) => {
            const item = stations[station]
            return <li key={station} data-line={line.id} data-segment={segment} data-position={position}>
              <label className={`relative flex min-h-10 cursor-pointer items-center gap-3 rounded-md pl-1.5 pr-2 hover:bg-[#f3f6f9] ${inDrag(segment, position) ? 'bg-[#e1ebf6]' : ''}`}>
                <input type="checkbox" checked={selected.has(station)} className="relative h-4 w-4 touch-none accent-[#274d7d]"
                  onPointerDown={() => setDrag({ segment, members, from: position, to: position, on: !selected.has(station), active: false })}
                  onClick={(event) => { shiftClick.current = event.shiftKey }}
                  onChange={() => {
                    // Shift+click ticks every station from the last one clicked on this stretch.
                    if (shiftClick.current && anchor.current?.segment === segment) onSetStations(range(members, anchor.current.position, position), !selected.has(station))
                    else onToggleStation(station)
                    anchor.current = { segment, position }
                  }} />
                <span className={`flex-1 text-sm ${item.count ? 'text-[#1b293a]' : 'text-[#8d99a6]'}`}>{item.label}</span>
                <span className={`text-xs tabular-nums ${item.count ? 'font-semibold text-[#274d7d]' : 'text-[#a9b3bd]'}`}>{copy.count(item.count)}</span>
              </label>
            </li>
          })}
        </ul>
      </div> })}
    </div>}
  </li>
}
