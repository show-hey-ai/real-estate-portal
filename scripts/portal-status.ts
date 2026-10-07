/**
 * One-screen status for the start of each acquisition/renewal run, so the operator does not
 * have to re-read long notes or write ad-hoc queries. Read-only.
 *
 *   set -a; source runtime.env; set +a
 *   npm run portal:status [-- --queue <review-queue.json>]
 */
import { readFile } from 'node:fs/promises'
import { prisma } from '../src/lib/db'
import { getPublicListingScope } from '../src/lib/public-listing-scope'
import { PORTAL_VENTURE_ID } from '../src/lib/autonomy/policy'

const GOAL = 500
const HOUR = 3600_000

const jst = (date: Date | null | undefined) =>
  date ? date.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(5, 16) : '-'

function argValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

async function listingLines(now: Date): Promise<string[]> {
  const [publicCount, managed] = await Promise.all([
    prisma.listing.count({ where: getPublicListingScope(now) }),
    prisma.listing.findMany({
      where: { status: 'PUBLISHED', autonomyValidUntil: { not: null } },
      select: { sourcePropertyId: true, autonomyValidUntil: true },
      orderBy: { autonomyValidUntil: 'asc' },
    }),
  ])
  const until = (row: { autonomyValidUntil: Date | null }) => row.autonomyValidUntil!.getTime() - now.getTime()
  const expired = managed.filter((row) => until(row) <= 0)
  const within = (hours: number) => managed.filter((row) => until(row) > 0 && until(row) <= hours * HOUR).length
  const next = managed.find((row) => until(row) > 0)
  const todayJst = new Date(now.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 10) + 'T00:00:00+09:00')
  const newToday = await prisma.listing.count({ where: { ...getPublicListingScope(now), publishedAt: { gte: todayJst } } })
  // Weekly renewal (2026-10-07): only listings whose visibility ends within two days need a check now.
  const due = managed.filter((row) => until(row) > 0 && until(row) <= 48 * HOUR).map((row) => row.sourcePropertyId)
  return [
    `public ${publicCount} (goal ${GOAL}, remaining ${Math.max(GOAL - publicCount, 0)}), new today ${newToday}`,
    `renew now (visible <48h left, weekly check): ${due.length}${due.length ? ` -> ${due.join(',')}` : ''}`,
    `auto-managed ${managed.length}: expired-but-published ${expired.length}, expiring <6h ${within(6)}, <12h ${within(12)}, <24h ${within(24)}`,
    `next expiry ${jst(next?.autonomyValidUntil)} JST (${next?.sourcePropertyId ?? '-'})`,
    ...(expired.length ? [`EXPIRED (need full check): ${expired.map((row) => row.sourcePropertyId).join(',')}`] : []),
  ]
}

async function jobLines(now: Date): Promise<string[]> {
  const [open, failed, policy, renewal] = await Promise.all([
    prisma.autonomyJob.groupBy({ by: ['kind', 'status'], where: { ventureId: PORTAL_VENTURE_ID, status: { in: ['pending', 'running'] } }, _count: true }),
    prisma.autonomyJob.count({ where: { ventureId: PORTAL_VENTURE_ID, status: 'failed', updatedAt: { gte: new Date(now.getTime() - 24 * HOUR) } } }),
    prisma.autonomyPolicy.findUnique({ where: { id: PORTAL_VENTURE_ID }, select: { enabled: true, allowPublication: true, monthlyBudgetYen: true, lastHeartbeatAt: true } }),
    prisma.autonomyRecord.findFirst({ where: { ventureId: PORTAL_VENTURE_ID, recordType: 'freshness' }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, title: true } }),
  ])
  const openText = open.map((row) => `${row.kind}:${row.status}=${row._count}`).join(' ') || 'none'
  return [
    `jobs open ${openText}; failed last 24h ${failed}`,
    `policy enabled=${policy?.enabled} publication=${policy?.allowPublication} budgetYen=${policy?.monthlyBudgetYen} worker heartbeat ${jst(policy?.lastHeartbeatAt)} JST`,
    `last light renewal ${jst(renewal?.createdAt)} JST ${renewal?.title ?? ''}`.trim(),
  ]
}

async function queueLines(path: string): Promise<string[]> {
  const rows = JSON.parse(await readFile(path, 'utf8')) as { stage?: string; screeningVerdict?: string }[]
  const count = (key: (row: { stage?: string; screeningVerdict?: string }) => string | undefined) =>
    Object.entries(rows.reduce<Record<string, number>>((acc, row) => { const value = key(row) ?? '-'; acc[value] = (acc[value] ?? 0) + 1; return acc }, {}))
      .sort((a, b) => b[1] - a[1]).map(([name, n]) => `${name}=${n}`).join(' ')
  return [`queue ${rows.length}: ${count((row) => row.stage)}`, `screening: ${count((row) => row.screeningVerdict)}`]
}

async function main() {
  const now = new Date()
  const queue = argValue('--queue')
  const lines = [
    `status ${jst(now)} JST`,
    ...(await listingLines(now)),
    ...(await jobLines(now)),
    ...(queue ? await queueLines(queue) : []),
  ]
  console.log(lines.join('\n'))
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
