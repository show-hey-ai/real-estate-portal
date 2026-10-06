import { type AutonomyJob } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../db'
import { getExternalAnalyticsWhere } from '../site-analytics-data'
import { locales } from '../../i18n/config'
import { getSiteUrl } from '../site-config'
import { getArticlePublicScope, articleSourceSelect, getPublicArticle } from '../portal-articles'
import { generateArticleContent, sourceFingerprint, wardSlugs } from './article-content'
import { AUTONOMY_VERSION, PORTAL_VENTURE_ID } from './policy'
import { withLiveLease } from './lease'
import { json, writeRecord } from './store'
import { checkPage } from './agents'
import { checkArticleImage } from './article-image-verification'

const releaseSchema = z.object({ slug: z.string().regex(/^(?:tokyo-[a-z]+-property-selection|japan-[a-z]+(?:-[a-z]+){0,4}-guide)$/), sourceHash: z.string().regex(/^[a-f0-9]{64}$/), publishedAt: z.string().datetime(), updatedAt: z.string().datetime() }).strict()

export async function generateArticle(job: AutonomyJob) {
  const generated: string[] = []
  const existing = await prisma.portalArticle.findMany({ select: { city: true, updatedAt: true } })
  const cities = Object.keys(wardSlugs).sort((a, b) => (existing.find((row) => row.city === a)?.updatedAt.getTime() || 0) - (existing.find((row) => row.city === b)?.updatedAt.getTime() || 0))
  for (const city of cities) {
    const sources = await prisma.listing.findMany({ where: { ...getArticlePublicScope(), city, price: { gt: 0 } }, select: articleSourceSelect, orderBy: { updatedAt: 'desc' }, take: 20 })
    if (sources.length < 3) continue
    const sourceHash = sourceFingerprint(sources)
    const slug = `tokyo-${wardSlugs[city]}-property-selection`
    const prior = await prisma.portalArticle.findUnique({ where: { slug } })
    if (prior?.sourceHash === sourceHash && prior.status === 'PUBLISHED') continue
    const content = generateArticleContent(city, sources)
    const publishedAt = new Date()
    const receipt = { slug, sourceHash, publishedAt: publishedAt.toISOString(), updatedAt: publishedAt.toISOString() }
    await withLiveLease(job, async (tx, policy) => {
      if (!policy.allowArticles) throw new Error('Article operation permission changed.')
      const current = await tx.listing.findMany({ where: { ...getArticlePublicScope(), id: { in: sources.map((source) => source.id) } }, select: articleSourceSelect })
      if (sourceFingerprint(current) !== sourceHash) throw new Error('Article sources changed before release.')
      await tx.portalArticle.upsert({ where: { slug }, create: { slug, city, status: 'PUBLISHED', locales: json(content), sourceHash, sourceIds: json(sources.map((source) => source.id)), version: AUTONOMY_VERSION, publishedAt, updatedAt: publishedAt }, update: { status: 'PUBLISHED', locales: json(content), sourceHash, sourceIds: json(sources.map((source) => source.id)), version: AUTONOMY_VERSION, publishedAt, updatedAt: publishedAt } })
      await tx.autonomyJob.upsert({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `article-check:${slug}:${sourceHash}:${job.id}` } }, create: { ventureId: PORTAL_VENTURE_ID, kind: 'verify_article', dedupeKey: `article-check:${slug}:${sourceHash}:${job.id}`, payload: json(receipt), priority: 105 }, update: {} })
    })
    generated.push(slug)
    if (generated.length === 3) break
  }
  await writeRecord(job, 'content', 'Source-backed multilingual purchase articles generated', { generated, languages: locales, generationMethod: 'versioned source-backed templates', evaluationVersion: AUTONOMY_VERSION }, ['public_listings'], 'verified')
  return { generated }
}

export async function verifyArticle(job: AutonomyJob) {
  const receipt = releaseSchema.parse(job.payload)
  const article = await getPublicArticle(receipt.slug)
  if (!article || article.sourceHash !== receipt.sourceHash) return { blocked: true, reason: 'Article source snapshot is no longer current.' }
  const checks = await Promise.all(locales.map((locale) => checkPage(`/articles/${receipt.slug}/${locale}`, (body) => body.includes(`data-article-slug="${receipt.slug}"`) && body.includes(`data-source-hash="${receipt.sourceHash}"`) && body.includes('application/ld+json') && body.includes('rel="canonical"') && /hreflang=/i.test(body), true)))
  const images = await Promise.all([...new Set(Object.values(article.locales).flatMap(locale => locale.hero ? [locale.hero.url] : []))].map(path => checkArticleImage(path, getSiteUrl())))
  if ([...checks, ...images].some((check) => !check.ok)) throw new Error('Article page or image verification failed.')
  await writeRecord(job, 'seo_verification', 'Article pages, images and SEO elements checked in four languages', { ...receipt, checks, images }, [...checks, ...images].map((check) => check.url), 'verified')
  return { ...receipt, verified: true }
}

export async function rollbackArticle(job: AutonomyJob) {
  const receipt = releaseSchema.parse(job.payload)
  const changed = await withLiveLease(job, (tx) => tx.portalArticle.updateMany({ where: { slug: receipt.slug, sourceHash: receipt.sourceHash, publishedAt: new Date(receipt.publishedAt), updatedAt: new Date(receipt.updatedAt), status: 'PUBLISHED' }, data: { status: 'DRAFT' } }))
  await writeRecord(job, 'recovery', 'Unverified article release hidden', { ...receipt, hidden: changed.count === 1 }, [receipt.slug], 'verified')
  return { hidden: changed.count === 1 }
}

export async function seo(job: AutonomyJob) {
  const checks = await Promise.all([
    checkPage('/sitemap.xml', (body) => body.includes('<urlset') && body.includes('/listings')),
    checkPage('/robots.txt', (body) => body.includes('Sitemap:') && body.includes('/sitemap.xml')),
    checkPage('/', (body) => body.includes('rel="canonical"') && body.includes('name="description"')),
    checkPage('/listings', (body) => body.includes('rel="canonical"') && body.includes('name="description"')),
  ])
  const lastWeek = new Date(Date.now() - 7 * 24 * 3600_000)
  const audience = await getExternalAnalyticsWhere()
  const [articleViews, searchVisits] = await Promise.all([
    prisma.siteVisitEvent.count({ where: { ...audience, occurredAt: { gte: lastWeek }, pathname: { startsWith: '/articles' } } }),
    prisma.siteVisitEvent.count({ where: { ...audience, occurredAt: { gte: lastWeek }, referrerHost: { in: ['google.com', 'www.google.com', 'google.co.jp', 'bing.com', 'www.bing.com'] } } }),
  ])
  await writeRecord(job, 'seo', 'Technical SEO checks and observed discovery', { checks, articleViews, searchReferrerVisits: searchVisits, measuredRankings: null, siteOrigin: getSiteUrl(), actions: ['source-backed article refresh', 'canonical and language alternates', 'article structured data', 'sitemap and internal links'] }, checks.map((check) => check.url), 'verified')
  if (checks.some((check) => !check.ok)) throw new Error('Technical SEO check failed.')
  return { healthy: true, articleViews, searchVisits }
}
