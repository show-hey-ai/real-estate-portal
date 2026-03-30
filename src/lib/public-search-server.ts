import 'server-only'

import { cache } from 'react'
import { prisma } from '@/lib/db'
import {
  buildPublicSearchLocationIndex,
  buildPublicSearchLocationIndexFromMaster,
} from '@/lib/public-search'

export const getPublicSearchLocationIndex = cache(async () => {
  const masterLines = await prisma.transitLineMaster.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { displayNameJa: 'asc' }],
    select: {
      displayNameJa: true,
      stations: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { displayNameJa: 'asc' }],
        select: { displayNameJa: true },
      },
    },
  })

  if (masterLines.length > 0) {
    return buildPublicSearchLocationIndexFromMaster(masterLines)
  }

  const listingRows = await prisma.listing.findMany({
    where: {
      status: 'PUBLISHED',
      adAllowed: true,
    },
    select: {
      city: true,
      stations: true,
    },
  })

  return buildPublicSearchLocationIndex(
    listingRows.map((row) => ({
      city: row.city,
      stations: Array.isArray(row.stations)
        ? row.stations.map((station) => ({
            line: typeof station === 'object' && station && 'line' in station ? String(station.line ?? '') : null,
            name: typeof station === 'object' && station && 'name' in station ? String(station.name ?? '') : null,
          }))
        : null,
    }))
  )
})
