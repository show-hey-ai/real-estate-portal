import 'server-only'

import { unstable_cache } from 'next/cache'
import { cache } from 'react'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import {
  buildPublicSearchLocationIndex,
  buildPublicSearchLocationIndexFromMaster,
} from '@/lib/public-search'

/**
 * Use Supabase REST API (HTTPS/IPv4) instead of direct PostgreSQL (IPv6-only).
 * Vercel serverless functions cannot reach IPv6-only hosts, so we bypass
 * Prisma and use the REST API which goes through Cloudflare (IPv4).
 */
function getSupabaseAdmin() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function fetchPublicSearchLocationIndex() {
  const supabase = getSupabaseAdmin()

  // Try transit_line_master table first (via REST API)
  try {
    const { data: masterLines, error } = await supabase
      .from('transit_line_master')
      .select('display_name_ja, stations:transit_station_master(display_name_ja)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('display_name_ja', { ascending: true })

    if (!error && masterLines && masterLines.length > 0) {
      const formatted = masterLines.map((line: { display_name_ja: string; stations: { display_name_ja: string }[] }) => ({
        displayNameJa: line.display_name_ja,
        stations: (line.stations || []).map((s: { display_name_ja: string }) => ({
          displayNameJa: s.display_name_ja,
        })),
      }))
      return buildPublicSearchLocationIndexFromMaster(formatted)
    }
    if (error) {
      console.error('Failed to load transit master via REST:', error.message)
    }
  } catch (error) {
    console.error('Failed to load transit master for public search:', error)
  }

  // Fallback: build index from published listings (via REST API)
  try {
    const { data: listingRows, error } = await supabase
      .from('listings')
      .select('city, stations')
      .eq('status', 'PUBLISHED')
      .eq('adAllowed', true)

    if (error) {
      console.error('Failed to query listings via REST:', error.message)
      return buildPublicSearchLocationIndex([])
    }

    return buildPublicSearchLocationIndex(
      (listingRows || []).map((row: { city: string | null; stations: unknown }) => ({
        city: row.city,
        stations: Array.isArray(row.stations)
          ? row.stations.map((station: unknown) => ({
              line:
                typeof station === 'object' && station && 'line' in station
                  ? String((station as { line?: string }).line ?? '')
                  : null,
              name:
                typeof station === 'object' && station && 'name' in station
                  ? String((station as { name?: string }).name ?? '')
                  : null,
            }))
          : null,
      }))
    )
  } catch (error) {
    console.error('Failed to build public search index from listings:', error)
    return buildPublicSearchLocationIndex([])
  }
}

const getPublicSearchLocationIndexCached = unstable_cache(fetchPublicSearchLocationIndex, ['public-search-location-index'], {
  revalidate: 3600,
})

export const getPublicSearchLocationIndex = cache(async () => getPublicSearchLocationIndexCached())
