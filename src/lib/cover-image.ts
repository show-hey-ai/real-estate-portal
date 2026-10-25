export interface CoverCandidate {
  url: string
  category?: string | null
  sortOrder?: number | null
}

// Reviewed photos are saved with descriptive file names (facade, upper-facade, living, bath…).
const ENTRANCE = /^(?:entrance|lobby)$/
const PARTIAL_EXTERIOR = /^(?:upper-facade|facade-upper|view|balcony|roof-balcony|lift|lounge)$/
const SECONDARY_ROOM = /^(?:kitchen|hall|lobby|room-past)$/
const WET_ROOM = /^(?:bath|bathroom|wash|washroom|toilet)$/

function photoName(url: string): string {
  return (url.split('/').pop() ?? '').replace(/\.[a-z0-9]+$/i, '').replace(/[-_]?\d{1,2}$/, '').toLowerCase()
}

/**
 * How well a photo works as a listing's cover, best first: the whole building, the main room, the
 * entrance, other rooms, then the floor plan, and only after it wet rooms and partial exterior views
 * (owner decision 2026-10-25: without a whole-building photo, use a room or the floor plan rather
 * than an odd crop). Unnamed uploads count as the best of their category.
 */
export function coverTier(item: CoverCandidate): number {
  const name = photoName(item.url)
  switch (item.category) {
    case 'EXTERIOR': return PARTIAL_EXTERIOR.test(name) ? 6 : ENTRANCE.test(name) ? 2 : 0
    case 'INTERIOR': return WET_ROOM.test(name) ? 5 : SECONDARY_ROOM.test(name) ? 3 : 1
    case 'FLOORPLAN': return 4
    case 'OTHER': return 7
    default: return 8
  }
}

export function pickCoverImage<T extends CoverCandidate>(media: readonly T[] | null | undefined): T | null {
  if (!media?.length) return null
  return [...media].sort((left, right) => coverTier(left) - coverTier(right) || (left.sortOrder ?? 0) - (right.sortOrder ?? 0))[0]
}
