import { readFile } from 'node:fs/promises'
import nodemailer from 'nodemailer'
import { prisma } from '../db'
import { getPublicListingScope } from '../public-listing-scope'
import { getExternalAnalyticsWhere } from '../site-analytics-data'
import { getSiteUrl } from '../site-config'
import { AUTONOMY_VERSION, PORTAL_VENTURE_ID } from './policy'
import { latestSearchPerformance } from './search-sync'
import {
  EXPIRY_WARNING_HOURS, buildAlertMail, rankListingInterest, buildDigestMail, digestKey, isDigestDue, normalizeAppPassword, readNotificationConfig,
  type NotificationConfig, type NotificationMail, type NotificationSnapshot,
} from './notification-policy'

const LOOKBACK_MS = 24 * 3600_000
const MAX_ITEMS = 200

function listingLabel(listing: { city: string | null; addressPublic: string | null; price: bigint | null }): string {
  const place = listing.addressPublic || listing.city || '所在地未設定'
  const price = listing.price ? `${Math.round(Number(listing.price) / 10_000).toLocaleString('ja-JP')}万円` : '価格未設定'
  return `${place} ${price}`
}

async function latestObservation() {
  const record = await prisma.autonomyRecord.findFirst({
    where: { ventureId: PORTAL_VENTURE_ID, recordType: 'observation', verification: 'verified' },
    orderBy: { createdAt: 'desc' },
  })
  const content = (record?.content ?? {}) as Record<string, unknown>
  const read = (name: string) => (typeof content[name] === 'number' ? (content[name] as number) : null)
  return { pageViews: read('pageViews'), visitors: read('visitors'), contactClicks: read('contactClicks'), inquiries: read('inquiries') }
}

const INTEREST_LIMIT = 5

/** Expired-and-hidden listings plus the latest light and full re-checks. */
async function listingFreshness(now: Date, since: Date) {
  const [managed, expired, light, full] = await Promise.all([
    prisma.listing.findMany({ where: { status: 'PUBLISHED', autonomyValidUntil: { gt: now } }, select: { autonomyValidUntil: true }, orderBy: { autonomyValidUntil: 'asc' } }),
    prisma.listing.findMany({
      where: { status: { in: ['PUBLISHED', 'ARCHIVED'] }, autonomyValidUntil: { gt: since, lte: now } },
      select: { id: true, city: true, addressPublic: true, price: true, autonomyValidUntil: true },
      orderBy: { autonomyValidUntil: 'asc' },
      take: MAX_ITEMS,
    }),
    prisma.autonomyRecord.findFirst({ where: { ventureId: PORTAL_VENTURE_ID, recordType: 'freshness' }, orderBy: { createdAt: 'desc' } }),
    prisma.autonomyJob.findFirst({ where: { ventureId: PORTAL_VENTURE_ID, kind: 'publication_audit', status: 'succeeded' }, orderBy: { updatedAt: 'desc' }, select: { updatedAt: true } }),
  ])
  const results = ((light?.content as { results?: { action?: string; result?: string }[] } | null)?.results ?? []).filter((item) => item.result === 'applied')
  return {
    expired: expired.map((listing) => ({ id: listing.id, label: listingLabel(listing), validUntil: listing.autonomyValidUntil! })),
    freshness: {
      managed: managed.length,
      earliestExpiry: managed[0]?.autonomyValidUntil ?? null,
      lastLightCheck: light ? { at: light.createdAt, extended: results.filter((item) => item.action === 'extend').length, hidden: results.filter((item) => item.action === 'withdraw').length } : null,
      lastFullCheck: full?.updatedAt ?? null,
    },
  }
}

async function listingInterest(since: Date) {
  const audience = await getExternalAnalyticsWhere()
  const events = await prisma.siteVisitEvent.findMany({
    where: { ...audience, occurredAt: { gte: since }, listingId: { not: null }, pageType: { in: ['listing_detail', 'contact_click'] } },
    select: { listingId: true, pageType: true, queryString: true },
    take: 5000,
  })
  const ranked = rankListingInterest(events.map((event) => ({ listingId: event.listingId, pageType: event.pageType, channel: new URLSearchParams(event.queryString ?? '').get('channel') })), INTEREST_LIMIT)
  const listings = await prisma.listing.findMany({ where: { id: { in: ranked.map((item) => item.id) } }, select: { id: true, city: true, addressPublic: true, price: true } })
  return ranked.flatMap((item) => {
    const listing = listings.find((row) => row.id === item.id)
    return listing ? [{ ...item, label: listingLabel(listing) }] : []
  })
}

