'use client'

import Link from 'next/link'
import { useId, useState } from 'react'
import { useLocale } from 'next-intl'
import { ArrowRight, SlidersHorizontal, Wallet } from 'lucide-react'
import { formatPrice } from '@/lib/format'
import { estimateLoan } from '@/lib/loan'
import { estimateInitialCosts } from '@/lib/purchase-costs'
import { formatYenWords } from '@/lib/yen-words'
import { getSimulatorCopy } from '@/lib/simulator-copy'
import { SIMULATOR_PRICE, browseQuery, cashMonthlyFlow, clampPrice, grossYieldPercent, type SimulatorStart } from '@/lib/simulator'
import { InitialCostSimulator } from '@/components/listing/initial-cost-simulator'
import { LoanSimulator } from '@/components/listing/loan-simulator'

const PRICE_CHIPS = [30_000_000, 50_000_000, 80_000_000, 100_000_000, 200_000_000, 300_000_000]
const FEE_CHIPS = [0, 10_000, 20_000, 30_000, 50_000]
const RENT_CHIPS = [0, 100_000, 200_000, 300_000, 500_000]

function exactYen(value: number, locale: string): string {
  const number = Math.round(value).toLocaleString(locale === 'en' ? 'en-US' : 'ja-JP')
  if (locale === 'en') return `¥${number}`
  return `${number}${locale === 'ja' ? '円' : locale === 'zh-TW' ? '日圓' : '日元'}`
}

interface ChipsProps<T> {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  format: (value: T) => string
}

