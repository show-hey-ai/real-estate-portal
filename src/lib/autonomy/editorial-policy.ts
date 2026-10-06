import { createHash } from 'node:crypto'
import { z } from 'zod'

export const RESEARCH_ARTICLE_VERSION = 'desktop-research-articles-v1'
export const officialReferenceSchema = z.object({
  title: z.string().min(1).max(180),
  url: z.string().url().refine((value) => {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && ['www.mlit.go.jp', 'www.reinfolib.mlit.go.jp', 'www.reins.or.jp'].includes(url.hostname)
  }, 'Only reviewed official sources are allowed.'),
}).strict()
export const articleHeroSchema = z.object({
  url: z.string().regex(/^\/images\/articles\/[a-z0-9-]+\.(?:webp|png)$/),
  alt: z.string().min(10).max(240),
  caption: z.string().min(10).max(300),
}).strict()
export const canonical = (value: unknown): unknown => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value
export const editorialHash = (value: unknown) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex')
export const researchReviewSchema = z.object({
  slug: z.string(), contentHash: z.string().regex(/^[a-f0-9]{64}$/), sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  verifiedAt: z.string().datetime(), validUntil: z.string().datetime(), references: z.array(officialReferenceSchema).min(1).max(8),
}).strict()

export function researchArticleIsCurrent(article: { slug: string; version: string; sourceHash: string; sourceIds: unknown; locales: unknown }, record: { content: unknown; verification: string } | undefined, now = new Date()) {
  const review = researchReviewSchema.safeParse(record?.content)
  if (article.version !== RESEARCH_ARTICLE_VERSION || record?.verification !== 'verified' || !review.success || !Array.isArray(article.sourceIds) || article.sourceIds.length) return false
  const evidence = review.data
  const start = Date.parse(evidence.verifiedAt), end = Date.parse(evidence.validUntil)
  if (start > now.getTime() || end <= now.getTime() || end <= start || end - start > 7 * 24 * 3600_000) return false
  const locales = article.locales as Record<string, { references?: unknown }>
  if (!locales || typeof locales !== 'object' || Array.isArray(locales)) return false
  return evidence.slug === article.slug && evidence.contentHash === editorialHash(article.locales) && evidence.sourceHash === article.sourceHash && Object.values(locales).length === 4 && Object.values(locales).every(locale => locale && editorialHash(locale.references ?? null) === editorialHash(evidence.references))
}

export type EditorialMetrics = { views: number; onwardVisits: number }
// Directional feedback only: sparse observations never establish a winner.
export function compareEditorialMetrics(baseline: EditorialMetrics, candidate: EditorialMetrics) {
  if ([baseline, candidate].some(x => !Number.isSafeInteger(x.views) || !Number.isSafeInteger(x.onwardVisits) || x.views < 0 || x.onwardVisits < 0 || x.onwardVisits > x.views)) throw new Error('Invalid editorial observations.')
  if (baseline.views < 100 || candidate.views < 100) return 'insufficient_data' as const
  const a = baseline.onwardVisits / baseline.views, b = candidate.onwardVisits / candidate.views
  const uncertainty = 1.96 * Math.sqrt(a * (1 - a) / baseline.views + b * (1 - b) / candidate.views)
  if (b - a > uncertainty && b > a + 0.02) return 'keep_candidate' as const
  if (a - b > uncertainty && a > b + 0.02) return 'restore_baseline' as const
  return 'inconclusive' as const
}
