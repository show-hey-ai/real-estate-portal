/**
 * Reclassify listing.propertyType from existing extracted text.
 *
 * Run:
 *   npx tsx scripts/fix-property-types.ts
 *   npx tsx scripts/fix-property-types.ts --apply
 *   npx tsx scripts/fix-property-types.ts --apply --archive-units
 */
import { config } from 'dotenv'
import { Pool } from 'pg'
import { resolve } from 'path'
import { normalizePropertyType } from '../src/lib/property-type'

config({ path: resolve(process.cwd(), '.env') })

const dryRun = !process.argv.includes('--apply')
const archiveUnits = process.argv.includes('--archive-units')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

type ListingRow = {
  id: string
  managementId: string | null
  addressPublic: string | null
  propertyType: string | null
  buildingArea: number | string | null
  landArea: number | string | null
  floorCount: number | string | null
  descriptionJa: string | null
  features: unknown
}

async function main() {
  const { rows: data } = await pool.query<ListingRow>(`
    select
      id,
      "managementId",
      "addressPublic",
      "propertyType",
      "buildingArea"::text,
      "landArea"::text,
      "floorCount",
      "descriptionJa",
      features
    from listings
    where status in ('DRAFT', 'REVIEWED', 'PUBLISHED')
    order by "managementId" desc nulls last
  `)

  const updates = (data || [])
    .map((listing: ListingRow) => {
      const normalized = normalizePropertyType(listing.propertyType, {
        descriptionJa: listing.descriptionJa,
        features: listing.features,
        buildingArea: listing.buildingArea,
        landArea: listing.landArea,
        floorCount: listing.floorCount,
      })

      return normalized && normalized !== listing.propertyType
        ? { listing, normalized }
        : null
    })
    .filter(Boolean) as { listing: ListingRow; normalized: string }[]

  console.log(`Found ${(data || []).length} active listings`)
  console.log(`Property type updates${dryRun ? ' (dry-run)' : ''}: ${updates.length}`)

  for (const { listing, normalized } of updates) {
    console.log(
      `${listing.managementId || listing.id}: ${listing.propertyType || '-'} -> ${normalized} | ${listing.addressPublic || '-'}`,
    )

    if (!dryRun) {
      await pool.query('update listings set "propertyType" = $1, "updatedAt" = now() where id = $2', [
        normalized,
        listing.id,
      ])
    }
  }

  if (dryRun) {
    console.log('No changes applied. Re-run with --apply to update DB.')
  }

  if (archiveUnits) {
    const { rows: remainingUnitListings } = await pool.query<ListingRow>(`
      select id, "managementId", "addressPublic", "propertyType", "buildingArea"::text, "landArea"::text, "floorCount", "descriptionJa", features
      from listings
      where status in ('DRAFT', 'REVIEWED', 'PUBLISHED')
        and "propertyType" = '区分マンション'
      order by "managementId" desc nulls last
    `)

    console.log('')
    console.log(`Unit listings to archive${dryRun ? ' (dry-run)' : ''}: ${remainingUnitListings.length}`)
    for (const listing of remainingUnitListings) {
      console.log(`${listing.managementId || listing.id}: ARCHIVE | ${listing.addressPublic || '-'}`)
      if (!dryRun) {
        await pool.query('update listings set status = $1, "updatedAt" = now() where id = $2', [
          'ARCHIVED',
          listing.id,
        ])
      }
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
}).finally(async () => {
  await pool.end()
})
