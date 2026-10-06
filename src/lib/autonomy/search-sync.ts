import { access } from 'node:fs/promises'
import { prisma } from '../db'
import { getSiteUrl } from '../site-config'
import { AUTONOMY_VERSION, PORTAL_VENTURE_ID } from './policy'
import { querySearchAnalytics } from './search-console'
import { findSearchOpportunities, searchWindow, summarizeSearch, type SearchOpportunity, type SearchSummary } from './search-policy'

export interface SearchPerformance {
  window: { startDate: string; endDate: string }
  summary: SearchSummary
  opportunities: SearchOpportunity[]
}

const DEFAULT_SITE = 'sc-domain:ziyou-fudosan.com'

async function readableFile(path: string | undefined): Promise<string | null> {
  if (!path) return null
  try {
    await access(path)
    return path
  } catch {
    return null
  }
}

// Once per Search Console data day: store a verified snapshot of portal search performance.
export async function runSearchSync(now = new Date(), env: Record<string, string | undefined> = process.env) {
  const keyPath = await readableFile(env.GSC_SERVICE_ACCOUNT_FILE)
  if (!keyPath) return { state: 'not_configured' as const }
  const window = searchWindow(now)
  const dedupeKey = `gsc:performance:${window.endDate}`
  if (await prisma.autonomyRecord.findUnique({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey } } })) {
    return { state: 'current' as const }
  }

  const siteUrl = getSiteUrl()
  const query = { siteUrl: env.GSC_SITE_URL || DEFAULT_SITE, ...window, pageContains: new URL(siteUrl).host }
  const [pages, pageQueries] = await Promise.all([
    querySearchAnalytics(keyPath, { ...query, dimensions: ['page'] }),
    querySearchAnalytics(keyPath, { ...query, dimensions: ['page', 'query'] }),
  ])
  const performance: SearchPerformance = {
    window,
    summary: summarizeSearch(pages),
    opportunities: findSearchOpportunities(pages, pageQueries, siteUrl),
  }
  await prisma.autonomyRecord.create({
    data: {
      ventureId: PORTAL_VENTURE_ID, dedupeKey, recordType: 'search_performance', title: 'Google Search performance (28 days)',
      content: JSON.parse(JSON.stringify(performance)), sources: ['search_console'], verification: 'verified', version: AUTONOMY_VERSION,
    },
  })
  return { state: 'synced' as const, impressions: performance.summary.impressions, opportunities: performance.opportunities.length }
}

export async function latestSearchPerformance(): Promise<SearchPerformance | null> {
  const record = await prisma.autonomyRecord.findFirst({
    where: { ventureId: PORTAL_VENTURE_ID, recordType: 'search_performance', verification: 'verified' },
    orderBy: { createdAt: 'desc' },
  })
  return record ? (record.content as unknown as SearchPerformance) : null
}
