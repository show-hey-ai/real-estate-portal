/**
 * How many visitors reach a listing page and how many then tap a contact button, from the
 * site's own visit events. Shown in portal:status so the operator sees whether the contact
 * blocks are being seen but not used, or not seen at all.
 */

export interface VisitRow {
  visitorId: string
  pageType: string
  referrerHost: string | null
  occurredAt: Date
}

export interface ContactFunnel {
  days: number
  visitors: number
  listingViews: number
  listingViewers: number
  contactClicks: number
  contactClickers: number
  /** External referrer hosts by visit count, most first. */
  referrers: [string, number][]
}

const DAY_MS = 864e5
const OWN_HOSTS = new Set(['portal.ziyou-fudosan.com', 'localhost', '127.0.0.1'])
const REFERRER_LIMIT = 5

export function contactFunnel(rows: VisitRow[], now: Date, days: number): ContactFunnel {
  const since = now.getTime() - days * DAY_MS
  const inWindow = rows.filter((row) => row.occurredAt.getTime() >= since)
  const visitors = (rows: VisitRow[]) => new Set(rows.map((row) => row.visitorId)).size
  const views = inWindow.filter((row) => row.pageType === 'listing_detail')
  const clicks = inWindow.filter((row) => row.pageType === 'contact_click')
  const referrers = inWindow.reduce<Record<string, number>>((acc, row) => {
    if (!row.referrerHost || OWN_HOSTS.has(row.referrerHost)) return acc
    return { ...acc, [row.referrerHost]: (acc[row.referrerHost] ?? 0) + 1 }
  }, {})
  return {
    days,
    visitors: visitors(inWindow),
    listingViews: views.length,
    listingViewers: visitors(views),
    contactClicks: clicks.length,
    contactClickers: visitors(clicks),
    referrers: Object.entries(referrers).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, REFERRER_LIMIT),
  }
}

function describe(funnel: ContactFunnel): string {
  const rate = funnel.listingViewers ? Math.round((funnel.contactClickers / funnel.listingViewers) * 100) : 0
  const referrers = funnel.referrers.map(([host, count]) => `${host}=${count}`).join(' ') || 'none'
  return `visits ${funnel.days}d: visitors ${funnel.visitors}, listing viewers ${funnel.listingViewers} (${funnel.listingViews} views), contact clicks ${funnel.contactClicks} by ${funnel.contactClickers} (${rate}% of listing viewers); referrers ${referrers}`
}

/** One line for the last 7 days and one for the last 30. */
export function funnelLines(rows: VisitRow[], now: Date): string[] {
  return [7, 30].map((days) => describe(contactFunnel(rows, now, days)))
}
