/**
 * Rough acquisition-cost estimate shown on listing pages.
 * Brokerage is the statutory maximum and stamp duty follows the National Tax Agency table;
 * everything that depends on assessed values or the buyer's loan is a percentage range.
 */

const CONSUMPTION_TAX = 0.1
/** Reduced stamp duty for real-estate sale contracts applies to contracts signed up to this day (JST). */
export const STAMP_RELIEF_UNTIL = '2027-03-31'
/** Other costs (registration and acquisition tax, scrivener, insurance, loan fees) as a share of price. */
export const OTHER_COST_RATE = { low: 0.03, high: 0.05 } as const
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

export interface PurchaseCosts {
  brokerage: number
  stamp: number
  otherLow: number
  otherHigh: number
  totalLow: number
  totalHigh: number
  lowPriceRule: boolean
}

export function estimatePurchaseCosts(price: number, on: Date = new Date()): PurchaseCosts {
  const brokerage = brokerageFeeMax(price)
  const stamp = stampDuty(price, on)
  const otherLow = Math.round(price * OTHER_COST_RATE.low)
  const otherHigh = Math.round(price * OTHER_COST_RATE.high)
  return {
    brokerage,
    stamp,
    otherLow,
    otherHigh,
    totalLow: brokerage + stamp + otherLow,
    totalHigh: brokerage + stamp + otherHigh,
    lowPriceRule: price > 0 && price <= LOW_PRICE_RULE_LIMIT,
  }
}
