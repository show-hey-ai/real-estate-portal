import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getOptionalPublicViewer } from '@/lib/public-viewer'
import { applyMemberChanges, getMemberState } from '@/lib/member-lists-server'
import {
  MEMBER_FAVORITE_LIMIT, MEMBER_RECENT_LIMIT, MEMBER_SEARCH_LIMIT,
  sanitizeFavorites, sanitizeProfile, sanitizeRecent, sanitizeSavedSearches,
} from '@/lib/member-lists'

// Shapes are checked loosely here and strictly by the sanitizers, which drop anything malformed.
const changesSchema = z.object({
  favorites: z.array(z.unknown()).max(MEMBER_FAVORITE_LIMIT).optional(),
  recent: z.array(z.unknown()).max(MEMBER_RECENT_LIMIT).optional(),
  savedSearches: z.array(z.unknown()).max(MEMBER_SEARCH_LIMIT).optional(),
  removedSearches: z.array(z.string().max(1500)).max(MEMBER_SEARCH_LIMIT).optional(),
  clearRecent: z.boolean().optional(),
  buyerProfile: z.record(z.string(), z.unknown()).optional(),
})

const MAX_BODY_BYTES = 64_000

export async function GET() {
  const viewer = await getOptionalPublicViewer()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    return NextResponse.json({ userId: viewer.id, ...(await getMemberState(viewer.id)) })
  } catch (error) {
    console.error('Member lists read error:', error)
    return NextResponse.json({ error: 'Failed to load lists' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const viewer = await getOptionalPublicViewer()
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const text = await request.text().catch(() => '')
  if (text.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Too large' }, { status: 413 })
  let body: unknown
  try { body = JSON.parse(text || '{}') } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = changesSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid lists' }, { status: 400 })
  try {
    const state = await applyMemberChanges(viewer.id, {
      favorites: sanitizeFavorites(parsed.data.favorites),
      recent: sanitizeRecent(parsed.data.recent),
      savedSearches: sanitizeSavedSearches(parsed.data.savedSearches),
      removedSearches: parsed.data.removedSearches,
      clearRecent: parsed.data.clearRecent,
      buyerProfile: parsed.data.buyerProfile ? sanitizeProfile(parsed.data.buyerProfile) : undefined,
    })
    return NextResponse.json({ userId: viewer.id, ...state })
  } catch (error) {
    console.error('Member lists update error:', error)
    return NextResponse.json({ error: 'Failed to save lists' }, { status: 500 })
  }
}
