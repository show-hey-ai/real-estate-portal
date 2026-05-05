/**
 * REINS バッチ取得物件の一括分類
 * - 4/29 作成の DRAFT 物件を hospitalityCategory='RENOVATION_TARGET' + status='PUBLISHED' に
 * - propertyType='区分マンション' でも実際は一棟が多いため、デフォルトで PUBLISH してまずポータル可視化
 * - 個別 ARCHIVE は admin UI で対応（または exceptions リストに追加）
 *
 * Run:
 *   cd ~/Desktop/ziyou/portal && npx tsx scripts/bulk-categorize-reins-batch.ts
 *   # Dry-run（実行せず確認のみ）:
 *   cd ~/Desktop/ziyou/portal && npx tsx scripts/bulk-categorize-reins-batch.ts --dry-run
 */
import dns from 'node:dns'
import { config } from 'dotenv'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

config({ path: resolve(process.cwd(), '.env') })
dns.setDefaultResultOrder('verbatim')

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const dryRun = process.argv.includes('--dry-run')

// ARCHIVE 対象の管理番号（明らかに 4本柱外 / 高級区分など）
const ARCHIVE_MANAGEMENT_IDS: string[] = [
  'TP-0212', // ザ豊海タワー、76.69㎡ 3LDK 区分
  // 他に見つかったらここに追加
]

async function main() {
  // 4/29 以降の DRAFT 物件取得
  const cutoff = new Date('2026-04-29T00:00:00Z')
  const targets = await prisma.listing.findMany({
    where: {
      status: 'DRAFT',
      createdAt: { gte: cutoff },
    },
    select: {
      id: true,
      managementId: true,
      propertyType: true,
      addressPublic: true,
      price: true,
      hospitalityCategory: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  console.log(`Found ${targets.length} DRAFT listings created since ${cutoff.toISOString()}`)
  console.log('')

  let publishCount = 0
  let archiveCount = 0
  const skipCount = 0

  for (const listing of targets) {
    const shouldArchive =
      listing.managementId && ARCHIVE_MANAGEMENT_IDS.includes(listing.managementId)

    if (shouldArchive) {
      archiveCount++
      console.log(
        `  ARCHIVE: ${listing.managementId} ${listing.addressPublic} ${listing.propertyType} ¥${listing.price ? Number(listing.price) / 100_000_000 + '億' : '?'}`
      )
      if (!dryRun) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'ARCHIVED' },
        })
      }
      continue
    }

    // それ以外は RENOVATION_TARGET + PUBLISHED
    publishCount++
    if (publishCount <= 10) {
      console.log(
        `  PUBLISH: ${listing.managementId} ${listing.addressPublic} ${listing.propertyType} ¥${listing.price ? Number(listing.price) / 100_000_000 + '億' : '?'}`
      )
    }
    if (!dryRun) {
      await prisma.listing.update({
        where: { id: listing.id },
        data: {
          status: 'PUBLISHED',
          hospitalityCategory: 'RENOVATION_TARGET',
          publishedAt: new Date(),
        },
      })
    }
  }

  if (publishCount > 10) {
    console.log(`  ... and ${publishCount - 10} more PUBLISH actions`)
  }

  console.log('')
  console.log(`Summary${dryRun ? ' (DRY-RUN)' : ''}:`)
  console.log(`  PUBLISH + RENOVATION_TARGET: ${publishCount}`)
  console.log(`  ARCHIVED:                    ${archiveCount}`)
  console.log(`  SKIPPED:                     ${skipCount}`)
  console.log('')
  if (dryRun) {
    console.log('DRY-RUN: No changes were made. Re-run without --dry-run to apply.')
  } else {
    console.log('Done. Check admin: https://portal.ziyou-fudosan.com/admin/listings')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
