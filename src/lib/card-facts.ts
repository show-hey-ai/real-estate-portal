import { buildingNameOf, extractBuildingNameEn } from '@/lib/building-name'
import { grossYieldFromRent, parseMonthlyFigures } from '@/lib/monthly-costs'

interface CardSource {
  descriptionJa?: string | null
  descriptionEn?: string | null
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

export interface CardFacts {
  /** Building name in Japanese script, for Japanese and Chinese cards. */
  buildingName: string | null
  /** Romanised building name from the English description, for English cards. */
  buildingNameEn: string | null
  grossYield: number | null
}

/**
 * Card props carry only derived facts (building names, gross yield), so the full descriptions
 * are not sent to the browser.
 */
export function withCardFacts<T extends CardSource>(listing: T): Omit<T, 'descriptionJa' | 'descriptionEn'> & CardFacts {
  const { descriptionJa, descriptionEn, ...rest } = listing
  return {
    ...rest,
    buildingName: buildingNameOf({ descriptionJa, addressPublic: (listing as { addressPublic?: string | null }).addressPublic }),
    buildingNameEn: extractBuildingNameEn(descriptionEn),
    grossYield: cardGrossYield(listing),
  }
}
