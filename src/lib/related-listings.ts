export interface RelatedCandidate {
  id: string
  city: string | null
  propertyType: string | null
  price: number | string | bigint | null
}

const SAME_WARD = 3
const SAME_TYPE = 2
const NEAR_PRICE = 2
const PRICE_TOLERANCE = 0.3

function priceOf(value: RelatedCandidate['price']): number | null {
  const price = Number(value)
  return Number.isFinite(price) && price > 0 ? price : null
}

/** Ranks other published listings by shared ward, property type and asking-price proximity. */
export function rankRelatedListings<T extends RelatedCandidate>(current: RelatedCandidate, candidates: T[], limit = 3): T[] {
  const basePrice = priceOf(current.price)
  return candidates
    .filter((candidate) => candidate.id !== current.id)
    .map((candidate) => {
      const price = priceOf(candidate.price)
      const gap = basePrice && price ? Math.abs(price - basePrice) / basePrice : Number.POSITIVE_INFINITY
      const score = (candidate.city && candidate.city === current.city ? SAME_WARD : 0)
        + (candidate.propertyType && candidate.propertyType === current.propertyType ? SAME_TYPE : 0)
        + (gap <= PRICE_TOLERANCE ? NEAR_PRICE : 0)
      return { candidate, score, gap }
    })
    .sort((left, right) => right.score - left.score || left.gap - right.gap || left.candidate.id.localeCompare(right.candidate.id))
    .slice(0, limit)
    .map(({ candidate }) => candidate)
}
