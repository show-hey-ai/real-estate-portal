/**
 * Earthquake-standard hint from the completion year. The 1981 standard applies to buildings whose
 * building permit was granted on or after 1 June 1981, so completion years around then are
 * ambiguous: large buildings take a year or two to build after the permit.
 */

export type SeismicStandard = 'new' | 'check' | 'old'

/** First completion year treated as built under the 1981 standard. */
export const NEW_STANDARD_FROM_YEAR = 1984
/** Completion years in this range may fall either side of the June 1981 permit date. */
export const AMBIGUOUS_FROM_YEAR = 1981

export function seismicStandard(builtYear: number | null | undefined): SeismicStandard | null {
  if (!builtYear || builtYear < 1900) return null
  if (builtYear >= NEW_STANDARD_FROM_YEAR) return 'new'
  if (builtYear >= AMBIGUOUS_FROM_YEAR) return 'check'
  return 'old'
}

/** Net yield in percent: (rent − management and repair fees) × 12 ÷ price, before tax, letting fees and vacancy. */
export function netYieldFromRent(monthlyRent: number | null, monthlyFees: number | null, price: number | null): number | null {
  if (!monthlyRent || !price || price <= 0) return null
  const net = (monthlyRent - (monthlyFees ?? 0)) * 12
  return Math.round((net / price) * 1000) / 10
}
