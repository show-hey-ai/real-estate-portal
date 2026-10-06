'use client'

import { useId, useRef, useState } from 'react'
import type { PriceDistribution } from '@/lib/listing-search'
import {
  formatSearchPrice,
  getSearchExperienceCopy,
} from '@/lib/search-experience-copy'

interface SearchRangeProps {
  locale: string
  kind: 'price' | 'area'
  min: string | null
  max: string | null
  distribution?: PriceDistribution | null
  onApply: (min: string, max: string) => void
}

export function SearchRange({
  locale,
  kind,
  min,
  max,
  distribution,
  onApply,
}: SearchRangeProps) {
  const copy = getSearchExperienceCopy(locale)
  const id = useId()
  const scale = kind === 'price' ? (locale === 'en' ? 1_000_000 : 10_000) : 1
  const unit = kind === 'price' ? copy.priceUnit : 'm²'
  const title = kind === 'price' ? copy.price : copy.size
  const [lower, setLower] = useState(min ? String(Number(min) / scale) : '')
  const [upper, setUpper] = useState(max ? String(Number(max) / scale) : '')
  const [inputCeiling, setInputCeiling] = useState(0)
  const [error, setError] = useState('')
  const [activeHandle, setActiveHandle] = useState<'lower' | 'upper'>('lower')
  const lowerHandle = useRef<HTMLInputElement>(null)
  const upperHandle = useRef<HTMLInputElement>(null)
  const step = kind === 'price' ? 1_000_000 / scale : 5
  const rawCeiling =
    kind === 'price'
      ? Math.max(
          500_000_000,
          distribution
            ? Math.ceil(distribution.max / 100_000_000) * 100_000_000
            : 0,
          Number(min || 0),
          Number(max || 0),
          inputCeiling * scale
        ) / scale
      : Math.max(500, Number(min || 0), Number(max || 0), inputCeiling)
  const highestBound = Math.max(
    Number(min || 0) / scale,
    Number(max || 0) / scale,
    inputCeiling
  )
  const ceiling = Math.max(
    Math.ceil(rawCeiling / step) * step,
    (Math.ceil(highestBound / step) + 1) * step
  )
  const lowerValue = Math.max(0, Number(lower) || 0)
  const upperValue = upper === '' ? ceiling : Math.max(0, Number(upper) || 0)
  function enterBound(handle: 'lower' | 'upper', value: string) {
    setInputCeiling((previous) => Math.max(previous, Number(value) || 0))
    if (handle === 'lower') setLower(value)
    else setUpper(value)
  }
  function moveHandle(handle: 'lower' | 'upper', value: number) {
    setError('')
    if (handle === 'lower') {
      const next = Math.max(0, Math.min(value, upperValue))
      setLower(next === 0 ? '' : String(next))
    } else {
      const next = Math.min(ceiling, Math.max(value, lowerValue))
      setUpper(next === ceiling ? '' : String(next))
    }
  }
  function selectOnTrack(event: React.PointerEvent<HTMLDivElement>) {
    if (event.target instanceof HTMLInputElement) return
    event.preventDefault()
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (event.clientX - bounds.left - 12) / (bounds.width - 24)))
    const value = Math.min(ceiling, Math.round((ratio * ceiling) / step) * step)
    const lowerDistance = Math.abs(value - lowerValue)
    const upperDistance = Math.abs(value - upperValue)
    const handle =
      lowerDistance < upperDistance ||
      (lowerDistance === upperDistance && value < lowerValue)
        ? 'lower'
        : 'upper'
    const input = handle === 'lower' ? lowerHandle : upperHandle
    input.current?.focus()
    moveHandle(handle, value)
  }
  const maxBin = Math.max(
    1,
    ...(distribution?.bins.map((bin) => bin.count) || [])
  )
  function apply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (lower && upper && Number(lower) > Number(upper)) {
      setError(copy.invalidRange)
      return
    }
    setError('')
    onApply(
      lower ? String(Math.round(Number(lower) * scale * 100) / 100) : '',
      upper ? String(Math.round(Number(upper) * scale * 100) / 100) : ''
    )
  }
  const fieldClass =
    'h-10 w-full min-w-0 rounded-lg border border-[#ccd8dc] bg-white px-3 text-sm tabular-nums outline-none focus:border-[#274d7d] focus:ring-2 focus:ring-[#274d7d]/15'
  return (
    <form onSubmit={apply} className="space-y-3" data-testid={`${kind}-range`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[#243b45]">{title}</h3>
        <span className="text-xs text-[#73848a]">{unit}</span>
      </div>
      {distribution && kind === 'price' && (
        <div className="space-y-2">
          <div
            className="flex h-14 items-end gap-1"
            role="img"
            aria-label={`${copy.distribution}: ${distribution.count} ${copy.results}`}
          >
            {distribution.bins.map((bin, index) => (
              <div
                key={index}
                className="flex-1 rounded-t-sm bg-[#8cbcb2]"
                style={{ height: `${(bin.count / maxBin) * 100}%` }}
                title={`${formatSearchPrice(bin.from, locale)} – ${formatSearchPrice(bin.to, locale)}: ${bin.count}`}
              />
            ))}
          </div>
          <p className="text-[11px] leading-4 text-[#73848a]">
            {copy.distribution}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label
            htmlFor={`${id}-min`}
            className="mb-1.5 block text-xs text-[#677a82]"
          >
            {copy.minimum}
          </label>
          <input
            id={`${id}-min`}
            type="number"
            min="0"
            max={kind === 'price' ? 999_999_999_999 / scale : 999_999}
            step={kind === 'price' ? 1 / scale : '0.01'}
            inputMode="decimal"
            value={lower}
            onChange={(event) => enterBound('lower', event.target.value)}
            placeholder="—"
            className={fieldClass}
            aria-invalid={Boolean(error)}
          />
        </div>
        <div>
          <label
            htmlFor={`${id}-max`}
            className="mb-1.5 block text-xs text-[#677a82]"
          >
            {copy.maximum}
          </label>
          <input
            id={`${id}-max`}
            type="number"
            min="0"
            max={kind === 'price' ? 999_999_999_999 / scale : 999_999}
            step={kind === 'price' ? 1 / scale : '0.01'}
            inputMode="decimal"
            value={upper}
            onChange={(event) => enterBound('upper', event.target.value)}
            placeholder="—"
            className={fieldClass}
            aria-invalid={Boolean(error)}
          />
        </div>
      </div>
      <div
        className="relative h-11"
        role="group"
        aria-label={`${title} (${unit})`}
        onPointerDown={selectOnTrack}
      >
        <div className="pointer-events-none absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#d6e3df]">
          <div
            className="absolute inset-y-0 rounded-full bg-[#39786e]"
            style={{
              left: `${(Math.min(lowerValue, upperValue) / ceiling) * 100}%`,
              right: `${100 - (Math.max(lowerValue, upperValue) / ceiling) * 100}%`,
            }}
          />
        </div>
        <input
          ref={lowerHandle}
          type="range"
          min="0"
          max={ceiling}
          step={step}
          value={lowerValue}
          onChange={(event) => moveHandle('lower', Number(event.target.value))}
          onFocus={() => setActiveHandle('lower')}
          aria-label={`${title} ${copy.minimum} (${unit})`}
          aria-valuemax={upperValue}
          className="search-range-slider"
          style={{ zIndex: activeHandle === 'lower' ? 2 : 1 }}
        />
        <input
          ref={upperHandle}
          type="range"
          min="0"
          max={ceiling}
          step={step}
          value={upperValue}
          onChange={(event) => moveHandle('upper', Number(event.target.value))}
          onFocus={() => setActiveHandle('upper')}
          aria-label={`${title} ${copy.maximum} (${unit})`}
          aria-valuemin={lowerValue}
          className="search-range-slider"
          style={{ zIndex: activeHandle === 'upper' ? 2 : 1 }}
        />
      </div>
      {kind === 'area' && (
        <p className="text-[11px] leading-5 text-[#73848a]">{copy.sizeNote}</p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        type="submit"
        className="w-full rounded-lg border border-[#cadbd6] bg-[#f0f7f5] py-2 text-xs font-semibold text-[#2b655b] transition hover:bg-[#e3efeb]"
      >
        {copy.apply}
      </button>
    </form>
  )
}
