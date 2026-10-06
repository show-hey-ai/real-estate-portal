import type { SearchRow } from './search-console'

// Fixed, explainable rules for turning Search Console rows into improvement candidates.
// Candidates are proposals for title/description work; nothing is changed automatically.

const MIN_IMPRESSIONS = 10
const MAX_OPPORTUNITIES = 5
const SEARCH_DATA_LAG_DAYS = 3
const SEARCH_WINDOW_DAYS = 28
const JST_OFFSET_MS = 9 * 3600_000
const DAY_MS = 24 * 3600_000

export type OpportunityReason = 'near_first_page' | 'low_ctr'

export interface SearchSummary {
  impressions: number
  clicks: number
  ctr: number
  position: number | null
}

export interface SearchOpportunity {
  path: string
  impressions: number
  clicks: number
  position: number
  reason: OpportunityReason
  topQueries: string[]
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function searchWindow(now: Date): { startDate: string; endDate: string } {
  const tokyoMidnight = new Date(Math.floor((now.getTime() + JST_OFFSET_MS) / DAY_MS) * DAY_MS)
  const end = new Date(tokyoMidnight.getTime() - SEARCH_DATA_LAG_DAYS * DAY_MS)
  const start = new Date(end.getTime() - (SEARCH_WINDOW_DAYS - 1) * DAY_MS)
  return { startDate: isoDate(start), endDate: isoDate(end) }
}

export function summarizeSearch(pages: SearchRow[]): SearchSummary {
  const impressions = pages.reduce((sum, page) => sum + page.impressions, 0)
  const clicks = pages.reduce((sum, page) => sum + page.clicks, 0)
  const weighted = pages.reduce((sum, page) => sum + page.position * page.impressions, 0)
  return {
    impressions,
    clicks,
    ctr: impressions ? clicks / impressions : 0,
    position: impressions ? Math.round((weighted / impressions) * 10) / 10 : null,
  }
}

// Conservative expected CTR by average position; below half of it counts as weak.
function expectedCtr(position: number): number {
  if (position <= 1.5) return 0.25
  if (position <= 3) return 0.12
  if (position <= 5) return 0.06
  return 0.025
}

function reasonFor(page: SearchRow): OpportunityReason | null {
  if (page.impressions < MIN_IMPRESSIONS) return null
  if (page.position > 10 && page.position <= 20) return 'near_first_page'
  if (page.position <= 10 && page.ctr < expectedCtr(page.position) / 2) return 'low_ctr'
  return null
}

export function findSearchOpportunities(pages: SearchRow[], pageQueries: SearchRow[], siteUrl: string): SearchOpportunity[] {
  const origin = siteUrl.replace(/\/$/, '')
  return pages
    .map((page) => ({ page, reason: reasonFor(page) }))
    .filter((item): item is { page: SearchRow; reason: OpportunityReason } => item.reason !== null)
    .sort((left, right) => right.page.impressions - left.page.impressions)
    .slice(0, MAX_OPPORTUNITIES)
    .map(({ page, reason }) => ({
      path: page.keys[0].startsWith(origin) ? page.keys[0].slice(origin.length) || '/' : page.keys[0],
      impressions: page.impressions,
      clicks: page.clicks,
      position: Math.round(page.position * 10) / 10,
      reason,
      topQueries: pageQueries
        .filter((query) => query.keys[0] === page.keys[0])
        .sort((left, right) => right.impressions - left.impressions)
        .slice(0, 3)
        .map((query) => query.keys[1]),
    }))
}

export interface IndexCoverage {
  indexed: number
  total: number
  missing: string[]
}

const MAX_MISSING_LISTED = 10

export function summarizeIndex(states: Record<string, string>, siteUrl: string): IndexCoverage {
  const origin = siteUrl.replace(/\/$/, '')
  const urls = Object.keys(states)
  const missing = urls.filter((url) => states[url] !== 'indexed').map((url) => (url.startsWith(origin) ? url.slice(origin.length) || '/' : url))
  return { indexed: urls.length - missing.length, total: urls.length, missing: missing.slice(0, MAX_MISSING_LISTED) }
}
