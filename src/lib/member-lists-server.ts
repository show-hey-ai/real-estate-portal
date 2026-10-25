import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { getPublicListingScope } from '@/lib/public-listing-scope'
import type { FavoriteEntry, RecentListing } from '@/lib/browser-lists'
import type { SavedSearch } from '@/lib/listing-search'
import type { BuyerProfile } from '@/lib/buyer-profile'
import {
  MEMBER_FAVORITE_LIMIT, mergeProfile, mergeRecent, mergeSavedSearches,
  sanitizeProfile, sanitizeRecent, sanitizeSavedSearches, type MemberState,
} from '@/lib/member-lists'

export interface MemberChanges {
  favorites?: FavoriteEntry[]
  recent?: RecentListing[]
  savedSearches?: SavedSearch[]
  removedSearches?: string[]
  clearRecent?: boolean
  buyerProfile?: BuyerProfile
}

async function publicIds(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const rows = await prisma.listing.findMany({ where: { id: { in: ids }, ...getPublicListingScope() }, select: { id: true } })
  return new Set(rows.map((row) => row.id))
}

/** The member's lists, limited to listings that are still published. */
export async function getMemberState(userId: string): Promise<MemberState> {
  const [favorites, row] = await Promise.all([
    prisma.favorite.findMany({ where: { userId, listing: getPublicListingScope() }, select: { listingId: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: MEMBER_FAVORITE_LIMIT }),
    prisma.memberLists.findUnique({ where: { userId } }),
  ])
  const recent = sanitizeRecent(row?.recent)
  const live = await publicIds(recent.map((item) => item.id))
  return {
    favorites: favorites.map((item) => ({ id: item.listingId, addedAt: item.createdAt.getTime() })),
    recent: recent.filter((item) => live.has(item.id)),
    savedSearches: sanitizeSavedSearches(row?.savedSearches),
    buyerProfile: sanitizeProfile(row?.buyerProfile),
  }
}

/** Adds what a device changed to the member's stored lists and returns the merged lists. */
export async function applyMemberChanges(userId: string, changes: MemberChanges): Promise<MemberState> {
  const added = changes.favorites ?? []
  if (added.length) {
    const live = await publicIds(added.map((item) => item.id))
    await prisma.favorite.createMany({
      data: added.filter((item) => live.has(item.id)).map((item) => ({ userId, listingId: item.id, createdAt: new Date(Math.min(item.addedAt, Date.now())) })),
      skipDuplicates: true,
    })
  }
  const row = await prisma.memberLists.findUnique({ where: { userId } })
  const recent = changes.clearRecent ? [] : mergeRecent(sanitizeRecent(row?.recent), changes.recent ?? [])
  const savedSearches = mergeSavedSearches([sanitizeSavedSearches(row?.savedSearches), changes.savedSearches ?? []], changes.removedSearches)
  const buyerProfile = mergeProfile(sanitizeProfile(row?.buyerProfile), changes.buyerProfile ?? {})
  const data = { recent, savedSearches, buyerProfile } as unknown as { recent: Prisma.InputJsonValue; savedSearches: Prisma.InputJsonValue; buyerProfile: Prisma.InputJsonValue }
  await prisma.memberLists.upsert({ where: { userId }, create: { userId, ...data }, update: data })
  return getMemberState(userId)
}
