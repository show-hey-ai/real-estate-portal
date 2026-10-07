'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Receipt } from 'lucide-react'
import { DEPOSIT_RATE, LOAN_FEE_RATE, estimateInitialCosts, type OtherCostKey, type Range } from '@/lib/purchase-costs'
import { formatYenWords } from '@/lib/yen-words'
import { useFxRates } from '@/components/fx/fx-rates-context'
import { approxBandLabel, formatApproxPrice } from '@/lib/fx'

const pct = (rate: number) => `${Math.round(rate * 1000) / 10}%`

const copy = {
  ja: {
    title: '初期費用シミュレーター', price: '物件価格', priceUnit: '万円', unitValue: 10_000, payment: '支払い方法', cash: '現金', loan: 'ローン', down: '頭金',
    cashNeeded: '必要な自己資金の目安', ownFunds: (useLoan: boolean) => (useLoan ? '頭金' : '物件価格'), loanAmount: '借入額（ローンで支払う分）',
    brokerage: '仲介手数料（上限・税込）', stamp: '売買契約書の印紙税', loanFee: `ローン事務手数料（借入額の${pct(LOAN_FEE_RATE)}）`, items: { registrationTransfer: '登録免許税（所有権移転）', registrationMortgage: '登録免許税（抵当権設定）', scrivener: '司法書士報酬', acquisitionTax: '不動産取得税（引渡し後に納付）', settlement: '固定資産税・管理費などの日割り精算', insurance: '火災・地震保険', loanStamp: 'ローン契約書の印紙税' },
    timing: '支払いのタイミング', atContract: `売買契約時（手付金${pct(DEPOSIT_RATE)}・印紙・仲介手数料の半額など）`, atSettlement: '決済・引渡し時（残りの自己資金）',
    note: '仲介手数料は法定上限、売買契約書とローン契約書の印紙税は国税庁の税額表（売買契約書の軽減措置は2027年3月31日まで）で計算しています。登録免許税・不動産取得税・精算金・保険は固定資産税評価額や物件によって変わるため、物件価格（抵当権は借入額）に対する一般的な割合で幅をもたせた目安です（合計で物件価格の約2〜3%）。ローン費用は保証料型など金融機関によって方式が異なります。外国籍の方のローンは購入ガイドをご覧ください。',
    lowPrice: '800万円以下の物件は、空き家等の特例で仲介手数料の上限が異なる場合があります。', guide: '費用とローンの詳しい説明',
  },
  en: {
    title: 'Initial cost simulator', price: 'Price', priceUnit: 'million yen', unitValue: 1_000_000, payment: 'Payment', cash: 'Cash', loan: 'Mortgage', down: 'Down payment',
    cashNeeded: 'Cash you need (estimate)', ownFunds: (useLoan: boolean) => (useLoan ? 'Down payment' : 'Price'), loanAmount: 'Loan amount (paid by the lender)',
    brokerage: 'Brokerage fee (maximum, incl. tax)', stamp: 'Stamp duty on the contract', loanFee: `Loan administration fee (${pct(LOAN_FEE_RATE)} of the loan)`, items: { registrationTransfer: 'Registration tax (ownership)', registrationMortgage: 'Registration tax (mortgage)', scrivener: 'Judicial scrivener fee', acquisitionTax: 'Acquisition tax (paid after handover)', settlement: 'Pro-rata property tax and fees', insurance: 'Fire and earthquake insurance', loanStamp: 'Stamp duty on the loan contract' },
    timing: 'When you pay', atContract: `At the contract (deposit ${pct(DEPOSIT_RATE)}, stamp duty, half the brokerage, etc.)`, atSettlement: 'At settlement (the rest of your cash)',
    note: 'Brokerage is the legal maximum; stamp duty on the sale and loan contracts follows the National Tax Agency tables (reduced sale-contract rates until 31 March 2027). Registration and acquisition taxes, settlements and insurance depend on assessed values and the property, so they are ranges based on typical shares of the price (the loan for the mortgage registration), about 2–3% of the price in total. Lenders charge loan costs in different ways, such as a guarantee fee. See the buying guide for mortgages for foreign nationals.',
    lowPrice: 'For properties at ¥8 million or less, a special rule for vacant homes can allow a different brokerage maximum.', guide: 'Costs and mortgages explained',
  },
  'zh-TW': {
    title: '初期費用試算', price: '物件價格', priceUnit: '萬日圓', unitValue: 10_000, payment: '付款方式', cash: '現金', loan: '貸款', down: '頭期款',
    cashNeeded: '所需自有資金（估算）', ownFunds: (useLoan: boolean) => (useLoan ? '頭期款' : '物件價格'), loanAmount: '貸款金額（由貸款支付）',
    brokerage: '仲介費（上限・含稅）', stamp: '買賣契約印花稅', loanFee: `貸款手續費（貸款額的${pct(LOAN_FEE_RATE)}）`, items: { registrationTransfer: '登錄免許稅（所有權移轉）', registrationMortgage: '登錄免許稅（抵押權設定）', scrivener: '代書（司法書士）費用', acquisitionTax: '不動產取得稅（交屋後繳納）', settlement: '固定資產稅・管理費等按日分攤', insurance: '火災・地震保險', loanStamp: '貸款契約印花稅' },
    timing: '付款時間', atContract: `簽約時（訂金${pct(DEPOSIT_RATE)}、印花稅、一半仲介費等）`, atSettlement: '交割・交屋時（其餘自有資金）',
    note: '仲介費為法定上限；買賣契約與貸款契約的印花稅依國稅廳稅額表計算（買賣契約減稅至2027年3月31日）。登錄免許稅、不動產取得稅、分攤款與保險依評定價值及物件而異，以物件價格（抵押權為貸款額）的一般比例估算範圍（合計約物件價格的2〜3%）。貸款費用依金融機構方式不同（如保證費型）。外國籍買家的貸款請參考購屋指南。',
    lowPrice: '800萬日圓以下的物件，可能適用空屋特例，仲介費上限不同。', guide: '費用與貸款詳細說明',
  },
  'zh-CN': {
    title: '初期费用试算', price: '房产价格', priceUnit: '万日元', unitValue: 10_000, payment: '付款方式', cash: '全款', loan: '贷款', down: '首付',
    cashNeeded: '所需自有资金（估算）', ownFunds: (useLoan: boolean) => (useLoan ? '首付' : '房产价格'), loanAmount: '贷款金额（由贷款支付）',
    brokerage: '中介费（上限・含税）', stamp: '买卖合同印花税', loanFee: `贷款手续费（贷款额的${pct(LOAN_FEE_RATE)}）`, items: { registrationTransfer: '登录免许税（所有权转移）', registrationMortgage: '登录免许税（抵押权设定）', scrivener: '司法书士费用', acquisitionTax: '不动产取得税（交房后缴纳）', settlement: '固定资产税・管理费等按日分摊', insurance: '火灾・地震保险', loanStamp: '贷款合同印花税' },
    timing: '付款时间', atContract: `签约时（定金${pct(DEPOSIT_RATE)}、印花税、一半中介费等）`, atSettlement: '交割・交房时（其余自有资金）',
    note: '中介费为法定上限；买卖合同与贷款合同的印花税依国税厅税额表计算（买卖合同减税至2027年3月31日）。登录免许税、不动产取得税、分摊款与保险因评估价值及房产而异，按房价（抵押权为贷款额）的一般比例估算范围（合计约房价的2〜3%）。贷款费用因金融机构方式不同（如保证费型）。外国籍买家的贷款请参考购房指南。',
    lowPrice: '800万日元以下的房产，可能适用空置房特例，中介费上限不同。', guide: '费用与贷款详细说明',
  },
} as const

