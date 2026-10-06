// Photos make better covers than drawings: exterior, then interior, then other photos, then the floor plan.
const COVER_ORDER = ['EXTERIOR', 'INTERIOR', 'OTHER', 'FLOORPLAN'] as const

export interface CoverCandidate {
  url: string
  category?: string | null
  sortOrder?: number | null
}

export function pickCoverImage<T extends CoverCandidate>(media: readonly T[] | null | undefined): T | null {
  if (!media?.length) return null
  const ordered = [...media].sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
  for (const category of COVER_ORDER) {
    const match = ordered.find((item) => item.category === category)
    if (match) return match
  }
  return ordered[0]
}
