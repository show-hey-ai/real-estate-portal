'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Search, X } from 'lucide-react'
import { getTransitCopy } from '@/lib/transit/copy'
import type { LineCategory } from '@/lib/transit/lines'
import { countMatches, effectiveStations, initialSelection, isLineSelected, listingsHref, toggleLine, toggleStation, type PickerSelection } from '@/lib/transit/picker-state'
import type { TransitIndex } from '@/lib/transit/search'
import { LineRow } from './line-row'

const CATEGORIES: LineCategory[] = ['jr', 'metro', 'toei', 'private']
const WALK_OPTIONS = [5, 10, 15]
const MAX_SEARCH_RESULTS = 20

interface StationPickerProps {
  index: TransitIndex
  locale: string
  initialStations: string | null
  initialLines: string | null
  initialWalk: number | null
  /** The visitor's other /listings filters, carried over to the results. */
  keep: string
}

export function StationPicker({ index, locale, initialStations, initialLines, initialWalk, keep }: StationPickerProps) {
  const copy = getTransitCopy(locale)
  const [selection, setSelection] = useState<PickerSelection>(() => initialSelection(index, initialStations, initialLines))
  const [walk, setWalk] = useState<number | null>(initialWalk)
  const [query, setQuery] = useState('')
  // Open the chosen whole lines, and for single stations the first line that stops there.
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set([
    ...selection.lines,
    ...[...selection.stations].flatMap((station) => index.lines.find((line) => line.stations.includes(station))?.id ?? []),
  ]))
  const walkOptions = [...new Set([...WALK_OPTIONS, ...(initialWalk ? [initialWalk] : [])])].sort((a, b) => a - b)
  const selected = useMemo(() => effectiveStations(index, selection), [index, selection])
  const total = useMemo(() => countMatches(index, selected, walk), [index, selected, walk])
  const needle = query.normalize('NFKC').toLowerCase().trim()
  // Names that start with the text first, then stations with more listings.
  const found = needle
    ? index.stations
      .flatMap((station, position) => {
        const names = [station.label, station.alt].map((name) => name.normalize('NFKC').toLowerCase())
        return names.some((name) => name.includes(needle)) ? [{ position, starts: names.some((name) => name.startsWith(needle)), count: station.count }] : []
      })
      .sort((left, right) => Number(right.starts) - Number(left.starts) || right.count - left.count)
      .slice(0, MAX_SEARCH_RESULTS)
      .map(({ position }) => position)
    : []
  const chips = [
    ...[...selection.lines].map((id) => ({ key: `line:${id}`, label: index.lines.find((line) => line.id === id)?.label ?? id, remove: () => setSelection(toggleLine(index, selection, id)) })),
    ...[...selection.stations].map((station) => ({ key: `station:${station}`, label: index.stations[station].label, remove: () => setSelection(toggleStation(index, selection, station)) })),
  ]
  const toggleOpen = (id: string) => setOpen((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  return <div data-testid="station-picker">
    <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#82939b]" />
      <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} aria-label={copy.search} className="h-11 w-full rounded-lg border border-[#cbd5df] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15" />
    </div>
    {needle && <ul className="mt-2 overflow-hidden rounded-lg border border-[#dbe2e9] bg-white" aria-live="polite">
      {found.length === 0 && <li className="px-3 py-3 text-sm text-[#657487]">{copy.noMatch}</li>}
      {found.map((station) => <li key={station} className="border-b border-[#eef2f5] last:border-b-0">
        <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 hover:bg-[#f3f6f9]">
          <input type="checkbox" checked={selected.has(station)} onChange={() => setSelection(toggleStation(index, selection, station))} className="h-4 w-4 accent-[#274d7d]" />
          <span className="flex-1 text-sm">{index.stations[station].label} <span className="text-xs text-[#8d99a6]">{index.stations[station].alt}</span></span>
          <span className="text-xs tabular-nums text-[#274d7d]">{copy.count(index.stations[station].count)}</span>
        </label>
      </li>)}
    </ul>}

    <nav className="mt-5 flex flex-wrap gap-2" aria-label={copy.title}>
      {CATEGORIES.map((category) => <a key={category} href={`#lines-${category}`} className="rounded-full border border-[#cfd9e3] bg-white px-3 py-1.5 text-xs font-semibold text-[#274d7d] hover:bg-[#f3f6f9]">{copy.categories[category]}</a>)}
    </nav>

    {CATEGORIES.map((category) => {
      const lines = index.lines.filter((line) => line.category === category)
      const operators = category === 'private' ? [...new Set(lines.map((line) => line.operator))] : [null]
      return <section key={category} id={`lines-${category}`} className="mt-6 scroll-mt-32">
        <h2 className="text-base font-semibold text-[#1b293a]">{copy.categories[category]}</h2>
        {operators.map((operator) => <div key={operator ?? category} className="mt-2">
          {operator && <h3 className="mb-1 mt-3 text-xs font-semibold text-[#657487]">{operator}</h3>}
          <ul className="overflow-hidden rounded-xl border border-[#dbe2e9] bg-white">
            {lines.filter((line) => !operator || line.operator === operator).map((line) => <LineRow key={line.id} line={line} stations={index.stations} copy={copy}
              open={open.has(line.id)} lineSelected={isLineSelected(index, selection, line.id)} selected={selected}
              onOpen={() => toggleOpen(line.id)} onToggleLine={() => setSelection(toggleLine(index, selection, line.id))}
              onToggleStation={(station) => setSelection(toggleStation(index, selection, station))} />)}
          </ul>
        </div>)}
      </section>
    })}

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dbe2e9] bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_16px_rgba(27,41,58,0.08)] backdrop-blur">
      <div className="mx-auto max-w-3xl">
        {chips.length > 0 && <ul className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {chips.map((chip) => <li key={chip.key} className="shrink-0">
            <button type="button" onClick={chip.remove} aria-label={copy.remove(chip.label)} className="inline-flex items-center gap-1 rounded-full bg-[#e8eef5] px-2.5 py-1 text-xs font-semibold text-[#274d7d]">{chip.label}<X aria-hidden="true" className="h-3 w-3" /></button>
          </li>)}
        </ul>}
        <div className="flex items-center gap-2">
          <select value={walk ?? ''} onChange={(event) => setWalk(event.target.value ? Number(event.target.value) : null)} aria-label={copy.walk} className="h-11 shrink-0 rounded-lg border border-[#cbd5df] bg-white px-2 text-sm">
            <option value="">{copy.walk}: {copy.walkAny}</option>
            {walkOptions.map((minutes) => <option key={minutes} value={minutes}>{copy.walkWithin(minutes)}</option>)}
          </select>
          {chips.length > 0 && <button type="button" onClick={() => setSelection({ lines: new Set(), stations: new Set() })} className="h-11 shrink-0 px-2 text-sm text-[#657487] underline-offset-2 hover:underline">{copy.clear}</button>}
          {chips.length === 0
            ? <span className="ml-auto text-xs text-[#657487]">{copy.choose}</span>
            : total > 0
              ? <Link href={listingsHref(index, selection, walk, keep)} className="ml-auto inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg bg-[#274d7d] px-4 text-sm font-semibold text-white hover:bg-[#18375f]">{copy.show(total)}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              : <span className="ml-auto text-sm text-[#657487]">{copy.nothing}</span>}
        </div>
      </div>
    </div>
  </div>
}
