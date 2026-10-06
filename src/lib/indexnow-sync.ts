import { prisma } from './db'
import { AUTONOMY_VERSION, PORTAL_VENTURE_ID } from './autonomy/policy'
import { buildIndexNowPayload, changedSitemapUrls, submitIndexNow } from './indexnow'
import { absoluteUrl, getSiteUrl } from './site-config'

/** Once a day the worker submits sitemap URLs whose lastmod changed since the previous submission. */

const RECORD_TYPE = 'indexnow'
const TIMEOUT_MS = 15_000

export async function runIndexNowSync(now = new Date()) {
  const dedupeKey = `${RECORD_TYPE}:${now.toISOString().slice(0, 10)}`
  if (await prisma.autonomyRecord.findUnique({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey } } })) return { state: 'current' as const }
  const previous = await prisma.autonomyRecord.findFirst({ where: { ventureId: PORTAL_VENTURE_ID, recordType: RECORD_TYPE }, orderBy: { createdAt: 'desc' } })
  const response = await fetch(absoluteUrl('/sitemap.xml'), { signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (!response.ok) return { state: 'sitemap_unavailable' as const }
  const urls = changedSitemapUrls(await response.text(), previous?.createdAt ?? null)
  const payload = buildIndexNowPayload(getSiteUrl(), urls)
  const status = await submitIndexNow(payload)
  const accepted = status === 200 || status === 202 || status === 204
  if (accepted) {
    await prisma.autonomyRecord.create({
      data: {
        ventureId: PORTAL_VENTURE_ID, dedupeKey, recordType: RECORD_TYPE, title: `IndexNow: ${payload.urlList.length} URLs`,
        content: { status, submitted: payload.urlList.length }, sources: ['indexnow'], verification: 'verified', version: AUTONOMY_VERSION,
      },
    })
  }
  return { state: accepted ? ('submitted' as const) : ('rejected' as const), status, submitted: payload.urlList.length }
}
