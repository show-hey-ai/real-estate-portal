'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import { MAP_LINES, MAP_STATIONS, MAP_VIEWBOX } from '@/lib/transit/map-layout.generated'
import type { TransitIndex } from '@/lib/transit/search'

/** Label sides as in map-layout.generated.ts: right, left, above, below, then the diagonals. */
const SIDES: [number, number][] = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1], [-1, -1], [-1, 1]]
const MAX_ZOOM = 6
const LABEL_PX = 12
const ALL_LABELS_AT = 1.3 // pixels per map unit
const SOME_LABELS_AT = 0.7
const TAP_SLOP_PX = 6

interface Camera { x: number; y: number; zoom: number }
interface RouteMapProps {
  index: TransitIndex
  locale: string
  selected: ReadonlySet<number>
  onToggle: (station: number) => void
  hint: string
  zoomIn: string
  zoomOut: string
  reset: string
}

/** Our schematic route map: drag or pinch to move and zoom, tap a station to select it. */
export function RouteMap({ index, locale, selected, onToggle, hint, zoomIn, zoomOut, reset }: RouteMapProps) {
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [camera, setCamera] = useState<Camera | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{ moved: number; start: Camera; distance: number; mid: { x: number; y: number } } | null>(null)
  const positionBySlug = useMemo(() => new Map(index.stations.map((station, position) => [station.slug, position])), [index])

  const fitZoom = size.width ? Math.min(size.width / MAP_VIEWBOX.width, size.height / MAP_VIEWBOX.height) : 1
  const start = (): Camera => ({ x: MAP_VIEWBOX.width / 2, y: MAP_VIEWBOX.height / 2, zoom: Math.max(fitZoom, Math.min(1.2, fitZoom * 2.4)) })
  const clamp = (next: Camera): Camera => ({ ...next, zoom: Math.min(MAX_ZOOM, Math.max(fitZoom, next.zoom)) })

  useEffect(() => {
    const element = box.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (size.width && !camera) setCamera(start())
    // Only the first measured size sets the starting view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width])

  // A plain wheel keeps scrolling the page; trackpad pinches and Ctrl/⌘ + wheel zoom the map. The
  // listener is not passive so the browser does not zoom the whole page at the same time.
  const wheelZoom = useRef<(event: WheelEvent) => void>(() => {})
  useEffect(() => {
    const element = box.current
    if (!element) return
    const listener = (event: WheelEvent) => wheelZoom.current(event)
    element.addEventListener('wheel', listener, { passive: false })
    return () => element.removeEventListener('wheel', listener)
  }, [])

  const view = camera ?? start()
  const [vw, vh] = [size.width / view.zoom || MAP_VIEWBOX.width, size.height / view.zoom || MAP_VIEWBOX.height]
  const toMap = (clientX: number, clientY: number) => {
    const rect = box.current!.getBoundingClientRect()
    return { x: view.x - vw / 2 + (clientX - rect.left) / view.zoom, y: view.y - vh / 2 + (clientY - rect.top) / view.zoom }
  }
  const zoomAround = (factor: number, anchor: { x: number; y: number }) => setCamera((current) => {
    const from = current ?? start()
    const next = clamp({ ...from, zoom: from.zoom * factor })
    const ratio = from.zoom / next.zoom
    return { zoom: next.zoom, x: anchor.x + (from.x - anchor.x) * ratio, y: anchor.y + (from.y - anchor.y) * ratio }
  })

  wheelZoom.current = (event) => {
    if (!event.ctrlKey && !event.metaKey) return
    event.preventDefault()
    zoomAround(Math.exp(-event.deltaY * 0.01), toMap(event.clientX, event.clientY))
  }

  function onPointerDown(event: React.PointerEvent) {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const points = [...pointers.current.values()]
    gesture.current = {
      moved: gesture.current?.moved ?? 0,
      start: view,
      distance: points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0,
      mid: points.length > 1 ? toMap((points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2) : { x: event.clientX, y: event.clientY },
    }
    if (pointers.current.size === 1) gesture.current.moved = 0
  }
  function onPointerMove(event: React.PointerEvent) {
    const previous = pointers.current.get(event.pointerId)
    if (!previous || !gesture.current) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gesture.current.moved += Math.hypot(event.clientX - previous.x, event.clientY - previous.y)
    const points = [...pointers.current.values()]
    if (points.length > 1 && gesture.current.distance) {
      const { start: from, distance, mid } = gesture.current
      const zoom = Math.min(MAX_ZOOM, Math.max(fitZoom, from.zoom * (Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) / distance)))
      const ratio = from.zoom / zoom
      setCamera({ zoom, x: mid.x + (from.x - mid.x) * ratio, y: mid.y + (from.y - mid.y) * ratio })
    } else if (points.length === 1) {
      setCamera((current) => {
        const from = current ?? start()
        return { ...from, x: from.x - (event.clientX - previous.x) / from.zoom, y: from.y - (event.clientY - previous.y) / from.zoom }
      })
    }
  }
  function onPointerUp(event: React.PointerEvent) {
    pointers.current.delete(event.pointerId)
    if (gesture.current && pointers.current.size === 1) {
      const [rest] = [...pointers.current.values()]
      gesture.current = { ...gesture.current, start: view, distance: 0, mid: rest }
    }
  }

  const pixelsPerUnit = view.zoom
  const showAll = pixelsPerUnit >= ALL_LABELS_AT
  const showSome = pixelsPerUnit >= SOME_LABELS_AT
  const font = LABEL_PX / pixelsPerUnit
  const sideColumn = locale === 'ja' ? 4 : 5

  return <div className="relative">
    <div ref={box} className="relative h-[68vh] min-h-[420px] touch-none select-none overflow-hidden rounded-xl border border-[#dbe2e9] bg-[#fbfcfd]"
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onPointerLeave={onPointerUp}>
      {size.width > 0 && <svg viewBox={`${view.x - vw / 2} ${view.y - vh / 2} ${vw} ${vh}`} width={size.width} height={size.height} aria-hidden="true" className="block">
        {MAP_LINES.map((line) => <path key={line.id} d={line.d} stroke={line.color} strokeWidth={3} strokeLinecap="round" fill="none" />)}
        {MAP_STATIONS.map(([slug, x, y, hub, jaSide, enSide]) => {
          const position = positionBySlug.get(slug)
          if (position === undefined) return null
          const station = index.stations[position]
          const chosen = selected.has(position)
          const [dx, dy] = SIDES[sideColumn === 4 ? jaSide : enSide]
          const labelled = showAll || (showSome && (hub === 1 || station.count > 0)) || chosen
          const gap = 6
          return <g key={slug} className="cursor-pointer" onClick={() => { if ((gesture.current?.moved ?? 0) < TAP_SLOP_PX) onToggle(position) }}>
            <circle cx={x} cy={y} r={11} fill="transparent" />
            <circle cx={x} cy={y} r={hub ? 5 : 3.6} fill={chosen ? '#274d7d' : station.count ? '#dbe8f4' : '#fff'} stroke={chosen ? '#18375f' : station.count ? '#274d7d' : '#8d99a6'} strokeWidth={chosen ? 2.2 : 1.3} />
            {labelled && <text x={x + dx * gap} y={y + (dy > 0 ? gap + font * 0.85 : dy < 0 ? -gap : font * 0.35)} textAnchor={dx > 0 ? 'start' : dx < 0 ? 'end' : 'middle'}
              fontSize={font} fontWeight={chosen || hub ? 700 : 500} fill={chosen ? '#18375f' : station.count ? '#1b293a' : '#7a8796'} stroke="#fbfcfd" strokeWidth={font * 0.28} paintOrder="stroke">
              {station.label}{station.count > 0 && showAll ? ` ${station.count}` : ''}
            </text>}
          </g>
        })}
      </svg>}
    </div>
    <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-lg border border-[#cfd9e3] bg-white shadow-sm">
      <button type="button" aria-label={zoomIn} onClick={() => zoomAround(1.5, { x: view.x, y: view.y })} className="flex h-10 w-10 items-center justify-center hover:bg-[#f3f6f9]"><Plus aria-hidden="true" className="h-4 w-4" /></button>
      <button type="button" aria-label={zoomOut} onClick={() => zoomAround(1 / 1.5, { x: view.x, y: view.y })} className="flex h-10 w-10 items-center justify-center border-t border-[#e3e9ef] hover:bg-[#f3f6f9]"><Minus aria-hidden="true" className="h-4 w-4" /></button>
      <button type="button" aria-label={reset} onClick={() => setCamera(start())} className="flex h-10 w-10 items-center justify-center border-t border-[#e3e9ef] hover:bg-[#f3f6f9]"><RotateCcw aria-hidden="true" className="h-4 w-4" /></button>
    </div>
    <p className="mt-2 text-xs text-[#657487]">{hint}</p>
  </div>
}
