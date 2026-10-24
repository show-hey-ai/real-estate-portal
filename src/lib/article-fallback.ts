import { localizedPath } from './locale-url'
import { WARD_SLUGS } from './ward-tile-map'

/**
 * Where to send readers of an article that is hidden for now (its sources changed or its
 * review expired). Hidden articles come back once regenerated, so this is a temporary
 * redirect to the closest evergreen page rather than a 404 for pages already in search results.
 */
const FIXED: Record<string, string> = {
  'japan-market-guide': '/buy-property-in-tokyo',
  'japan-buying-process-guide': '/buying-guide',
  'japan-brokerage-guide': '/buying-guide',
  'tokyo-condominiums-property-selection': '/types/condominium',
  'tokyo-wards-property-selection': '/areas',
}

const WARDS = new Set(Object.values(WARD_SLUGS))

export function articleFallbackPath(slug: string, locale: string): string {
  const ward = slug.match(/^tokyo-([a-z]+)-property-selection$/)?.[1]
  const path = FIXED[slug] ?? (ward && WARDS.has(ward) ? `/areas/${ward}` : '/articles')
  return localizedPath(path, locale)
}
