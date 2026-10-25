import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { prisma } from '../db'
import { renewedResearchReview, researchReviewSchema, RESEARCH_ARTICLE_VERSION } from './editorial-policy'
import { PORTAL_VENTURE_ID } from './policy'
import { json } from './store'

/**
 * Research articles stay public only while their review is under seven days old. A person reviews
 * the text once; after that the weekly part is mechanical (is the text unchanged, are the official
 * sources still there), so the SEO job renews it. Edited text or a dead source is left expired for
 * a person (2026-10-25: the three guides had been hidden since their review lapsed on 10-12).
 */
const LINK_TIMEOUT_MS = 15_000
const RENEW_WITHIN_MS = 2 * 24 * 3600_000

// www.reins.or.jp serves an incomplete certificate chain: Node rejects it, while the macOS
// certificate check (via curl, which fetches the missing intermediate) verifies it.
async function liveByCurl(url: string): Promise<boolean> {
  const status = await promisify(execFile)('curl', ['-s', '-L', '-o', '/dev/null', '-w', '%{http_code}', '--max-time', String(LINK_TIMEOUT_MS / 1000), url])
    .then(({ stdout }) => Number(stdout.trim())).catch(() => 0)
  return status >= 200 && status < 300
}

async function liveLinks(urls: string[]): Promise<Set<string>> {
  const results = await Promise.all([...new Set(urls)].map(async (url) => {
    const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(LINK_TIMEOUT_MS), headers: { 'User-Agent': 'WelcomeHomeTokyo-source-check' } }).catch(() => null)
    await response?.body?.cancel()
    if (response?.ok) return url
    return !response && await liveByCurl(url) ? url : null
  }))
  return new Set(results.filter((url): url is string => !!url))
}

/** Renews due reviews; returns the slugs renewed and those left for a person. */
export async function renewResearchReviews(now = new Date()): Promise<{ renewed: string[]; needsPerson: string[] }> {
  const articles = await prisma.portalArticle.findMany({ where: { status: 'PUBLISHED', version: RESEARCH_ARTICLE_VERSION }, select: { slug: true, sourceHash: true, locales: true } })
  const records = await prisma.autonomyRecord.findMany({ where: { ventureId: PORTAL_VENTURE_ID, dedupeKey: { in: articles.map((article) => `research-article:${article.slug}`) }, verification: 'verified' }, select: { id: true, dedupeKey: true, content: true } })
  const due = articles.flatMap((article) => {
    const record = records.find((row) => row.dedupeKey === `research-article:${article.slug}`)
    const review = researchReviewSchema.safeParse(record?.content)
    return record && review.success && Date.parse(review.data.validUntil) - now.getTime() <= RENEW_WITHIN_MS ? [{ article, record, review: review.data }] : []
  })
  const live = await liveLinks(due.flatMap(({ review }) => review.references.map((reference) => reference.url)))
  const renewed: string[] = [], needsPerson: string[] = []
  for (const { article, record, review } of due) {
    const next = renewedResearchReview(article, review, (url) => live.has(url), now)
    if (!next) { needsPerson.push(article.slug); continue }
    await prisma.autonomyRecord.update({ where: { id: record.id }, data: { content: json(next) } })
    renewed.push(article.slug)
  }
  return { renewed, needsPerson }
}
