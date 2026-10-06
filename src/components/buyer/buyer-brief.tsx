'use client'

import { FunnelText } from '@/components/analytics/buyer-funnel'
import { useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { ArrowRight } from 'lucide-react'
import { getBuyerJourneyCopy } from '@/lib/buyer-journey-copy'
import type { MarketCategory } from '@/lib/market-category'

type Brief = {
  purpose: '' | 'investment' | 'residential' | 'land'
  area: string
  budget: '' | 'under_50m' | '50m_100m' | '100m_200m' | 'over_200m'
  type: '' | 'condo' | 'house' | 'land' | 'whole_building' | 'commercial'
  timing: '' | 'soon' | 'this_year' | 'later'
  priority: '' | 'location' | 'space' | 'price' | 'commute'
}

const initialBrief: Brief = { purpose: '', area: '', budget: '', type: '', timing: '', priority: '' }
const purposeValues = ['investment', 'residential', 'land'] as const
const budgetValues = ['under_50m', '50m_100m', '100m_200m', 'over_200m'] as const
const typeValues = ['condo', 'house', 'land', 'whole_building', 'commercial'] as const
const timingValues = ['soon', 'this_year', 'later'] as const
const priorityValues = ['location', 'space', 'price', 'commute'] as const

export function BuyerBrief({ initialPurpose = '' }: { initialPurpose?: MarketCategory | '' }) {
  const locale = useLocale()
  const copy = getBuyerJourneyCopy(locale)
  const [brief, setBrief] = useState<Brief>({ ...initialBrief, purpose: initialPurpose })
  const whatsappUrl = useMemo(() => {
    const labels = [
      `${copy.purpose}: ${brief.purpose ? copy.purposeOptions[purposeValues.indexOf(brief.purpose as typeof purposeValues[number])] : copy.select}`,
      `${copy.area}: ${brief.area || copy.select}`,
      `${copy.budget}: ${brief.budget ? copy.budgetOptions[budgetValues.indexOf(brief.budget as typeof budgetValues[number])] : copy.select}`,
      `${copy.type}: ${brief.type ? copy.typeOptions[typeValues.indexOf(brief.type as typeof typeValues[number])] : copy.select}`,
      `${copy.timing}: ${brief.timing ? copy.timingOptions[timingValues.indexOf(brief.timing as typeof timingValues[number])] : copy.select}`,
      `${copy.priority}: ${brief.priority ? copy.priorityOptions[priorityValues.indexOf(brief.priority as typeof priorityValues[number])] : copy.select}`,
    ]
    return `https://wa.me/818084927068?text=${encodeURIComponent(`${copy.matchTitle}\n${labels.join('\n')}`)}`
  }, [brief, copy])

  const selectClass = 'h-12 w-full rounded-[4px] border border-[#cbd5df] bg-white px-3 text-[#1b293a] focus:border-[#274d7d] focus:outline-none'
  function recordContactClick() {
    const payload = JSON.stringify({ locale, search: window.location.search })
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/contact-click', new Blob([payload], { type: 'application/json' }))
    } else {
      void fetch('/api/analytics/contact-click', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true })
    }
  }
  return <div className="border-t-2 border-[#274d7d] bg-white pt-8">
    <div className="grid gap-5 md:grid-cols-2">
      <label><span className="mb-2 block text-sm font-semibold">{copy.purpose}</span><select value={brief.purpose} onChange={(event) => setBrief({ ...brief, purpose: event.target.value as Brief['purpose'] })} className={selectClass}><option value="">{copy.select}</option>{purposeValues.map((value, index) => <option key={value} value={value}>{copy.purposeOptions[index]}</option>)}</select></label>
      <label className="md:col-span-2"><span className="mb-2 block text-sm font-semibold">{copy.area}</span><input value={brief.area} onChange={(event) => setBrief({ ...brief, area: event.target.value.slice(0, 100) })} placeholder={copy.areaPlaceholder} maxLength={100} className={selectClass} /></label>
      <label><span className="mb-2 block text-sm font-semibold">{copy.budget}</span><select value={brief.budget} onChange={(event) => setBrief({ ...brief, budget: event.target.value as Brief['budget'] })} className={selectClass}><option value="">{copy.select}</option>{budgetValues.map((value, index) => <option key={value} value={value}>{copy.budgetOptions[index]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-semibold">{copy.type}</span><select value={brief.type} onChange={(event) => setBrief({ ...brief, type: event.target.value as Brief['type'] })} className={selectClass}><option value="">{copy.select}</option>{typeValues.map((value, index) => <option key={value} value={value}>{copy.typeOptions[index]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-semibold">{copy.timing}</span><select value={brief.timing} onChange={(event) => setBrief({ ...brief, timing: event.target.value as Brief['timing'] })} className={selectClass}><option value="">{copy.select}</option>{timingValues.map((value, index) => <option key={value} value={value}>{copy.timingOptions[index]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-semibold">{copy.priority}</span><select value={brief.priority} onChange={(event) => setBrief({ ...brief, priority: event.target.value as Brief['priority'] })} className={selectClass}><option value="">{copy.select}</option>{priorityValues.map((value, index) => <option key={value} value={value}>{copy.priorityOptions[index]}</option>)}</select></label>
    </div>
    <div className="mt-7 flex flex-wrap gap-3"><a href={whatsappUrl} onClick={recordContactClick} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-[4px] bg-[#274d7d] px-5 py-3 font-semibold text-white hover:bg-[#18375f]"><FunnelText field="contact" baseline={copy.contact} /><ArrowRight className="h-4 w-4" /></a></div>
    <p className="mt-3 text-xs text-[#657487]">{copy.contactNote}</p>
  </div>
}
