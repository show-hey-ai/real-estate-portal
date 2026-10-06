/**
 * IndexNow tells Bing (and through it ChatGPT search and DuckDuckGo), Yandex, Naver and Seznam
 * which public URLs changed. The key is public by design and is served from the site root.
 */

export const INDEXNOW_KEY = '25805740a4583e04178958d74733ce35'
const ENDPOINT = 'https://api.indexnow.org/indexnow'
const MAX_URLS_PER_REQUEST = 10_000
const TIMEOUT_MS = 10_000

export interface IndexNowPayload {
  host: string
  key: string
  keyLocation: string
  urlList: string[]
}

export function buildIndexNowPayload(siteUrl: string, urls: string[]): IndexNowPayload {
  const origin = new URL(siteUrl).origin
  const host = new URL(siteUrl).host
  const own = [...new Set(urls.filter((url) => { try { return new URL(url).host === host } catch { return false } }))]
  return { host, key: INDEXNOW_KEY, keyLocation: `${origin}/${INDEXNOW_KEY}.txt`, urlList: own.slice(0, MAX_URLS_PER_REQUEST) }
}

/** Returns the HTTP status; 200 and 202 mean accepted. */
export async function submitIndexNow(payload: IndexNowPayload): Promise<number> {
  if (!payload.urlList.length) return 204
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  return response.status
}

/** Sitemap URLs whose lastmod is after `since` (all of them when there was no earlier submission). */
export function changedSitemapUrls(xml: string, since: Date | null): string[] {
  const entries = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => ({
    loc: match[1].match(/<loc>([^<]+)<\/loc>/)?.[1]?.replace(/&amp;/g, '&') ?? null,
    lastmod: match[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] ?? null,
  }))
  return entries
    .filter((entry): entry is { loc: string; lastmod: string | null } => entry.loc !== null)
    .filter((entry) => !since || !entry.lastmod || new Date(entry.lastmod).getTime() > since.getTime())
    .map((entry) => entry.loc)
}
