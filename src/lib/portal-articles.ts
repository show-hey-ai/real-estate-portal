import { prisma } from './db'
import { getPublicListingScope } from './public-listing-scope'
import { articleLocalesSchema, sourceFingerprint } from './autonomy/article-content'
import { RESEARCH_ARTICLE_VERSION, researchArticleIsCurrent } from './autonomy/editorial-policy'

export const articleSourceSelect = { id: true, city: true, propertyType: true, price: true, buildingArea: true, builtYear: true, updatedAt: true } as const
export const getArticlePublicScope = getPublicListingScope

/** Refuse stale articles immediately, before the maintenance worker runs. */
async function readPublicArticles(slug?: string) {
  try {
    const articles = await prisma.portalArticle.findMany({ where: { status: 'PUBLISHED', ...(slug ? { slug } : {}) }, orderBy: { updatedAt: 'desc' }, ...(slug ? {} : { take: 60 }) })
    const ids = articles.flatMap((article) => Array.isArray(article.sourceIds) ? article.sourceIds.filter((id): id is string => typeof id === 'string') : [])
    const sources = await prisma.listing.findMany({ where: { ...getArticlePublicScope(), id: { in: ids } }, select: articleSourceSelect })
    const reviews = await prisma.autonomyRecord.findMany({ where: { ventureId: 'ziyou-portal', dedupeKey: { in: articles.filter(a => a.version === RESEARCH_ARTICLE_VERSION).map(a => `research-article:${a.slug}`) } }, select: { dedupeKey: true, content: true, verification: true } })
    return articles.flatMap((article) => {
      const input = articleLocalesSchema.safeParse(article.locales)
      const rows = sources.filter((source) => Array.isArray(article.sourceIds) && article.sourceIds.includes(source.id))
      if (!input.success) return []
      if (article.version === RESEARCH_ARTICLE_VERSION) {
        const review = reviews.find(r => r.dedupeKey === `research-article:${article.slug}`)
        if (!researchArticleIsCurrent(article, review) || Object.values(input.data).some(locale => !locale.references?.length || JSON.stringify(locale.references) !== JSON.stringify(Object.values(input.data)[0].references))) return []
      } else if (rows.length < 3 || sourceFingerprint(rows) !== article.sourceHash) return []
      return [{ ...article, locales: input.data, sources: rows }]
    })
  } catch { return [] } // Deployment before migration has no generated articles.
}

export async function getPublicArticles() { return readPublicArticles() }

export async function getPublicArticle(slug: string) {
  return (await readPublicArticles(slug))[0] || null
}