function Chips<T>({ label, options, value, onChange, format }: ChipsProps<T>) {
  return <div role="group" aria-label={label} className="mt-2 flex flex-wrap gap-1.5">
    {options.map((option) => <button key={String(option)} type="button" aria-pressed={option === value} onClick={() => onChange(option)}
      className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${option === value ? 'border-[#274d7d] bg-[#274d7d] text-white' : 'border-[#cfd9e3] bg-white text-[#1b293a] hover:bg-[#f3f6f9]'}`}>{format(option)}</button>)}
  </div>
}

interface SliderProps {
  id: string
  label: string
  display: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

function Slider({ id, label, display, value, min, max, step, onChange }: SliderProps) {
  return <div>
    <div className="flex items-baseline justify-between gap-2 text-sm"><label htmlFor={id} className="text-[#536274]">{label}</label><span className="font-semibold tabular-nums">{display}</span></div>
    <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-1 w-full accent-[#274d7d]" />
  </div>
}

/** Every purchase figure from one set of conditions: cash needed, initial costs, monthly payment, rent and yield. */
export function PurchaseSimulator({ start }: { start?: SimulatorStart }) {
  const locale = useLocale()
  const text = getSimulatorCopy(locale)
  const id = useId()
  const [price, setPrice] = useState<number>(start?.price ?? SIMULATOR_PRICE.default)
  const [useLoan, setUseLoan] = useState(true)
  const [downPaymentRate, setDownPaymentRate] = useState(0.2)
  const [annualRatePercent, setAnnualRatePercent] = useState(1)
  const [years, setYears] = useState(35)
  const [fees, setFees] = useState(start?.fees ?? 20_000)
  const [rent, setRent] = useState(start?.rent ?? 0)
  const yieldPercent = grossYieldPercent(price, rent)
  const cashFlow = cashMonthlyFlow(rent, fees)
  const toggle = (active: boolean) => `min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold transition ${active ? 'bg-[#274d7d] text-white' : 'text-[#536274] hover:bg-white'}`
  const query = browseQuery(price)
  // Phones show the conditions first, so the key results stay in a bar at the bottom of the screen.
  const costs = estimateInitialCosts({ price, downPaymentRate, useLoan })
  const monthly = estimateLoan({ price, downPaymentRate, annualRatePercent, years }).monthlyPayment
  // English uses the short ¥13.44M form so both figures fit the bar on a phone.
  const man = (value: number) => (locale === 'en' ? formatPrice : formatYenWords)(Math.round(value / 10_000) * 10_000, locale)
  const cashNeeded = `${man(costs.cashNeeded.low)}${locale === 'en' ? ' – ' : '〜'}${man(costs.cashNeeded.high)}`

  return <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start" data-testid="purchase-simulator">
    <section className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4 md:p-5 lg:sticky lg:top-44" aria-labelledby={`${id}-conditions`}>
      <h2 id={`${id}-conditions`} className="flex items-center gap-2 text-lg font-semibold"><SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{text.conditions}</h2>
      <div className="mt-4 space-y-5">
        <div>
          <label htmlFor={`${id}-price`} className="text-sm text-[#536274]">{text.price}</label>
          <div className="mt-1 flex items-center gap-2">
            <input id={`${id}-price`} type="number" inputMode="numeric" min={0} step={text.priceUnitValue === 10_000 ? 100 : 1} value={price / text.priceUnitValue}
              onChange={(event) => setPrice(clampPrice(Number(event.target.value) * text.priceUnitValue))}
              className="h-11 w-full rounded-lg border border-[#dbe2e9] bg-white px-3 text-right text-lg font-semibold tabular-nums focus:border-[#274d7d] focus:outline-none focus:ring-2 focus:ring-[#274d7d]/15" />
            <span className="shrink-0 text-sm text-[#536274]">{text.priceUnit}</span>
          </div>
          <input aria-label={text.price} type="range" min={SIMULATOR_PRICE.min} max={SIMULATOR_PRICE.max} step={SIMULATOR_PRICE.step} value={Math.min(Math.max(price, SIMULATOR_PRICE.min), SIMULATOR_PRICE.max)} onChange={(event) => setPrice(Number(event.target.value))} className="mt-2 w-full accent-[#274d7d]" />
          <Chips label={text.price} options={PRICE_CHIPS} value={price} onChange={setPrice} format={(value) => formatPrice(value, locale)} />
        </div>

        <div>
          <p id={`${id}-payment`} className="text-sm text-[#536274]">{text.payment}</p>
          <div role="radiogroup" aria-labelledby={`${id}-payment`} className="mt-1 flex gap-1 rounded-xl bg-[#eef2f6] p-1">
            <button type="button" role="radio" aria-checked={useLoan} className={toggle(useLoan)} onClick={() => setUseLoan(true)}>{text.loan}</button>
            <button type="button" role="radio" aria-checked={!useLoan} className={toggle(!useLoan)} onClick={() => setUseLoan(false)}>{text.cash}</button>
          </div>
        </div>

        {useLoan && <div className="space-y-4">
          <Slider id={`${id}-down`} label={text.down} display={`${Math.round(downPaymentRate * 100)}%`} value={downPaymentRate * 100} min={0} max={100} step={5} onChange={(value) => setDownPaymentRate(value / 100)} />
          <Slider id={`${id}-rate`} label={text.rate} display={`${annualRatePercent.toFixed(2)}%`} value={annualRatePercent} min={0.3} max={5} step={0.05} onChange={setAnnualRatePercent} />
          <Slider id={`${id}-years`} label={text.years} display={`${years}${locale === 'en' ? ' ' : ''}${text.yearsUnit}`} value={years} min={5} max={35} step={1} onChange={setYears} />
        </div>}

        <div>
          <Slider id={`${id}-fees`} label={text.fees} display={exactYen(fees, locale)} value={fees} min={0} max={100_000} step={1_000} onChange={setFees} />
          <Chips label={text.fees} options={FEE_CHIPS} value={fees} onChange={setFees} format={(value) => exactYen(value, locale)} />
          <p className="mt-1.5 text-xs leading-5 text-[#657487]">{text.feesNote}</p>
        </div>

        <div>
          <Slider id={`${id}-rent`} label={text.rent} display={rent ? exactYen(rent, locale) : text.rentNone} value={rent} min={0} max={1_000_000} step={5_000} onChange={setRent} />
          <Chips label={text.rent} options={RENT_CHIPS} value={rent} onChange={setRent} format={(value) => (value ? exactYen(value, locale) : text.rentNone)} />
          <p className="mt-1.5 text-xs leading-5 text-[#657487]">{text.rentNote}</p>
          {yieldPercent !== null && <p className="mt-2 flex justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-[#e3e9ef]" data-testid="simulator-yield"><span className="text-[#536274]">{text.grossYield}</span><span className="font-semibold tabular-nums text-[#3f5f39]">{yieldPercent.toFixed(2)}%</span></p>}
        </div>

        {query && <Link href={`/listings?${query}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#274d7d] px-4 text-sm font-semibold text-white hover:bg-[#18375f]">{text.browse}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>}
      </div>
    </section>

    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2 border-t border-[#dbe2e9] bg-white/95 px-4 py-2 shadow-[0_-4px_16px_rgba(27,41,58,0.08)] backdrop-blur lg:hidden" data-testid="simulator-bar" aria-live="polite">
      <p className="min-w-0"><span className="block text-[11px] font-semibold text-[#4a6789]">{text.barCash}</span><span className="block truncate text-sm font-bold tabular-nums text-[#1b293a]">{cashNeeded}</span></p>
      {useLoan
        ? <p className="min-w-0"><span className="block text-[11px] font-semibold text-[#4a6789]">{text.barMonthly}</span><span className="block truncate text-sm font-bold tabular-nums text-[#1b293a]">{exactYen(monthly, locale)}</span></p>
        : <p className="min-w-0"><span className="block text-[11px] font-semibold text-[#4a6789]">{text.barFlow}</span><span className={`block truncate text-sm font-bold tabular-nums ${cashFlow === null ? 'text-[#1b293a]' : cashFlow >= 0 ? 'text-[#3f5f39]' : 'text-[#b42318]'}`}>{cashFlow === null ? `−${exactYen(fees, locale)}` : `${cashFlow >= 0 ? '+' : '−'}${exactYen(Math.abs(cashFlow), locale)}`}</span></p>}
    </div>

    <div aria-label={text.results} className="min-w-0">
      <InitialCostSimulator price={price} conditions={{ useLoan, downPaymentRate }} showGuideLink={false} />
      {useLoan
        ? <LoanSimulator price={price} monthlyFees={fees} monthlyRent={rent || null} conditions={{ downPaymentRate, annualRatePercent, years }} />
        : <section className="mt-6 rounded-xl border border-[#dbe2e9] bg-white p-4 md:p-6" aria-labelledby={`${id}-cash`} data-testid="simulator-cash">
          <h2 id={`${id}-cash`} className="flex items-center gap-2 text-lg font-semibold"><Wallet aria-hidden="true" className="h-5 w-5 text-primary" />{text.cashTitle}</h2>
          <dl className="mt-4 space-y-2 rounded-lg bg-[#f4f7fb] p-4 text-sm">
            <div className="flex justify-between gap-2"><dt className="text-[#536274]">{text.cashFees}</dt><dd className="font-semibold tabular-nums">{exactYen(fees, locale)}</dd></div>
            {rent > 0 && <div className="flex justify-between gap-2"><dt className="text-[#536274]">{text.cashRent}</dt><dd className="font-semibold tabular-nums text-[#3f5f39]">{exactYen(rent, locale)}</dd></div>}
            {cashFlow !== null && <div className="flex justify-between gap-2 border-t border-[#dbe2e9] pt-2"><dt className="text-[#536274]">{text.cashFlow}</dt><dd className={`font-semibold tabular-nums ${cashFlow >= 0 ? 'text-[#3f5f39]' : 'text-[#b42318]'}`}>{cashFlow >= 0 ? '+' : '−'}{exactYen(Math.abs(cashFlow), locale)}</dd></div>}
          </dl>
          <p className="mt-3 text-xs leading-5 text-[#536274]">{text.cashNote}</p>
        </section>}
    </div>
  </div>
}
