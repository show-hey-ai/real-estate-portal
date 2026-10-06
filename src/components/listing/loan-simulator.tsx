'use client'

import { useId, useState } from 'react'
import { useLocale } from 'next-intl'
import { Calculator } from 'lucide-react'
import { estimateLoan } from '@/lib/loan'
import { formatYenWords } from '@/lib/yen-words'

const copy = {
  ja: { fees: '管理費・修繕積立金', totalOut: '毎月の支払い合計', rent: '賃料収入（現在の賃料）', cashflow: '月々の収支（賃料−返済−管理費等）', title: '月々の返済シミュレーション（ローンを使う場合）', down: '頭金', rate: '金利（年）', years: '返済期間', yearsUnit: '年', monthly: '月々の返済額', loan: '借入額', interest: '利息の合計', price: '物件価格', note: '元利均等返済の概算です。返済額に諸費用・税金・管理費は含みません（管理費等と賃料は物件情報の金額を別に表示）。月々の収支は固定資産税・賃貸管理費・空室を考慮していません。融資の可否や金利は金融機関の審査で決まります。外国籍の方も、日本の在留資格（ビザ）がある場合や日本法人で借りる場合は利用できることがあります。' },
  en: { fees: 'Management and repair fees', totalOut: 'Total monthly outgoings', rent: 'Rental income (current rent)', cashflow: 'Monthly cash flow (rent − loan − fees)', title: 'Monthly payment estimate (with a mortgage)', down: 'Down payment', rate: 'Interest rate (annual)', years: 'Loan term', yearsUnit: 'years', monthly: 'Monthly payment', loan: 'Loan amount', interest: 'Total interest', price: 'Price', note: 'Level-payment estimate; the repayment excludes fees, taxes and management costs (management fees and rent from the listing are shown separately). Cash flow ignores property tax, letting fees and vacancies. Lenders decide eligibility and rates. Foreign nationals can often borrow if they hold Japanese residence status or buy through a Japanese company.' },
  'zh-TW': { fees: '管理費・修繕公積金', totalOut: '每月支出合計', rent: '租金收入（目前租金）', cashflow: '每月收支（租金−還款−管理費等）', title: '每月還款試算（使用房貸時）', down: '頭期款', rate: '年利率', years: '還款期間', yearsUnit: '年', monthly: '每月還款', loan: '貸款金額', interest: '利息合計', price: '物件價格', note: '本息平均攤還的概算；還款額不含各項費用、稅金與管理費（管理費等與租金依物件資訊另行顯示）。每月收支未考慮固定資產稅、租賃管理費與空置。是否核貸及利率由金融機構審查決定。外國籍人士若持有日本在留資格（簽證）或以日本法人借款，也有機會申請。' },
  'zh-CN': { fees: '管理费・修缮基金', totalOut: '每月支出合计', rent: '租金收入（当前租金）', cashflow: '每月收支（租金−还款−管理费等）', title: '月供试算（使用房贷时）', down: '首付', rate: '年利率', years: '还款期限', yearsUnit: '年', monthly: '每月还款', loan: '贷款金额', interest: '利息合计', price: '房产价格', note: '等额本息的概算；还款额不含各项费用、税金与管理费（管理费等与租金按房源信息另行显示）。每月收支未考虑固定资产税、租赁管理费与空置。能否获批及利率由金融机构审核决定。外国籍人士若持有日本在留资格（签证）或以日本法人借款，也有机会申请。' },
} as const

const DEFAULTS = { downPaymentRate: 0.2, annualRatePercent: 1, years: 35 }

interface LoanSimulatorProps {
  price: number
  /** Monthly management fee and repair reserve, when stated. */
  monthlyFees?: number | null
  /** Current monthly rent for a let unit, when stated. */
  monthlyRent?: number | null
}

