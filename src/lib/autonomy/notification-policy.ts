// Pure notification rules: what needs a person's attention and how it is worded.
// Mails carry counts and admin links only, never buyer contact details or message bodies.

import type { SitemapStatus } from './search-console'
import type { IndexCoverage, SearchOpportunity, SearchSummary } from './search-policy'

export interface NotificationSnapshot {
  search?: { window: { startDate: string; endDate: string }; summary: SearchSummary; opportunities: SearchOpportunity[]; sitemap?: SitemapStatus | null; index?: IndexCoverage | null } | null
  now: Date
  leads: { id: string; listingId: string }[]
  buyerMessages: { id: string; roomId: string }[]
  expiringListings: { id: string; label: string; validUntil: Date }[]
  failedJobs: { id: string; kind: string; status: string }[]
  metrics: { published: number; drafts: number; pageViews: number | null; visitors: number | null; contactClicks: number | null; inquiries: number | null }
}

export interface NotificationMail {
  subject: string
  text: string
  keys: string[]
}

export interface NotificationConfig {
  to: string
  from: string
  host: string
  port: number
  user: string
  pass: string
}

export const EXPIRY_WARNING_HOURS = 12
const DIGEST_HOUR_JST = 8
const JST_OFFSET_MS = 9 * 3600_000

function toTokyo(date: Date): Date {
  return new Date(date.getTime() + JST_OFFSET_MS)
}

function formatTokyoTime(date: Date): string {
  const tokyo = toTokyo(date)
  const minutes = String(tokyo.getUTCMinutes()).padStart(2, '0')
  return `${tokyo.getUTCMonth() + 1}/${tokyo.getUTCDate()} ${tokyo.getUTCHours()}:${minutes}`
}

function tokyoDate(date: Date): { year: number; month: number; day: number } {
  const tokyo = toTokyo(date)
  return { year: tokyo.getUTCFullYear(), month: tokyo.getUTCMonth() + 1, day: tokyo.getUTCDate() }
}

