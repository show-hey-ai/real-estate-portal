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

const LAYOUT_PATTERN = /(?<![0-9A-Za-z０-９])([1-9]S?(?:LDK|DK|LK|K|R))(?![A-Za-z])/g

/** The floor plan type ("2LDK") named in the description; null when none or several are named. */
export function cardLayout(descriptionJa: string | null | undefined): string | null {
  const found = new Set([...(descriptionJa ?? '').matchAll(LAYOUT_PATTERN)].map((match) => match[1]))
  return found.size === 1 ? [...found][0] : null
}

export interface CardFacts {
  /** Building name in Japanese script, for Japanese and Chinese cards. */
  buildingName: string | null
  /** Romanised building name from the English description, for English cards. */
  buildingNameEn: string | null
  grossYield: number | null
  layout: string | null
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
    layout: cardLayout(descriptionJa),
  }
}
