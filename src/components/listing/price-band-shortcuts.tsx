import Link from 'next/link'
import { Wallet } from 'lucide-react'
import { PRICE_BANDS, priceBandLabel } from '@/lib/price-bands'
import { budgetSlugFor } from '@/lib/collections'

const copy = {
  ja: { title: '予算から探す', note: '数字は公開中の物件数です。', unit: '件' },
  en: { title: 'Browse by budget', note: 'Numbers show listings for sale now.', unit: '' },
  'zh-TW': { title: '依預算尋找', note: '數字為目前刊登中的物件數。', unit: '筆' },
  'zh-CN': { title: '按预算查找', note: '数字为当前在售房源数。', unit: '套' },
} as const

interface PriceBandShortcutsProps {
  locale: string
  counts: number[]
}

export function PriceBandShortcuts({ locale, counts }: PriceBandShortcutsProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const max = Math.max(1, ...counts)
  return <section aria-labelledby="price-band-title" data-testid="price-bands" className="lg:rounded-2xl lg:border lg:border-[#dbe2e9] lg:p-6">
    <h2 id="price-band-title" className="flex items-center gap-2 text-lg font-semibold md:text-xl"><Wallet aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.title}</h2>
    <p className="mt-1 text-xs text-[#536274] md:text-sm">{text.note}</p>
    <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5 lg:grid-cols-1">
      {PRICE_BANDS.map((band, index) => {
        const count = counts[index] ?? 0
        const content = <>
          <span className="text-sm font-semibold">{priceBandLabel(band, locale)}</span>
          <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true"><span className="block h-full rounded-full bg-[#274d7d]" style={{ width: `${(count / max) * 100}%` }} /></span>
          <span className="mt-1.5 block text-xs tabular-nums text-[#536274]">{count}{text.unit && ` ${text.unit}`}</span>
        </>
        return <li key={band.min}>{count > 0
          ? <Link href={`/budget/${budgetSlugFor(band)}`} prefetch={false} className="block rounded-xl border border-[#dbe2e9] bg-white p-3 transition-colors hover:border-[#274d7d] hover:bg-[#f4f7fb]">{content}</Link>
          : <div className="rounded-xl border border-[#e5eaf0] bg-[#f6f8fa] p-3 text-[#5f6b78]">{content}</div>}</li>
      })}
    </ul>
  </section>
}
