import { access } from 'node:fs/promises'
import { prisma } from '../db'
import { getSiteUrl } from '../site-config'
import { AUTONOMY_VERSION, PORTAL_VENTURE_ID } from './policy'
import { submitSitemap } from './search-console'

/**
 * Once a Tokyo day the worker resubmits sitemap.xml to Search Console, so Google fetches new pages
 * and listings sooner. Needs "Full" permission for the service account; while it is still read-only
 * Google answers 403 and the worker tries again an hour later.
 */

const DEFAULT_SITE = 'sc-domain:ziyou-fudosan.com'
const RETRY_AFTER_MS = 3600_000
let lastFailureAt = 0

const tokyoDay = (now: Date) => new Date(now.getTime() + 9 * 3600_000).toISOString().slice(0, 10)

export async function runSitemapSubmit(now = new Date(), env: Record<string, string | undefined> = process.env) {
  const keyPath = env.GSC_SERVICE_ACCOUNT_FILE
  if (!keyPath || !(await access(keyPath).then(() => true, () => false))) return { state: 'not_configured' as const }
  const dedupeKey = `gsc:sitemap-submit:${tokyoDay(now)}`
  if (await prisma.autonomyRecord.findUnique({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey } } })) return { state: 'current' as const }
  if (now.getTime() - lastFailureAt < RETRY_AFTER_MS) return { state: 'waiting' as const }
  const sitemapUrl = `${getSiteUrl().replace(/\/$/, '')}/sitemap.xml`
  const status = await submitSitemap(keyPath, env.GSC_SITE_URL || DEFAULT_SITE, sitemapUrl)
  if (status === 200 || status === 204) {
    await prisma.autonomyRecord.create({
      data: {
        ventureId: PORTAL_VENTURE_ID, dedupeKey, recordType: 'sitemap_submission', title: 'Sitemap resubmitted to Search Console',
        content: { status, sitemapUrl }, sources: ['search_console'], verification: 'verified', version: AUTONOMY_VERSION,
      },
    })
    return { state: 'submitted' as const, status }
  }
  lastFailureAt = now.getTime()
  return { state: status === 403 ? ('forbidden' as const) : ('rejected' as const), status }
}