const DEFAULT_DOWN_PAYMENT_RATE = 0.2
const OTHER_TONES: Record<OtherCostKey, string> = {
  registrationTransfer: 'bg-[#8fb0d6]', registrationMortgage: 'bg-[#b7cde4]', scrivener: 'bg-[#6f9a6a]', acquisitionTax: 'bg-[#9b7fd1]',
  settlement: 'bg-[#c9a227]', insurance: 'bg-[#d98a6c]', loanStamp: 'bg-[#e3c48b]',
}
const MAX_PRICE_YEN = 10_000_000_000

interface InitialCostSimulatorProps {
  /** Listing price; when omitted the visitor types a price (buying guide). */
  price?: number
  defaultPrice?: number
  showGuideLink?: boolean
}

export function InitialCostSimulator({ price, defaultPrice = 50_000_000, showGuideLink = true }: InitialCostSimulatorProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const id = useId()
  const [typedPrice, setTypedPrice] = useState(defaultPrice / text.unitValue)
  const [useLoan, setUseLoan] = useState(true)
  const [downPaymentRate, setDownPaymentRate] = useState(DEFAULT_DOWN_PAYMENT_RATE)
  const effectivePrice = price ?? Math.min(Math.max(typedPrice, 0) * text.unitValue, MAX_PRICE_YEN)
  const costs = estimateInitialCosts({ price: effectivePrice, downPaymentRate, useLoan })
  const rates = useFxRates()
  // Overseas buyers see the cash they need in their own currency too (en: US$, zh-TW: NT$, zh-CN: 人民币).
  const localNeeded = approxBandLabel({ min: costs.cashNeeded.low, max: costs.cashNeeded.high }, locale, rates)
  const localAtContract = formatApproxPrice(costs.atContract, locale, rates)
  const yen = (value: number) => formatYenWords(Math.round(value / 10_000) * 10_000, locale)
  const range = ({ low, high }: Range) => (low === high ? yen(low) : `${yen(low)}${locale === 'en' ? ' – ' : '〜'}${yen(high)}`)
  const segments = [
    { label: text.ownFunds(useLoan), value: costs.ownFunds, display: yen(costs.ownFunds), tone: 'bg-[#274d7d]' },
    { label: text.brokerage, value: costs.brokerage, display: yen(costs.brokerage), tone: 'bg-[#5b86b8]' },
    { label: text.stamp, value: costs.stamp, display: formatYenWords(costs.stamp, locale), tone: 'bg-[#e0a34a]' },
    ...(useLoan ? [{ label: text.loanFee, value: costs.loanFee, display: yen(costs.loanFee), tone: 'bg-[#aa5746]' }] : []),
    ...costs.otherItems.map((item) => ({ label: text.items[item.key as OtherCostKey], value: (item.range.low + item.range.high) / 2, display: range(item.range), tone: OTHER_TONES[item.key] })),
  ]
  const total = segments.reduce((sum, segment) => sum + segment.value, 0)
  const toggle = (active: boolean) => `min-h-11 flex-1 rounded-lg px-4 text-sm font-semibold transition ${active ? 'bg-[#274d7d] text-white' : 'text-[#536274] hover:bg-white'}`

  return <section className="mt-6 rounded-xl border border-[#dbe2e9] bg-white p-4 md:p-6" aria-labelledby={`${id}-title`} data-testid="initial-cost-simulator">
    <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-semibold"><Receipt aria-hidden="true" className="h-5 w-5 text-primary" />{text.title}</h2>
    <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <div className="space-y-5">
        {price === undefined && <div>
          <label htmlFor={`${id}-price`} className="text-sm text-[#536274]">{text.price}</label>
          <div className="mt-1 flex items-center gap-2">
            <input id={`${id}-price`} type="number" inputMode="numeric" min={0} step={text.unitValue === 10_000 ? 100 : 1} value={typedPrice} onChange={(event) => setTypedPrice(Number(event.target.value))} className="h-11 w-full rounded-lg border border-[#dbe2e9] bg-[#f5f7f9] px-3 text-right text-lg font-semibold tabular-nums focus:border-[#274d7d] focus:outline-none focus:ring-2 focus:ring-[#274d7d]/15" />
            <span className="shrink-0 text-sm text-[#536274]">{text.priceUnit}</span>
          </div>
        </div>}
        <div>
          <p id={`${id}-payment`} className="text-sm text-[#536274]">{text.payment}</p>
          <div role="radiogroup" aria-labelledby={`${id}-payment`} className="mt-1 flex gap-1 rounded-xl bg-[#eef2f6] p-1">
            <button type="button" role="radio" aria-checked={useLoan} className={toggle(useLoan)} onClick={() => setUseLoan(true)}>{text.loan}</button>
            <button type="button" role="radio" aria-checked={!useLoan} className={toggle(!useLoan)} onClick={() => setUseLoan(false)}>{text.cash}</button>
          </div>
        </div>
        {useLoan && <div>
          <div className="flex items-baseline justify-between gap-2 text-sm"><label htmlFor={`${id}-down`} className="text-[#536274]">{text.down}</label><span className="font-semibold tabular-nums">{locale === 'en' ? `${Math.round(downPaymentRate * 100)}% (${yen(costs.ownFunds)})` : `${Math.round(downPaymentRate * 100)}%（${yen(costs.ownFunds)}）`}</span></div>
          <input id={`${id}-down`} type="range" min={0} max={100} step={5} value={downPaymentRate * 100} onChange={(event) => setDownPaymentRate(Number(event.target.value) / 100)} className="mt-1 w-full accent-[#274d7d]" />
          <p className="mt-2 flex justify-between gap-2 text-sm"><span className="text-[#536274]">{text.loanAmount}</span><span className="font-semibold tabular-nums">{yen(costs.loanAmount)}</span></p>
        </div>}
      </div>
      <div className="rounded-lg bg-[#f4f7fb] p-4">
        <p className="text-xs font-semibold text-[#4a6789]">{text.cashNeeded}</p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-[#1b293a] md:text-3xl" aria-live="polite">{range(costs.cashNeeded)}</p>
        {localNeeded && <p className="mt-1 text-sm font-semibold tabular-nums text-[#3d4a5a]" data-testid="cost-local-currency">{localNeeded}</p>}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true">
          {segments.map((segment) => <div key={segment.label} className={segment.tone} style={{ width: `${total ? (segment.value / total) * 100 : 0}%` }} />)}
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          {segments.map((segment) => <div key={segment.label} className="flex items-start justify-between gap-3"><dt className="flex items-start gap-2 text-[#536274]"><span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ${segment.tone}`} />{segment.label}</dt><dd className="shrink-0 font-semibold tabular-nums">{segment.display}</dd></div>)}
        </dl>
        <div className="mt-4 border-t border-[#dbe2e9] pt-3">
          <p className="text-xs font-semibold text-[#4a6789]">{text.timing}</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex items-start justify-between gap-3"><dt className="text-[#536274]">{text.atContract}</dt><dd className="shrink-0 text-right font-semibold tabular-nums">{yen(costs.atContract)}{localAtContract && <span className="block text-xs font-normal text-[#536274]">{localAtContract}</span>}</dd></div>
            <div className="flex items-start justify-between gap-3"><dt className="text-[#536274]">{text.atSettlement}</dt><dd className="shrink-0 font-semibold tabular-nums">{range(costs.atSettlement)}</dd></div>
          </dl>
        </div>
      </div>
    </div>
    <p className="mt-4 text-xs leading-5 text-[#536274]">{text.note}{costs.lowPriceRule && ` ${text.lowPrice}`}</p>
    {showGuideLink && <Link href="/buying-guide" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#274d7d] hover:underline">{text.guide} →</Link>}
  </section>
}
