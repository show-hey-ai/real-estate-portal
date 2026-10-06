/**
 * Coordinates for a public address from the GSI address search (国土地理院, no key needed).
 * Used only to open hazard maps at the property's location; failures return null.
 */

export interface LatLng {
  lat: number
  lng: number
}

const GSI_ADDRESS_SEARCH = 'https://msearch.gsi.go.jp/address-search/AddressSearch'
const CACHE_SECONDS = 60 * 60 * 24 * 30
const TIMEOUT_MS = 3000
// Tokyo's bounding box; results outside it are treated as mismatches.
const TOKYO_BOUNDS = { minLat: 35.4, maxLat: 35.95, minLng: 138.9, maxLng: 140.0 }

/** Drops the unit number so the search matches the building, e.g. 「… 24-16 502号室」→「… 24-16」. */
export function geocodeQuery(address: string): string {
  return address.replace(/\s*[0-9０-９]+(号室|階)\s*$/u, '').replace(/\s+[^\s]*号室$/u, '').trim()
}

export function parseGsiResult(body: unknown): LatLng | null {
  if (!Array.isArray(body) || !body.length) return null
  const coordinates = (body[0] as { geometry?: { coordinates?: unknown } })?.geometry?.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) return null
  const [lng, lat] = coordinates.map(Number)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < TOKYO_BOUNDS.minLat || lat > TOKYO_BOUNDS.maxLat || lng < TOKYO_BOUNDS.minLng || lng > TOKYO_BOUNDS.maxLng) return null
  return { lat, lng }
}

export async function geocodeAddress(address: string | null | undefined): Promise<LatLng | null> {
  if (!address) return null
  try {
    const url = `${GSI_ADDRESS_SEARCH}?q=${encodeURIComponent(geocodeQuery(address))}`
    const response = await fetch(url, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) return null
    return parseGsiResult(await response.json())
  } catch {
    return null // Hazard links fall back to the portal without a location.
  }
}

/** 重ねるハザードマップ centred on the property. */
export function hazardMapUrl(point: LatLng | null): string {
  const base = 'https://disaportal.gsi.go.jp/maps/'
  return point ? `${base}?ll=${point.lat.toFixed(6)},${point.lng.toFixed(6)}&z=16&base=pale` : base
}
