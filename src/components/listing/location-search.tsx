'use client'

import { useId, useMemo, useState } from 'react'
import { MapPin, Search, TrainFront } from 'lucide-react'
import type { PublicSearchLocationIndex } from '@/lib/public-search'
import { getSearchExperienceCopy } from '@/lib/search-experience-copy'
import {
  translateCityName,
  translateRailwayLine,
  translateStationName,
} from '@/lib/translate-fields'

interface LocationSearchProps {
  locale: string
  locationIndex: PublicSearchLocationIndex
  onSelect: (updates: Record<string, string>) => void
}

export function LocationSearch({
  locale,
  locationIndex,
  onSelect,
}: LocationSearchProps) {
  const id = useId()
  const copy = getSearchExperienceCopy(locale)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const options = useMemo(() => {
    const wards = locationIndex.wards.map((value) => ({
      kind: 'ward',
      value,
      label: translateCityName(value, locale) || value,
      type: copy.ward,
    }))
    const lines = locationIndex.lines.map((value) => ({
      kind: 'line',
      value,
      label: translateRailwayLine(value, locale) || value,
      type: copy.line,
    }))
    const stations = [
      ...new Set(Object.values(locationIndex.stationsByLine).flat()),
    ].map((value) => ({
      kind: 'station',
      value,
      label: translateStationName(value, locale) || value,
      type: copy.station,
    }))
    return [...wards, ...lines, ...stations]
  }, [locationIndex, locale, copy])
  const needle = query.normalize('NFKC').toLocaleLowerCase().trim()
  const matches = needle
    ? options
        .filter((item) =>
          `${item.value} ${item.label}`
            .normalize('NFKC')
            .toLocaleLowerCase()
            .includes(needle)
        )
        .slice(0, 8)
    : []
  function select(index: number) {
    const option = matches[index]
    if (!option) return
    onSelect({
      ward: '',
      line: '',
      station: '',
      prefecture: '',
      [option.kind]: option.value,
    })
    setQuery('')
    setOpen(false)
  }
  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setOpen(false)
      }}
    >
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#243b45]"
      >
        <MapPin className="h-4 w-4 text-[#39786e]" />
        {copy.location}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#82939b]" />
        <input
          id={id}
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open && Boolean(needle)}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            open && matches[active] ? `${id}-option-${active}` : undefined
          }
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            // Enter confirms Japanese/Chinese text before it selects a location.
            if (
              event.nativeEvent.isComposing ||
              event.nativeEvent.keyCode === 229
            )
              return
            if (event.key === 'Escape') setOpen(false)
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              setOpen(true)
              setActive((current) =>
                matches.length
                  ? (current +
                      (event.key === 'ArrowDown' ? 1 : -1) +
                      matches.length) %
                    matches.length
                  : 0
              )
            }
            if (event.key === 'Enter' && open) {
              event.preventDefault()
              select(active)
            }
          }}
          placeholder={copy.locationPlaceholder}
          className="h-11 w-full min-w-0 rounded-lg border border-[#ccd8dc] bg-white pl-9 pr-3 text-sm outline-none focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15"
        />
      </div>
      {open && needle && (
        <ul
          id={`${id}-options`}
          role="listbox"
          aria-label={copy.location}
          className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-[#d4e1e0] bg-white p-1.5 shadow-lg"
        >
          {matches.map((option, index) => (
            <li key={`${option.kind}:${option.value}`} role="presentation">
              <button
                id={`${id}-option-${index}`}
                type="button"
                role="option"
                aria-selected={active === index}
                tabIndex={-1}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(index)}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-sm ${active === index ? 'bg-[#edf5f2]' : 'hover:bg-[#f4f7f8]'}`}
              >
                {option.kind === 'ward' ? (
                  <MapPin className="h-4 w-4 shrink-0 text-[#39786e]" />
                ) : (
                  <TrainFront className="h-4 w-4 shrink-0 text-[#39786e]" />
                )}
                <span className="min-w-0 flex-1 break-words">
                  {option.label}
                </span>
                <span className="shrink-0 text-[10px] text-[#75898d]">
                  {option.type}
                </span>
              </button>
            </li>
          ))}
          {!matches.length && (
            <li role="presentation" className="p-3 text-xs text-[#74858d]">
              {copy.noLocations}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
