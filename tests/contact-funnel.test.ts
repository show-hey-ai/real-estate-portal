import assert from 'node:assert/strict'
import test from 'node:test'
import { contactFunnel, funnelLines, type VisitRow } from '../src/lib/contact-funnel'

const day = 864e5
const now = new Date('2026-10-23T00:00:00Z')
const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * day)

const rows: VisitRow[] = [
  { visitorId: 'a', pageType: 'home', referrerHost: 'google.com', occurredAt: at(1) },
  { visitorId: 'a', pageType: 'listing_detail', referrerHost: null, occurredAt: at(1) },
  { visitorId: 'a', pageType: 'contact_click', referrerHost: null, occurredAt: at(1) },
  { visitorId: 'b', pageType: 'listing_detail', referrerHost: 'search.yahoo.co.jp', occurredAt: at(3) },
  { visitorId: 'b', pageType: 'listing_detail', referrerHost: null, occurredAt: at(3) },
  { visitorId: 'c', pageType: 'listing_index', referrerHost: 'google.com', occurredAt: at(10) },
  { visitorId: 'c', pageType: 'listing_detail', referrerHost: null, occurredAt: at(10) },
  { visitorId: 'd', pageType: 'other', referrerHost: 'portal.ziyou-fudosan.com', occurredAt: at(20) },
]

test('the funnel counts visitors, listing views and contact clicks inside the window', () => {
  const week = contactFunnel(rows, now, 7)
  assert.equal(week.visitors, 2)
  assert.equal(week.listingViews, 3)
  assert.equal(week.listingViewers, 2)
  assert.equal(week.contactClicks, 1)
  assert.equal(week.contactClickers, 1)
  const month = contactFunnel(rows, now, 30)
  assert.equal(month.visitors, 4)
  assert.equal(month.listingViewers, 3)
  assert.equal(month.contactClicks, 1)
})

test('referrers leave out the site itself and count visits', () => {
  const month = contactFunnel(rows, now, 30)
  assert.deepEqual(month.referrers, [['google.com', 2], ['search.yahoo.co.jp', 1]])
})

test('the status lines read as one line per window with the click rate', () => {
  const lines = funnelLines(rows, now)
  assert.equal(lines.length, 2)
  assert.match(lines[0], /^visits 7d: visitors 2, listing viewers 2 \(3 views\), contact clicks 1 by 1 \(50% of listing viewers\)/)
  assert.match(lines[1], /^visits 30d: visitors 4/)
  assert.match(lines[1], /referrers google.com=2 search.yahoo.co.jp=1/)
})

test('an empty window shows zero without dividing by zero', () => {
  const lines = funnelLines([], now)
  assert.match(lines[0], /contact clicks 0 by 0 \(0% of listing viewers\)/)
  assert.match(lines[0], /referrers none/)
})