export function digestKey(now: Date): string {
  const { year, month, day } = tokyoDate(now)
  return `notify:digest:${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function isDigestDue(now: Date): boolean {
  return toTokyo(now).getUTCHours() >= DIGEST_HOUR_JST
}

function expiryLines(listings: NotificationSnapshot['expiringListings'], siteUrl: string): string[] {
  return listings.map((listing) => `- ${listing.label}（期限 ${formatTokyoTime(listing.validUntil)}）${siteUrl}/admin/listings/${listing.id}/review`)
}

export function buildAlertMail(snapshot: NotificationSnapshot, siteUrl: string): NotificationMail | null {
  const sections: string[] = []
  const keys: string[] = []

  if (snapshot.leads.length) {
    sections.push(`■ 新しい問い合わせ: ${snapshot.leads.length}件\n${siteUrl}/admin/leads`)
    keys.push(...snapshot.leads.map((lead) => `notify:lead:${lead.id}`))
  }
  if (snapshot.buyerMessages.length) {
    const rooms = new Set(snapshot.buyerMessages.map((message) => message.roomId)).size
    sections.push(`■ 買主からのチャット: ${snapshot.buyerMessages.length}件（${rooms}件の会話）\n${siteUrl}/admin/chats`)
    keys.push(...snapshot.buyerMessages.map((message) => `notify:chat:${message.id}`))
  }
  if (snapshot.expiringListings.length) {
    sections.push([
      `■ ${EXPIRY_WARNING_HOURS}時間以内に掲載期限が切れる物件: ${snapshot.expiringListings.length}件`,
      'REINSで現行情報を再確認しないと、期限後に非表示になります。',
      ...expiryLines(snapshot.expiringListings, siteUrl),
    ].join('\n'))
    keys.push(...snapshot.expiringListings.map((listing) => `notify:expiry:${listing.id}:${listing.validUntil.toISOString()}`))
  }
  if (snapshot.failedJobs.length) {
    sections.push([
      `■ 失敗した自動処理: ${snapshot.failedJobs.length}件`,
      ...snapshot.failedJobs.map((job) => `- ${job.kind}（${job.status === 'needs_reconciliation' ? '有料処理の結果確認が必要' : '再試行の上限に到達'}）`),
      `${siteUrl}/admin/autonomy`,
    ].join('\n'))
    keys.push(...snapshot.failedJobs.map((job) => `notify:job:${job.id}:${job.status}`))
  }

  if (!sections.length) return null
  return {
    subject: '【自由不動産ポータル】対応が必要な項目があります',
    text: [...sections, '', 'このメールはポータルの自動通知です。'].join('\n\n'),
    keys,
  }
}

function count(value: number | null, unit = ''): string {
  return value == null ? '未計測' : `${value}${unit}`
}

const OPPORTUNITY_LABELS: Record<SearchOpportunity['reason'], string> = {
  near_first_page: '1ページ目まであと少し',
  low_ctr: '表示のわりにクリックが少ない',
}

function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-').map(Number)
  return `${month}/${day}`
}

function searchLines(search: NotificationSnapshot['search'], siteUrl: string): string[] {
  if (!search) return []
  const { summary, window } = search
  const sitemap = !search.sitemap ? null
    : !search.sitemap.submitted ? '未送信'
    : search.sitemap.lastDownloaded ? `${formatTokyoTime(new Date(search.sitemap.lastDownloaded))} 読込${search.sitemap.errors ? `・エラー${search.sitemap.errors}件` : ''}`
    : '未読込'
  return [
    ...(search.index ? [`■ Google登録: ${search.index.indexed}/${search.index.total}ページ${sitemap ? `（サイトマップ: ${sitemap}）` : ''}`] : []),
    `■ Google検索（${shortDate(window.startDate)}〜${shortDate(window.endDate)}）: 表示 ${summary.impressions} / クリック ${summary.clicks} / 平均順位 ${summary.position ?? '—'}`,
    ...search.opportunities.slice(0, 3).map((item) =>
      `- 改善候補（${OPPORTUNITY_LABELS[item.reason]}）: ${siteUrl}${item.path} 表示${item.impressions}・順位${item.position}${item.topQueries.length ? `・検索語「${item.topQueries.join('」「')}」` : ''}`),
  ]
}

export function buildDigestMail(snapshot: NotificationSnapshot, siteUrl: string): NotificationMail {
  const { year, month, day } = tokyoDate(snapshot.now)
  const { metrics } = snapshot
  const lines = [
    `■ 物件: 公開中: ${metrics.published}件 / 下書き: ${metrics.drafts}件`,
    `■ 直近7日: PV ${count(metrics.pageViews)} / 訪問者 ${count(metrics.visitors, '人')} / 相談クリック ${count(metrics.contactClicks, '件')} / 問い合わせ ${count(metrics.inquiries, '件')}`,
    `■ ${EXPIRY_WARNING_HOURS}時間以内に掲載期限: ${snapshot.expiringListings.length}件`,
    ...expiryLines(snapshot.expiringListings, siteUrl),
    `■ 失敗した自動処理（24時間）: ${snapshot.failedJobs.length}件`,
    ...searchLines(snapshot.search, siteUrl),
    '',
    `管理画面: ${siteUrl}/admin`,
  ]
  return {
    subject: `【自由不動産ポータル】${year}/${month}/${day} の状況`,
    text: lines.join('\n'),
    keys: [digestKey(snapshot.now)],
  }
}

// Google shows app passwords in groups of four; people paste them with spaces or a trailing newline.
export function normalizeAppPassword(value: string): string {
  return value.replace(/\s+/g, '')
}

export function readNotificationConfig(env: Record<string, string | undefined>): NotificationConfig | null {
  const to = env.NOTIFY_EMAIL_TO?.trim()
  const user = env.SMTP_USER?.trim()
  const pass = env.SMTP_PASS
  if (!to || !user || !pass) return null
  const port = Number(env.SMTP_PORT || 465)
  return {
    to,
    from: env.NOTIFY_EMAIL_FROM?.trim() || user,
    host: env.SMTP_HOST?.trim() || 'smtp.gmail.com',
    port: Number.isSafeInteger(port) && port > 0 ? port : 465,
    user,
    pass,
  }
}
