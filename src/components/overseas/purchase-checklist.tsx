'use client'

import { useMemo, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import type { ChecklistGroup } from '@/content/overseas-buying'
import { formatProgress } from '@/lib/progress-text'

const STORAGE_KEY = 'overseas-purchase-checklist-v1'
const CHANGE_EVENT = 'overseas-checklist-change'

function readSaved(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange)
  window.addEventListener(CHANGE_EVENT, onChange)
  return () => {
    window.removeEventListener('storage', onChange)
    window.removeEventListener(CHANGE_EVENT, onChange)
  }
}

function save(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, [...ids].join(','))
  } catch {
    // Private mode or blocked storage: the ticks simply are not kept.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

interface PurchaseChecklistProps {
  groups: ChecklistGroup[]
  progress: string
  reset: string
  guideLink: string
}

/** Ticks are a per-visitor convenience kept in this browser only; nothing is sent anywhere. */
export function PurchaseChecklist({ groups, progress, reset, guideLink }: PurchaseChecklistProps) {
  const raw = useSyncExternalStore(subscribe, readSaved, () => '')
  const done = useMemo(() => new Set(raw.split(',').filter(Boolean)), [raw])
  const allIds = groups.flatMap((group) => group.items.map((item) => item.id))
  const doneCount = allIds.filter((id) => done.has(id)).length

  const toggle = (id: string) => {
    const next = new Set(done)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    save(next)
  }

  return <div className="mt-5">
    <div className="rounded-xl bg-[#f4f7fb] px-4 py-3">
      <div className="flex min-h-11 flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#274d7d]" aria-live="polite"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />{formatProgress(progress, doneCount, allIds.length)}</p>
        {doneCount > 0 && <button type="button" onClick={() => save(new Set())} className="min-h-11 rounded-lg px-3 text-sm font-medium text-[#536274] hover:bg-white">{reset}</button>}
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white" aria-hidden="true"><div className="h-full rounded-full bg-[#274d7d] transition-[width] motion-reduce:transition-none" style={{ width: `${allIds.length ? (doneCount / allIds.length) * 100 : 0}%` }} /></div>
    </div>
    <div className="mt-5 grid gap-5 lg:grid-cols-3">
      {groups.map((group) => <fieldset key={group.id} className="min-w-0 rounded-xl border border-[#dbe2e9] bg-white p-4">
        <legend className="px-1 text-base font-semibold">{group.title}</legend>
        <ul className="mt-1 space-y-1">
          {group.items.map((item) => <li key={item.id}>
            <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg px-2 py-2 hover:bg-[#f7f9fc]">
              <input type="checkbox" id={`check-${item.id}`} checked={done.has(item.id)} onChange={() => toggle(item.id)} className="mt-1 h-5 w-5 shrink-0 accent-[#274d7d]" />
              <span className={`text-sm leading-6 ${done.has(item.id) ? 'text-[#5d6977] line-through' : 'text-[#1b293a]'}`}>{item.label}</span>
            </label>
            {item.href && <Link href={item.href} className="ml-10 inline-flex min-h-9 items-center gap-1 text-xs font-semibold text-[#274d7d] hover:underline">{guideLink}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>}
          </li>)}
        </ul>
      </fieldset>)}
    </div>
  </div>
}
