'use client'

import { type BuyerCriteria, types, wards } from '@/lib/buyer-matching-policy'
import { getBuyerMatchingCopy } from '@/lib/buyer-matching-copy'
import { getBuyerJourneyCopy } from '@/lib/buyer-journey-copy'
import { getBuyerSearchCopy } from '@/lib/buyer-search-copy'
import { translateCityName } from '@/lib/translate-fields'

type Props = {
  locale: string
  criteria: BuyerCriteria
  disabled: boolean
  onChange: <K extends keyof BuyerCriteria>(key: K, value: BuyerCriteria[K]) => void
}

export function BuyerCriteriaForm({ locale, criteria, disabled, onChange }: Props) {
  const c = getBuyerMatchingCopy(locale), journey = getBuyerJourneyCopy(locale), ui = getBuyerSearchCopy(locale)
  const inputClass = 'h-11 w-full min-w-0 rounded-lg border border-[#cbd5df] bg-white px-3 text-[#1b293a]'
  const priceFields = [['budgetMin', c.min], ['budgetMax', c.max]] as const
  const detailFields = [['minArea', c.area], ['minBuiltYear', c.year], ['maxWalkMinutes', c.walk], ['minGrossYield', c.yield]] as const
  return <fieldset disabled={disabled} className="min-w-0 space-y-6" data-testid="buyer-criteria-fields">
    <legend className="text-lg font-semibold">{ui.basics}</legend>
    <p className="text-sm text-[#657487]">{ui.basicsNote}</p>
    <div className="grid gap-5 sm:grid-cols-2">
      <label><span className="mb-2 block text-sm font-semibold">{journey.purpose}</span><select className={inputClass} value={criteria.purpose} onChange={e => onChange('purpose', e.target.value as BuyerCriteria['purpose'])}>{['investment', 'residential', 'land'].map((v, i) => <option key={v} value={v}>{journey.purposeOptions[i]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-semibold">{journey.timing}</span><select className={inputClass} value={criteria.timing} onChange={e => onChange('timing', e.target.value as BuyerCriteria['timing'])}>{['soon', 'this_year', 'later', 'undecided'].map((v, i) => <option key={v} value={v}>{i < 3 ? journey.timingOptions[i] : journey.select}</option>)}</select></label>
      {priceFields.map(([key, label]) => <label key={key}><span className="mb-2 block text-sm font-semibold">{label}</span><input className={inputClass} type="number" step={1} value={criteria[key] === null ? '' : criteria[key]! / 10000} placeholder={c.any} min={0} max={1000000} onChange={e => onChange(key, e.target.value === '' ? null : Number(e.target.value) * 10000)} /></label>)}
    </div>
    <fieldset className="min-w-0"><legend className="mb-3 text-sm font-semibold">{c.wards}</legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">{wards.map(w => <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-[#274d7d] has-checked:bg-[#edf3fa]" key={w}><input type="checkbox" checked={criteria.wards.includes(w)} disabled={!criteria.wards.includes(w) && criteria.wards.length >= 6} onChange={e => onChange('wards', e.target.checked ? [...criteria.wards, w] : criteria.wards.filter(x => x !== w))} />{translateCityName(w, locale) || w}</label>)}</div></fieldset>
    <fieldset className="min-w-0"><legend className="mb-3 text-sm font-semibold">{journey.type}</legend><div className="flex flex-wrap gap-2">{types.map((t, i) => <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-[#274d7d] has-checked:bg-[#edf3fa]" key={t}><input type="checkbox" checked={criteria.propertyTypes.includes(t)} onChange={e => onChange('propertyTypes', e.target.checked ? [...criteria.propertyTypes, t] : criteria.propertyTypes.filter(x => x !== t))} />{journey.typeOptions[i]}</label>)}</div></fieldset>
    <details className="rounded-lg border bg-[#f8fafc] p-4" data-testid="buyer-advanced-criteria">
      <summary className="cursor-pointer text-sm font-semibold">{ui.advanced}</summary>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {detailFields.map(([key, label]) => <label key={key}><span className="mb-2 block text-sm font-semibold">{label}</span><input className={inputClass} type="number" step={key === 'minArea' || key === 'minGrossYield' ? 'any' : 1} value={criteria[key] === null ? '' : criteria[key]!} placeholder={c.any} min={key === 'minBuiltYear' ? 1900 : key === 'maxWalkMinutes' ? 1 : 0} max={key === 'minBuiltYear' ? 2100 : key === 'maxWalkMinutes' ? 120 : key === 'minGrossYield' ? 100 : 100000} onChange={e => onChange(key, e.target.value === '' ? null : Number(e.target.value))} /></label>)}
        <label><span className="mb-2 block text-sm font-semibold">{c.financing}</span><select className={inputClass} value={criteria.financing} onChange={e => onChange('financing', e.target.value as BuyerCriteria['financing'])}>{['cash', 'loan', 'mixed', 'undecided'].map((v, i) => <option key={v} value={v}>{c.finance[i]}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-semibold">{c.occupancy}</span><select className={inputClass} value={criteria.occupancy} onChange={e => onChange('occupancy', e.target.value as BuyerCriteria['occupancy'])}>{['any', 'vacant', 'tenanted'].map((v, i) => <option key={v} value={v}>{c.occupancies[i]}</option>)}</select></label>
        <label><span className="mb-2 block text-sm font-semibold">{journey.priority}</span><select className={inputClass} value={criteria.priority} onChange={e => onChange('priority', e.target.value as BuyerCriteria['priority'])}>{['location', 'space', 'price', 'commute'].map((v, i) => <option key={v} value={v}>{journey.priorityOptions[i]}</option>)}</select></label>
      </div>
    </details>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={criteria.active} onChange={e => onChange('active', e.target.checked)} />{c.active}</label>
    <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={criteria.learnFromRatings} onChange={e => onChange('learnFromRatings', e.target.checked)} />{c.learn}</label>
  </fieldset>
}
