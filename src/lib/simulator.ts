// Figures for the purchase simulator that the loan and initial-cost calculations do not cover.

export const SIMULATOR_PRICE = { min: 5_000_000, max: 500_000_000, step: 1_000_000, default: 50_000_000, typedMax: 10_000_000_000 } as const

/** Annual rent as a share of the price, in percent to two decimals; null without rent or price. */
export function grossYieldPercent(price: number, monthlyRent: number): number | null {
  if (!(price > 0) || !(monthlyRent > 0)) return null
  return Math.round((monthlyRent * 12 / price) * 10_000) / 100
}

/** Rent minus monthly fees when buying in cash; null when not letting. */
export function cashMonthlyFlow(monthlyRent: number, monthlyFees: number): number | null {
  return monthlyRent > 0 ? monthlyRent - Math.max(monthlyFees, 0) : null
}

/** A typed price in yen, kept within what the calculations handle. */
export function clampPrice(yen: number): number {
  return Number.isFinite(yen) ? Math.min(Math.max(Math.round(yen), 0), SIMULATOR_PRICE.typedMax) : 0
}

/** Listing search around the chosen price (±20%, to the nearest ¥1M), for "see properties at this price". */
export function browseQuery(price: number): string {
  if (!(price > 0)) return ''
  const million = 1_000_000
  const params = new URLSearchParams({ priceMin: String(Math.floor((price * 0.8) / million) * million), priceMax: String(Math.ceil((price * 1.2) / million) * million) })
  return params.toString()
}

export interface SimulatorStart {
  price: number
  fees: number | null
  rent: number | null
}

const wholeYen = (value: string | string[] | undefined, max: number): number | null => {
  const text = Array.isArray(value) ? value[0] : value
  if (!text || !/^\d{1,12}$/.test(text)) return null
  const number = Number(text)
  return number > 0 && number <= max ? number : null
}

/** Starting values from a link such as /simulator?price=98000000&fees=25000&rent=180000; anything odd is ignored. */
export function parseSimulatorStart(params: Record<string, string | string[] | undefined>): SimulatorStart {
  return {
    price: wholeYen(params.price, SIMULATOR_PRICE.typedMax) ?? SIMULATOR_PRICE.default,
    fees: wholeYen(params.fees, 1_000_000),
    rent: wholeYen(params.rent, 10_000_000),
  }
}

/** Link to the simulator starting from a listing's price, monthly fees and current rent. */
export function simulatorHref({ price, fees, rent }: { price: number; fees?: number | null; rent?: number | null }): string {
  const params = new URLSearchParams({ price: String(Math.round(price)) })
  if (fees && fees > 0) params.set('fees', String(Math.round(fees)))
  if (rent && rent > 0) params.set('rent', String(Math.round(rent)))
  return `/simulator?${params.toString()}`
}
