/**
 * Monthly figures stated in the Japanese description (rent, management fee, repair reserve).
 * Listings rarely carry these as structured fields, so they are read from sentences such as
 * 「賃料は月額108,000円」「管理費は月額11,280円」「管理費13,000円・修繕積立金16,000円／月」.
 */

export interface MonthlyFigures {
  rent: number | null
  managementFee: number | null
  repairReserve: number | null
  /** Management fee and repair reserve together, stated or summed. */
  fees: number | null
}

const AMOUNT = '([0-9][0-9,]*)円'
const MAX_MONTHLY_FEE = 500_000
const MAX_MONTHLY_RENT = 50_000_000

const toYen = (raw: string | undefined) => (raw ? Number(raw.replace(/,/g, '')) : NaN)

function first(text: string, patterns: RegExp[], max: number): number | null {
  for (const pattern of patterns) {
    const value = toYen(text.match(pattern)?.[1])
    if (Number.isFinite(value) && value > 0 && value <= max) return value
  }
  return null
}

export function parseMonthlyFigures(descriptionJa: string | null | undefined): MonthlyFigures {
  const text = (descriptionJa || '').replace(/\s+/g, '')
  const combined = first(text, [
    new RegExp(`管理費(?:等|・修繕積立金)の合計は?(?:月額)?${AMOUNT}`),
  ], MAX_MONTHLY_FEE)
  const managementFee = combined ? null : first(text, [
    new RegExp(`管理費(?!等|・修繕|を含)は?(?:月額)?${AMOUNT}`),
  ], MAX_MONTHLY_FEE)
  const repairReserve = combined ? null : first(text, [
    new RegExp(`修繕積立金は?(?:月額)?${AMOUNT}`),
  ], MAX_MONTHLY_FEE)
  const rent = first(text, [
    new RegExp(`(?:月額)?(?:賃料|家賃)(?:・共益費)?は?(?:管理費を含め)?(?:月額)?${AMOUNT}`),
  ], MAX_MONTHLY_RENT)
  const fees = combined ?? (managementFee !== null || repairReserve !== null ? (managementFee ?? 0) + (repairReserve ?? 0) : null)
  return { rent, managementFee, repairReserve, fees }
}

/** Gross yield in percent from the stated monthly rent, or null when the inputs are missing. */
export function grossYieldFromRent(monthlyRent: number | null, price: number | null): number | null {
  if (!monthlyRent || !price || price <= 0) return null
  return Math.round(((monthlyRent * 12) / price) * 1000) / 10
}
