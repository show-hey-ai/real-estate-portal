/**
 * Initial-cost estimate for the cost simulator on listing pages and the buying guide.
 * Brokerage is the statutory maximum and stamp duty follows the National Tax Agency table;
 * costs that depend on assessed values are a percentage range, and loan costs a typical fee rate.
 */

const CONSUMPTION_TAX = 0.1
/** Reduced stamp duty for real-estate sale contracts applies to contracts signed up to this day (JST). */
export const STAMP_RELIEF_UNTIL = '2027-03-31'
/**
 * Costs that depend on assessed values or the buyer's choices, as rules of thumb. Rates apply to the
 * price unless `base` says otherwise; fixed amounts are in yen. Together they come to about 2–3% of the price.
 */
export const OTHER_COSTS = [
  { key: 'registrationTransfer', base: 'price', low: 0.005, high: 0.008 },
  { key: 'registrationMortgage', base: 'loan', low: 0.001, high: 0.004 },
  { key: 'scrivener', base: 'fixed', low: 100_000, high: 200_000 },
  { key: 'acquisitionTax', base: 'price', low: 0.005, high: 0.01 },
  { key: 'settlement', base: 'price', low: 0.002, high: 0.003 },
  { key: 'insurance', base: 'price', low: 0.0015, high: 0.003 },
] as const
export type OtherCostKey = (typeof OTHER_COSTS)[number]['key'] | 'loanStamp'
/** Typical lender administration fee as a share of the loan (banks that charge a fee instead of a guarantee). */
export const LOAN_FEE_RATE = 0.022
/** Deposit paid at the contract, as a share of price. */
export const DEPOSIT_RATE = 0.05
/** Up to this price a special rule can allow a higher brokerage fee for low-priced vacant property. */
export const LOW_PRICE_RULE_LIMIT = 8_000_000

// [upper bound inclusive, reduced duty, standard duty]
const STAMP_TABLE: [number, number, number][] = [
  [500_000, 200, 400],
  [1_000_000, 500, 1_000],
  [5_000_000, 1_000, 2_000],
  [10_000_000, 5_000, 10_000],
  [50_000_000, 10_000, 20_000],
  [100_000_000, 30_000, 60_000],
  [500_000_000, 60_000, 100_000],
  [1_000_000_000, 160_000, 200_000],
  [5_000_000_000, 320_000, 400_000],
  [Infinity, 480_000, 600_000],
]

export function brokerageFeeMax(price: number): number {
  if (!(price > 0)) return 0
  const base = price <= 2_000_000 ? price * 0.05
    : price <= 4_000_000 ? price * 0.04 + 20_000
    : price * 0.03 + 60_000
  return Math.floor(base * (1 + CONSUMPTION_TAX))
}

export function stampDuty(price: number, on: Date = new Date()): number {
  if (!(price > 10_000)) return 0
  const reduced = on.getTime() <= Date.parse(`${STAMP_RELIEF_UNTIL}T23:59:59+09:00`)
  const row = STAMP_TABLE.find(([limit]) => price <= limit)!
  return reduced ? row[1] : row[2]
}

// Loan agreements (第1号の3文書) have no reduced rate. [upper bound inclusive, duty]
const LOAN_STAMP_TABLE: [number, number][] = [
  [100_000, 200], [500_000, 400], [1_000_000, 1_000], [5_000_000, 2_000], [10_000_000, 10_000],
  [50_000_000, 20_000], [100_000_000, 60_000], [500_000_000, 100_000], [1_000_000_000, 200_000],
  [5_000_000_000, 400_000], [Infinity, 600_000],
]

export function loanStampDuty(amount: number): number {
  if (!(amount >= 10_000)) return 0
  return LOAN_STAMP_TABLE.find(([limit]) => amount <= limit)![1]
}

export interface InitialCostInput {
  price: number
  /** Share of the price paid from own funds when borrowing; ignored for cash purchases. */
  downPaymentRate: number
  useLoan: boolean
  on?: Date
}

export interface Range {
  low: number
  high: number
}

export interface InitialCosts {
  /** Own funds toward the price: the down payment with a loan, the whole price in cash. */
  ownFunds: number
  loanAmount: number
  brokerage: number
  stamp: number
  /** Itemised other costs; loan-only items are left out for cash purchases. */
  otherItems: { key: OtherCostKey; range: Range }[]
  other: Range
  loanFee: number
  fees: Range
  /** Total own cash needed: own funds plus fees. */
  cashNeeded: Range
  /** Deposit, stamp duty and half the brokerage, paid at the contract. */
  atContract: number
  /** The rest of the own cash, paid at settlement (the loan covers the remainder of the price). */
  atSettlement: Range
  lowPriceRule: boolean
}

const clampRate = (rate: number) => Math.min(Math.max(rate, 0), 1)

function otherCostItems(price: number, loanAmount: number): { key: OtherCostKey; range: Range }[] {
  if (price <= 0) return []
  const items = OTHER_COSTS
    .filter((item) => item.base !== 'loan' || loanAmount > 0)
    .map((item) => {
      const base = item.base === 'fixed' ? 1 : item.base === 'loan' ? loanAmount : price
      return { key: item.key as OtherCostKey, range: { low: Math.round(base * item.low), high: Math.round(base * item.high) } }
    })
  const stamp = loanStampDuty(loanAmount)
  return stamp ? [...items, { key: 'loanStamp', range: { low: stamp, high: stamp } }] : items
}

export function estimateInitialCosts({ price, downPaymentRate, useLoan, on = new Date() }: InitialCostInput): InitialCosts {
  const safePrice = price > 0 ? price : 0
  const ownFunds = useLoan ? Math.round(safePrice * clampRate(downPaymentRate)) : safePrice
  const loanAmount = safePrice - ownFunds
  const brokerage = brokerageFeeMax(safePrice)
  const stamp = stampDuty(safePrice, on)
  const otherItems = otherCostItems(safePrice, loanAmount)
  const other = otherItems.reduce((sum, item) => ({ low: sum.low + item.range.low, high: sum.high + item.range.high }), { low: 0, high: 0 })
  const loanFee = Math.round(loanAmount * LOAN_FEE_RATE)
  const fixedFees = brokerage + stamp + loanFee
  const fees = { low: fixedFees + other.low, high: fixedFees + other.high }
  const cashNeeded = { low: ownFunds + fees.low, high: ownFunds + fees.high }
  const deposit = Math.min(Math.round(safePrice * DEPOSIT_RATE), ownFunds)
  const atContract = deposit + stamp + Math.floor(brokerage / 2)
  return {
    ownFunds,
    loanAmount,
    brokerage,
    stamp,
    otherItems,
    other,
    loanFee,
    fees,
    cashNeeded,
    atContract,
    atSettlement: { low: cashNeeded.low - atContract, high: cashNeeded.high - atContract },
    lowPriceRule: safePrice > 0 && safePrice <= LOW_PRICE_RULE_LIMIT,
  }
}
