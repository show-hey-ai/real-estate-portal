import { extractBuildingName } from '@/lib/building-name'
import { grossYieldFromRent, parseMonthlyFigures } from '@/lib/monthly-costs'

interface CardSource {
  descriptionJa?: string | null
  price?: bigint | number | string | null
  yieldGross?: number | string | null
  currentStatus?: string | null
}

/** Gross yield from the stored field, or from the stated rent when the unit is let. */
export function cardGrossYield(listing: CardSource): number | null {
  const stored = Number(listing.yieldGross)
  if (Number.isFinite(stored) && stored > 0) return stored
  if (!listing.currentStatus?.includes('賃貸中')) return null
  return grossYieldFromRent(parseMonthlyFigures(listing.descriptionJa).rent, Number(listing.price) || null)
}

/**
 * Card props carry only derived facts (building name, gross yield), so the full description
 * is not sent to the browser.
 */
export function withCardFacts<T extends CardSource>(listing: T): Omit<T, 'descriptionJa'> & { buildingName: string | null; grossYield: number | null } {
  const { descriptionJa, ...rest } = listing
  return { ...rest, buildingName: extractBuildingName(descriptionJa), grossYield: cardGrossYield(listing) }
}