export function LoanSimulator({ price, monthlyFees = null, monthlyRent = null }: LoanSimulatorProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const id = useId()
  const [downPaymentRate, setDownPaymentRate] = useState(DEFAULTS.downPaymentRate)
  const [annualRatePercent, setAnnualRatePercent] = useState(DEFAULTS.annualRatePercent)
  const [years, setYears] = useState(DEFAULTS.years)
  const result = estimateLoan({ price, downPaymentRate, annualRatePercent, years })
  const yen = (value: number) => formatYenWords(Math.round(value / 10_000) * 10_000, locale)
  const total = result.downPayment + result.principal + result.totalInterest
  const exact = (value: number) => `${locale === 'en' ? '¥' : ''}${Math.round(value).toLocaleString(locale === 'en' ? 'en-US' : 'ja-JP')}${locale === 'en' ? '' : locale === 'ja' ? '円' : locale === 'zh-TW' ? '日圓' : '日元'}`
  const cashflow = (monthlyRent ?? 0) - result.monthlyPayment - (monthlyFees ?? 0)
  const segments = [
    { label: text.down, value: result.downPayment, tone: 'bg-[#8fb0d6]' },
    { label: text.loan, value: result.principal, tone: 'bg-[#274d7d]' },
    { label: text.interest, value: result.totalInterest, tone: 'bg-[#e0a34a]' },
  ]
  const sliders = [
    { key: 'down', label: text.down, value: downPaymentRate * 100, min: 0, max: 100, step: 5, display: locale === 'en' ? `${Math.round(downPaymentRate * 100)}% (${yen(result.downPayment)})` : `${Math.round(downPaymentRate * 100)}%（${yen(result.downPayment)}）`, onChange: (value: number) => setDownPaymentRate(value / 100) },
    { key: 'rate', label: text.rate, value: annualRatePercent, min: 0.3, max: 5, step: 0.05, display: `${annualRatePercent.toFixed(2)}%`, onChange: setAnnualRatePercent },
    { key: 'years', label: text.years, value: years, min: 5, max: 35, step: 1, display: `${years}${locale === 'en' ? ' ' : ''}${text.yearsUnit}`, onChange: setYears },
  ]
  return <section className="mt-6 rounded-xl border border-[#dbe2e9] bg-white p-4 md:p-6" aria-labelledby={`${id}-title`} data-testid="loan-simulator">
    <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-semibold"><Calculator aria-hidden="true" className="h-5 w-5 text-primary" />{text.title}</h2>
    <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        {sliders.map((slider) => <div key={slider.key}>
          <div className="flex items-baseline justify-between gap-2 text-sm"><label htmlFor={`${id}-${slider.key}`} className="text-[#536274]">{slider.label}</label><span className="font-semibold tabular-nums">{slider.display}</span></div>
          <input id={`${id}-${slider.key}`} type="range" min={slider.min} max={slider.max} step={slider.step} value={slider.value} onChange={(event) => slider.onChange(Number(event.target.value))} className="mt-1 w-full accent-[#274d7d]" />
        </div>)}
      </div>
      <div className="rounded-lg bg-[#f4f7fb] p-4">
        <p className="text-xs font-semibold text-[#4a6789]">{text.monthly}</p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-[#1b293a]" aria-live="polite">{result.monthlyPayment ? exact(result.monthlyPayment) : '—'}</p>
        {(monthlyFees || monthlyRent) && <dl className="mt-3 space-y-1.5 border-b border-[#dbe2e9] pb-3 text-sm">
          {monthlyFees ? <>
            <div className="flex justify-between gap-2"><dt className="text-[#536274]">{text.fees}</dt><dd className="shrink-0 whitespace-nowrap font-semibold tabular-nums">{exact(monthlyFees)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#536274]">{text.totalOut}</dt><dd className="shrink-0 whitespace-nowrap font-semibold tabular-nums">{exact(result.monthlyPayment + monthlyFees)}</dd></div>
          </> : null}
          {monthlyRent ? <>
            <div className="flex justify-between gap-2"><dt className="text-[#536274]">{text.rent}</dt><dd className="shrink-0 whitespace-nowrap font-semibold tabular-nums text-[#3f5f39]">{exact(monthlyRent)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#536274]">{text.cashflow}</dt><dd className={`shrink-0 whitespace-nowrap font-semibold tabular-nums ${cashflow >= 0 ? 'text-[#3f5f39]' : 'text-[#b42318]'}`}>{cashflow >= 0 ? '+' : '−'}{exact(Math.abs(cashflow))}</dd></div>
          </> : null}
        </dl>}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true">
          {segments.map((segment) => <div key={segment.label} className={segment.tone} style={{ width: `${total ? (segment.value / total) * 100 : 0}%` }} />)}
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          {segments.map((segment) => <div key={segment.label} className="flex items-center justify-between gap-2"><dt className="flex items-center gap-2 text-[#536274]"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm ${segment.tone}`} />{segment.label}</dt><dd className="font-semibold tabular-nums">{yen(segment.value)}</dd></div>)}
        </dl>
      </div>
    </div>
    <p className="mt-4 text-xs leading-5 text-[#536274]">{text.note}</p>
  </section>
}
