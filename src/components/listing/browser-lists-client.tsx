'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useSyncExternalStore } from 'react'
import { useLocale } from 'next-intl'
import { ArrowRight, Building2, Columns3, History, X } from 'lucide-react'
import { COMPARE_LIMIT, LISTS_CHANGED_EVENT, readCompare, readRecent, recordRecent, toggleCompare, type RecentListing } from '@/lib/browser-lists'
import { aiImageDisclosure } from '@/lib/image-disclosure'

const copy = {
  ja: { add: '比較に追加', remove: '比較から外す', bar: (count: number) => `比較リスト ${count}/${COMPARE_LIMIT}件`, open: '比較する', clear: '比較リストを空にする', recent: '最近見た物件' },
  en: { add: 'Add to compare', remove: 'Remove from compare', bar: (count: number) => `Compare list ${count}/${COMPARE_LIMIT}`, open: 'Compare', clear: 'Clear compare list', recent: 'Recently viewed' },
  'zh-TW': { add: '加入比較', remove: '移出比較', bar: (count: number) => `比較清單 ${count}/${COMPARE_LIMIT}`, open: '開始比較', clear: '清空比較清單', recent: '最近瀏覽的物件' },
  'zh-CN': { add: '加入比较', remove: '移出比较', bar: (count: number) => `比较清单 ${count}/${COMPARE_LIMIT}`, open: '开始比较', clear: '清空比较清单', recent: '最近浏览的房源' },
} as const

function useCopy() {
  const locale = useLocale()
  return copy[locale as keyof typeof copy] ?? copy.en
}

function storage() {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

function subscribe(onChange: () => void) {
  window.addEventListener(LISTS_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => { window.removeEventListener(LISTS_CHANGED_EVENT, onChange); window.removeEventListener('storage', onChange) }
}

function notify() {
  window.dispatchEvent(new Event(LISTS_CHANGED_EVENT))
}

// Snapshots are serialised so React sees a stable value between changes.
function useCompareIds(): string[] {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(readCompare(storage())), () => '[]')
  return JSON.parse(snapshot) as string[]
}

function useRecent(): RecentListing[] {
  const snapshot = useSyncExternalStore(subscribe, () => JSON.stringify(readRecent(storage())), () => '[]')
  return JSON.parse(snapshot) as RecentListing[]
}

export function CompareToggle({ listingId, compact = false }: { listingId: string; compact?: boolean }) {
  const text = useCopy()
  const selected = useCompareIds().includes(listingId)
  const label = selected ? text.remove : text.add
  return <button type="button" aria-pressed={selected} aria-label={label} title={label}
    onClick={(event) => { event.preventDefault(); toggleCompare(storage(), listingId); notify() }}
    className={compact
      ? `inline-flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${selected ? 'bg-[#274d7d] text-white' : 'text-[#657487] hover:bg-[#e9f0f7] hover:text-[#274d7d]'}`
      : `inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${selected ? 'border-[#274d7d] bg-[#274d7d] text-white' : 'border-[#cfd9e3] bg-white text-[#274d7d] hover:bg-[#f2f6fa]'}`}>
    <Columns3 aria-hidden="true" className="h-4 w-4" />{!compact && label}
  </button>
}

/** Floating link to the comparison page while the compare list has listings. */
export function CompareBar() {
  const text = useCopy()
  const ids = useCompareIds()
  if (!ids.length) return null
  return <div className="fixed bottom-20 left-3 z-40 flex items-center gap-2 rounded-xl border border-[#dbe2e9] bg-white/95 p-2 pl-3 text-sm shadow-lg backdrop-blur lg:bottom-6 lg:left-auto lg:right-6" data-testid="compare-bar">
    <Columns3 aria-hidden="true" className="h-4 w-4 text-[#274d7d]" />
    <span className="font-medium">{text.bar(ids.length)}</span>
    <Link href={`/compare?ids=${ids.join(',')}`} className="inline-flex min-h-9 items-center gap-1 rounded-lg bg-[#274d7d] px-3 font-semibold text-white hover:bg-[#18375f]">{text.open}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
    <button type="button" aria-label={text.clear} title={text.clear} onClick={() => { for (const id of ids) toggleCompare(storage(), id); notify() }} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#536274] hover:bg-[#f2f6fa]"><X aria-hidden="true" className="h-4 w-4" /></button>
  </div>
}

/** Records the listing being viewed for the "recently viewed" strip. */
export function ListingViewTracker({ listing }: { listing: Omit<RecentListing, 'viewedAt'> }) {
  useEffect(() => { recordRecent(storage(), listing); notify() }, [listing])
  return null
}

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const text = useCopy()
  const locale = useLocale()
  const recent = useRecent().filter((item) => item.id !== excludeId)
  // The server snapshot is empty, so the strip appears only after hydration.
  if (!recent.length) return null
  return <section className="mt-12" aria-labelledby="recently-viewed-title" data-testid="recently-viewed">
    <h2 id="recently-viewed-title" className="flex items-center gap-2 text-lg font-semibold"><History aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.recent}</h2>
    <ul className="mt-4 flex gap-3 overflow-x-auto pb-2">
      {recent.map((item) => <li key={item.id} className="w-44 shrink-0">
        <Link href={`/listings/${item.id}`} className="block overflow-hidden rounded-lg border border-[#dbe2e9] bg-white hover:shadow-md">
          <div className="relative aspect-[4/3] bg-[#eef2f6]">{item.image ? <Image src={item.image} alt="" fill sizes="176px" className="object-cover" /> : <Building2 aria-hidden="true" className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#9fb2c6]" />}</div>
          {aiImageDisclosure(typeof item.imageCaption === 'string' ? item.imageCaption : null, locale) && <p className="px-2 pt-1 text-xs text-[#536274]">{aiImageDisclosure(item.imageCaption, locale)?.label}</p>}
          <div className="p-2"><p className="text-sm font-bold text-[#1b293a]">{item.price}</p><p className="mt-0.5 line-clamp-2 text-xs text-[#536274]">{item.title}</p></div>
        </Link>
      </li>)}
    </ul>
  </section>
}