export async function collectSnapshot(now = new Date()): Promise<NotificationSnapshot> {
  const since = new Date(now.getTime() - LOOKBACK_MS)
  const expiryLimit = new Date(now.getTime() + EXPIRY_WARNING_HOURS * 3600_000)
  const [leads, messages, expiring, failedJobs, published, drafts, observation, search, interest, freshness, alertsActive, alertsNew, alertsPending] = await Promise.all([
    prisma.lead.findMany({ where: { createdAt: { gte: since } }, select: { id: true, listingId: true }, take: MAX_ITEMS }),
    prisma.propertyChatMessage.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, roomId: true, senderSubject: true, room: { select: { buyerSubject: true } } },
      take: MAX_ITEMS,
    }),
    prisma.listing.findMany({
      where: { status: 'PUBLISHED', autonomyValidUntil: { gt: now, lte: expiryLimit } },
      select: { id: true, city: true, addressPublic: true, price: true, autonomyValidUntil: true },
      orderBy: { autonomyValidUntil: 'asc' },
      take: MAX_ITEMS,
    }),
    prisma.autonomyJob.findMany({
      where: { ventureId: PORTAL_VENTURE_ID, status: { in: ['failed', 'needs_reconciliation'] }, updatedAt: { gte: since } },
      select: { id: true, kind: true, status: true },
      take: MAX_ITEMS,
    }),
    prisma.listing.count({ where: getPublicListingScope() }),
    prisma.listing.count({ where: { status: 'DRAFT' } }),
    latestObservation(),
    latestSearchPerformance(),
    listingInterest(since),
    listingFreshness(now, since),
    prisma.listingAlertSubscription.count({ where: { status: 'active' } }),
    prisma.listingAlertSubscription.count({ where: { status: 'active', confirmedAt: { gte: since } } }),
    prisma.listingAlertSubscription.count({ where: { status: 'pending' } }),
  ])
  return {
    now,
    leads,
    buyerMessages: messages.filter((message) => message.senderSubject === message.room.buyerSubject).map(({ id, roomId }) => ({ id, roomId })),
    expiringListings: expiring.map((listing) => ({ id: listing.id, label: listingLabel(listing), validUntil: listing.autonomyValidUntil! })),
    expiredListings: freshness.expired,
    alerts: { active: alertsActive, newActive: alertsNew, pending: alertsPending },
    freshness: freshness.freshness,
    failedJobs,
    metrics: { published, drafts, ...observation },
    search,
    listingInterest: interest,
  }
}

async function alreadySent(keys: string[]): Promise<Set<string>> {
  if (!keys.length) return new Set()
  const rows = await prisma.autonomyRecord.findMany({
    where: { ventureId: PORTAL_VENTURE_ID, dedupeKey: { in: keys } },
    select: { dedupeKey: true },
  })
  return new Set(rows.map((row) => row.dedupeKey))
}

// Instant alerts cover buyers only; everything else is in the morning digest.
function withoutSent(snapshot: NotificationSnapshot, sent: Set<string>): NotificationSnapshot {
  return {
    ...snapshot,
    leads: snapshot.leads.filter((lead) => !sent.has(`notify:lead:${lead.id}`)),
    buyerMessages: snapshot.buyerMessages.filter((message) => !sent.has(`notify:chat:${message.id}`)),
  }
}

async function sendAndRecord(config: NotificationConfig, mail: NotificationMail) {
  const transport = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.pass } })
  const info = await transport.sendMail({ from: config.from, to: config.to, subject: mail.subject, text: mail.text })
  // A crash between sending and recording can repeat one mail; it can never drop an alert.
  await prisma.autonomyRecord.createMany({
    data: mail.keys.map((key) => ({
      ventureId: PORTAL_VENTURE_ID, dedupeKey: key, recordType: 'notification', title: mail.subject,
      content: { messageId: info.messageId ?? null }, sources: [], verification: 'verified', version: AUTONOMY_VERSION,
    })),
    skipDuplicates: true,
  })
}

// The app password may live in its own file so it can be pasted without editing the main settings.
export async function withPasswordFile(env: Record<string, string | undefined>): Promise<Record<string, string | undefined>> {
  if (env.SMTP_PASS || !env.SMTP_PASS_FILE) return env
  try {
    return { ...env, SMTP_PASS: normalizeAppPassword(await readFile(env.SMTP_PASS_FILE, 'utf8')) || undefined }
  } catch {
    return env
  }
}

export async function runNotifications(now = new Date(), env: Record<string, string | undefined> = process.env) {
  const config = readNotificationConfig(await withPasswordFile(env))
  if (!config) return { state: 'not_configured' as const }
  const snapshot = await collectSnapshot(now)
  const siteUrl = getSiteUrl()
  const itemKeys = [
    ...snapshot.leads.map((lead) => `notify:lead:${lead.id}`),
    ...snapshot.buyerMessages.map((message) => `notify:chat:${message.id}`),
  ]
  const sent = await alreadySent([...itemKeys, digestKey(now)])
  const result = { state: 'checked' as const, alert: false, digest: false }

  const alert = buildAlertMail(withoutSent(snapshot, sent), siteUrl)
  if (alert) {
    await sendAndRecord(config, alert)
    result.alert = true
  }
  if (isDigestDue(now) && !sent.has(digestKey(now))) {
    await sendAndRecord(config, buildDigestMail(snapshot, siteUrl))
    result.digest = true
  }
  return result
}
