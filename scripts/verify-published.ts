/**
 * Reusable post-publication check, replacing the per-batch verify scripts. For each REINS
 * number: the listing is public and fresh, the normal audit and verification jobs succeeded,
 * the reviewed manifest hash and photo count match (when --reviewed-dir is given), and all
 * four language pages answer 200 in the right language. Read-only apart from --out.
 *
 *   npm run verify:published -- --ids 100141036091,100141033869 \
 *     [--reviewed-dir <folder with <id>/reviewed.json>] [--since 2026-10-07T10:00:00Z] [--out proof.json]
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from '../src/lib/db'
import { getPublicListingScope } from '../src/lib/public-listing-scope'
import { locales } from '../src/i18n/config'

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.ziyou-fudosan.com').replace(/\/$/, '')
const DAY = 24 * 3600_000

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

interface Check { sourceId: string; ok: boolean; problems: string[]; listingId?: string; photos?: number; pages?: number }

async function reviewedProblems(dir: string, sourceId: string, adminNotes: string | null, mediaCount: number): Promise<string[]> {
  const bytes = await readFile(join(dir, sourceId, 'reviewed.json')).catch(() => null)
  if (!bytes) return ['reviewed.json missing']
  const problems: string[] = []
  const notes = JSON.parse(adminNotes || '{}') as { reviewedHash?: string }
  if (notes.reviewedHash !== createHash('sha256').update(bytes).digest('hex')) problems.push('reviewed hash differs')
  const photos = (JSON.parse(bytes.toString('utf8')) as { photos?: unknown[] }).photos?.length ?? 0
  if (photos !== mediaCount) problems.push(`media ${mediaCount} vs reviewed photos ${photos}`)
  return problems
}

async function pageProblems(listingId: string): Promise<{ problems: string[]; pages: number }> {
  const problems: string[] = []
  let pages = 0
  for (const locale of locales) {
    const url = `${SITE}/listings/${listingId}?lang=${locale}`
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) }).catch(() => null)
    const html = response ? await response.text() : ''
    const lang = html.match(/<html[^>]*lang="([^"]+)"/)?.[1]
    if (response?.status !== 200 || !html.includes(listingId) || lang !== locale) problems.push(`${locale}: ${response?.status ?? 'no response'} lang=${lang}`)
    else pages += 1
  }
  return { problems, pages }
}

async function checkOne(sourceId: string, since: Date, reviewedDir: string | undefined, now: Date): Promise<Check> {
  const listing = await prisma.listing.findUnique({
    where: { sourcePropertyId: sourceId },
    select: { id: true, status: true, autonomyValidUntil: true, adminNotes: true, _count: { select: { media: true } } },
  })
  if (!listing) return { sourceId, ok: false, problems: ['not in database'] }
  const problems: string[] = []
  const isPublic = await prisma.listing.count({ where: { ...getPublicListingScope(now), id: listing.id } })
  if (!isPublic) problems.push(`not public (status ${listing.status}, valid until ${listing.autonomyValidUntil?.toISOString() ?? '-'})`)
  const jobs = await prisma.autonomyJob.findMany({
    where: { kind: { in: ['publication_audit', 'verify_publication'] }, status: 'succeeded', updatedAt: { gte: since }, payload: { path: ['listingId'], equals: listing.id } },
    select: { kind: true },
  })
  for (const kind of ['publication_audit', 'verify_publication']) if (!jobs.some((job) => job.kind === kind)) problems.push(`${kind} not succeeded since ${since.toISOString()}`)
  if (reviewedDir) problems.push(...await reviewedProblems(reviewedDir, sourceId, listing.adminNotes, listing._count.media))
  const pages = await pageProblems(listing.id)
  problems.push(...pages.problems)
  return { sourceId, ok: problems.length === 0, problems, listingId: listing.id, photos: listing._count.media, pages: pages.pages }
}

async function main() {
  const ids = (arg('--ids') ?? '').split(',').map((id) => id.trim()).filter(Boolean)
  if (!ids.length) throw new Error('Pass --ids <REINS number,...>.')
  const now = new Date()
  const since = arg('--since') ? new Date(arg('--since')!) : new Date(now.getTime() - DAY)
  const checks: Check[] = []
  for (const id of ids) checks.push(await checkOne(id, since, arg('--reviewed-dir'), now))
  const publicCount = await prisma.listing.count({ where: getPublicListingScope(now) })
  const summary = { checkedAt: now.toISOString(), publicCount, verified: checks.filter((c) => c.ok).length, failed: checks.filter((c) => !c.ok).length, pages: checks.reduce((n, c) => n + (c.pages ?? 0), 0), photos: checks.reduce((n, c) => n + (c.photos ?? 0), 0) }
  console.log(JSON.stringify(summary))
  for (const check of checks.filter((c) => !c.ok)) console.log(`FAIL ${check.sourceId}: ${check.problems.join('; ')}`)
  const out = arg('--out')
  if (out) await writeFile(out, JSON.stringify({ ...summary, checks }, null, 2), { mode: 0o600 })
  if (summary.failed) process.exitCode = 1
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
  .finally(() => prisma.$disconnect())
