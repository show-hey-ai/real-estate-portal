/**
 * Backfill hospitality candidate category, feature points, warnings, and admin memo.
 *
 * Run:
 *   npx tsx scripts/fix-hospitality-candidates.ts
 *   npx tsx scripts/fix-hospitality-candidates.ts --apply
 */
import { config } from 'dotenv'
import { Pool } from 'pg'
import { resolve } from 'path'
import { prepareHospitalityCandidate } from '../src/lib/hospitality-assessment'

config({ path: resolve(process.cwd(), '.env') })

const dryRun = !process.argv.includes('--apply')
const overwriteNotes = process.argv.includes('--overwrite-notes')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

type ListingRow = {
  id: string
  managementId: string | null
  addressPublic: string | null
  propertyType: string | null
  hospitalityCategory: string | null
  zoning: string | null
  currentStatus: string | null
  descriptionJa: string | null
  features: unknown
  warnings: unknown
  stations: unknown
  buildingArea: string | number | null
  landArea: string | number | null
  floorCount: string | number | null
  builtYear: string | number | null
  structure: string | null
  adminNotes: string | null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

function asNumber(value: string | number | null): number | null {
  if (value == null) return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

async function main() {
  const { rows } = await pool.query<ListingRow>(`
    select
      id,
      "managementId",
      "addressPublic",
      "propertyType",
      "hospitalityCategory",
      zoning,
      "currentStatus",
      "descriptionJa",
      features,
      warnings,
      stations,
      "buildingArea"::text,
      "landArea"::text,
      "floorCount",
      "builtYear",
      structure,
      "adminNotes"
    from listings
    where status in ('DRAFT', 'REVIEWED', 'PUBLISHED')
      and coalesce("propertyType", '') <> '区分マンション'
    order by "managementId" desc nulls last
  `)

  console.log(`Found ${rows.length} active non-unit listings`)
  console.log(`Backfill hospitality candidates${dryRun ? ' (dry-run)' : ''}`)

  let changed = 0
  for (const listing of rows) {
    const prepared = prepareHospitalityCandidate({
      propertyType: listing.propertyType,
      zoning: listing.zoning,
      currentStatus: listing.currentStatus,
      descriptionJa: listing.descriptionJa,
      features: asStringArray(listing.features),
      warnings: asStringArray(listing.warnings),
      stations: Array.isArray(listing.stations) ? listing.stations : [],
      buildingArea: asNumber(listing.buildingArea),
      landArea: asNumber(listing.landArea),
      floorCount: asNumber(listing.floorCount),
      builtYear: asNumber(listing.builtYear),
      structure: listing.structure,
    })

    const nextAdminNotes =
      overwriteNotes || !listing.adminNotes || listing.adminNotes.startsWith('【宿泊転用候補メモ】')
        ? prepared.adminNotes
        : listing.adminNotes

    const shouldUpdate =
      listing.hospitalityCategory !== prepared.category ||
      JSON.stringify(asStringArray(listing.features)) !== JSON.stringify(prepared.features) ||
      JSON.stringify(asStringArray(listing.warnings)) !== JSON.stringify(prepared.warnings) ||
      nextAdminNotes !== listing.adminNotes

    if (!shouldUpdate) continue
    changed++

    console.log(
      `${listing.managementId || listing.id}: ${listing.propertyType || '-'} -> ${prepared.category} | score ${prepared.assessment.potential_score}/5 | ${listing.addressPublic || '-'}`,
    )

    if (!dryRun) {
      await pool.query(
        `
          update listings
          set
            "hospitalityCategory" = $1,
            features = $2::jsonb,
            warnings = $3::jsonb,
            "adminNotes" = $4,
            "updatedAt" = now()
          where id = $5
        `,
        [
          prepared.category,
          JSON.stringify(prepared.features),
          JSON.stringify(prepared.warnings),
          nextAdminNotes,
          listing.id,
        ],
      )
    }
  }

  console.log(`Changed: ${changed}`)
  if (dryRun) {
    console.log('No changes applied. Re-run with --apply to update DB.')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
