import { createSign } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'

// Read-only Search Console access with a service account key kept outside the repository.
// The key is never logged or stored; only the short-lived access token is used in memory.

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REQUEST_TIMEOUT_MS = 20_000

const serviceAccountSchema = z.object({ client_email: z.string().email(), private_key: z.string().min(100) }).passthrough()

export interface SearchRow {
  keys: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}

function base64url(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

async function getAccessToken(keyPath: string): Promise<string> {
  const account = serviceAccountSchema.parse(JSON.parse(await readFile(keyPath, 'utf8')))
  const issuedAt = Math.floor(Date.now() / 1000)
  const unsigned = `${base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${base64url(JSON.stringify({
    iss: account.client_email, scope: SCOPE, aud: TOKEN_URL, iat: issuedAt, exp: issuedAt + 3600,
  }))}`
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key)
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${base64url(signature)}` }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Search Console authorisation failed (HTTP ${response.status}).`)
  const token = z.object({ access_token: z.string().min(10) }).parse(await response.json())
  return token.access_token
}

export interface SearchQuery {
  siteUrl: string
  startDate: string
  endDate: string
  dimensions: ('page' | 'query' | 'date' | 'device' | 'country')[]
  pageContains?: string
  rowLimit?: number
}

const responseSchema = z.object({
  rows: z.array(z.object({ keys: z.array(z.string()), clicks: z.number(), impressions: z.number(), ctr: z.number(), position: z.number() })).optional(),
})

export async function querySearchAnalytics(keyPath: string, query: SearchQuery): Promise<SearchRow[]> {
  const token = await getAccessToken(keyPath)
  const body = {
    startDate: query.startDate,
    endDate: query.endDate,
    dimensions: query.dimensions,
    rowLimit: Math.min(query.rowLimit ?? 1000, 25_000),
    ...(query.pageContains ? { dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: query.pageContains }] }] } : {}),
  }
  const response = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(query.siteUrl)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`Search Console query failed (HTTP ${response.status}).`)
  return responseSchema.parse(await response.json()).rows ?? []
}
