import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAlertMail, buildDigestMail, digestKey, isDigestDue, normalizeAppPassword, rankListingInterest, readNotificationConfig, type NotificationSnapshot } from '../src/lib/autonomy/notification-policy'

const now = new Date('2026-10-06T23:30:00Z') // 08:30 JST on 7 Oct
const site = 'https://portal.example.com'

function snapshot(overrides: Partial<NotificationSnapshot> = {}): NotificationSnapshot {
  return {
    now,
    leads: [],
    buyerMessages: [],
    expiringListings: [],
    failedJobs: [],
    metrics: { published: 26, drafts: 3, pageViews: 67, visitors: 11, contactClicks: 2, inquiries: 1 },
    ...overrides,
  }
}

test('no alert mail is built when nothing needs attention', () => {
  assert.equal(buildAlertMail(snapshot(), site), null)
})

test('alert mail groups every item, links to admin screens and carries one dedupe key per item', () => {
  const mail = buildAlertMail(snapshot({
    leads: [{ id: 'lead-1', listingId: 'listing-1' }],
    buyerMessages: [{ id: 'message-1', roomId: 'room-1' }, { id: 'message-2', roomId: 'room-1' }],
    expiringListings: [{ id: 'listing-2', label: '台東区 5,980万円', validUntil: new Date('2026-10-07T01:05:30Z') }],
    failedJobs: [{ id: 'job-1', kind: 'reins_intake', status: 'failed' }],
  }), site)
  assert.ok(mail)
  assert.match(mail.subject, /対応/)
  assert.match(mail.text, /新しい問い合わせ: 1件/)
  assert.match(mail.text, /買主からのチャット: 2件（1件の会話）/)
  assert.match(mail.text, /台東区 5,980万円/)
  assert.match(mail.text, /10\/7 10:05/)
  assert.match(mail.text, /reins_intake/)
  assert.ok(mail.text.includes(`${site}/admin/leads`))
  assert.ok(mail.text.includes(`${site}/admin/chats`))
  assert.ok(mail.text.includes(`${site}/admin/listings/listing-2/review`))
  assert.deepEqual(mail.keys.sort(), [
    'notify:chat:message-1', 'notify:chat:message-2',
    `notify:expiry:listing-2:${new Date('2026-10-07T01:05:30Z').toISOString()}`,
    'notify:job:job-1:failed', 'notify:lead:lead-1',
  ].sort())
})

test('alert mail never includes buyer contact details or message bodies', () => {
  const mail = buildAlertMail(snapshot({ leads: [{ id: 'lead-1', listingId: 'listing-1' }], buyerMessages: [{ id: 'm', roomId: 'r' }] }), site)
  assert.ok(mail)
  assert.doesNotMatch(mail.text, /@|電話|whatsapp/i)
})

test('the daily digest is due once per Tokyo day after 08:00 JST', () => {
  assert.equal(isDigestDue(new Date('2026-10-06T22:59:00Z')), false) // 07:59 JST
  assert.equal(isDigestDue(new Date('2026-10-06T23:00:00Z')), true) // 08:00 JST
  assert.equal(digestKey(new Date('2026-10-06T23:00:00Z')), 'notify:digest:2026-10-07')
  assert.equal(digestKey(new Date('2026-10-07T14:59:00Z')), 'notify:digest:2026-10-07')
})

test('the digest summarises supply, demand and items needing attention', () => {
  const mail = buildDigestMail(snapshot({ expiringListings: [{ id: 'l', label: '豊島区', validUntil: new Date('2026-10-07T01:35:00Z') }] }), site)
  assert.match(mail.subject, /2026\/10\/7/)
  assert.match(mail.text, /公開中: 26件/)
  assert.match(mail.text, /下書き: 3件/)
  assert.match(mail.text, /PV 67/)
  assert.match(mail.text, /問い合わせ 1件/)
  assert.match(mail.text, /12時間以内に掲載期限: 1件/)
  assert.deepEqual(mail.keys, ['notify:digest:2026-10-07'])
})

test('the digest reports Google Search results and the top improvement candidates when available', () => {
  const mail = buildDigestMail(snapshot({
    search: {
      window: { startDate: '2026-09-07', endDate: '2026-10-04' },
      summary: { impressions: 150, clicks: 1, ctr: 1 / 150, position: 22.2 },
      opportunities: [{ path: '/guides/tokyo-cap-rate-guide', impressions: 18, clicks: 0, position: 10.9, reason: 'near_first_page', topQueries: ['tokyo cap rate'] }],
    },
  }), site)
  assert.match(mail.text, /Google検索（9\/7〜10\/4）: 表示 150 \/ クリック 1 \/ 平均順位 22\.2/)
  assert.match(mail.text, /1ページ目まであと少し/)
  assert.match(mail.text, /\/guides\/tokyo-cap-rate-guide/)
  assert.match(mail.text, /tokyo cap rate/)
})

test('mail settings are optional and incomplete settings disable sending', () => {
  assert.equal(readNotificationConfig({}), null)
  assert.equal(readNotificationConfig({ NOTIFY_EMAIL_TO: 'a@example.com', SMTP_USER: 'u' }), null)
  assert.deepEqual(readNotificationConfig({ NOTIFY_EMAIL_TO: 'a@example.com', SMTP_USER: 'u@example.com', SMTP_PASS: 'p' }), {
    to: 'a@example.com', from: 'u@example.com', host: 'smtp.gmail.com', port: 465, user: 'u@example.com', pass: 'p',
  })
})

test('a pasted Gmail app password is normalised: spaces and line breaks are ignored', () => {
  assert.equal(normalizeAppPassword(' abcd efgh ijkl mnop \n'), 'abcdefghijklmnop')
  assert.equal(normalizeAppPassword('   \n'), '')
})

test('the digest warns when Google has not read the sitemap and reports index coverage', () => {
  const base = {
    window: { startDate: '2026-09-07', endDate: '2026-10-04' },
    summary: { impressions: 44, clicks: 0, ctr: 0, position: 17.5 },
    opportunities: [],
  }
  const unread = buildDigestMail(snapshot({ search: { ...base, sitemap: { submitted: true, lastDownloaded: null, errors: 0, warnings: 0 }, index: { indexed: 6, total: 48, missing: [] } } }), site)
  assert.match(unread.text, /Google登録: 6\/48ページ/)
  assert.match(unread.text, /サイトマップ: 未読込/)
  const read = buildDigestMail(snapshot({ search: { ...base, sitemap: { submitted: true, lastDownloaded: '2026-10-07T03:00:00Z', errors: 0, warnings: 0 }, index: { indexed: 30, total: 48, missing: [] } } }), site)
  assert.match(read.text, /サイトマップ: 10\/7 12:00 読込/)
})

test('the digest lists the listings people viewed and asked about, with the contact channels', () => {
  const mail = buildDigestMail(snapshot({
    listingInterest: [
      { id: 'l1', label: '港区 5,980万円', views: 7, clicks: { whatsapp: 2, phone: 1 } },
      { id: 'l2', label: '豊島区 6,580万円', views: 3, clicks: {} },
    ],
  }), site)
  assert.match(mail.text, /直近24時間の反応/)
  assert.match(mail.text, /港区 5,980万円：閲覧7・相談クリック3（WhatsApp 2・電話 1）/)
  assert.match(mail.text, /豊島区 6,580万円：閲覧3/)
  assert.ok(mail.text.includes(`${site}/listings/l1`))
})

test('ranking listing interest puts contact clicks ahead of views', () => {
  const ranked = rankListingInterest([
    { listingId: 'a', pageType: 'listing_detail', channel: null },
    { listingId: 'a', pageType: 'listing_detail', channel: null },
    { listingId: 'b', pageType: 'listing_detail', channel: null },
    { listingId: 'b', pageType: 'contact_click', channel: 'whatsapp' },
    { listingId: null, pageType: 'listing_detail', channel: null },
  ], 5)
  assert.deepEqual(ranked, [
    { id: 'b', views: 1, clicks: { whatsapp: 1 } },
    { id: 'a', views: 2, clicks: {} },
  ])
})

test('listings hidden by an expired check raise one alert each, with their own dedupe key', () => {
  const mail = buildAlertMail(snapshot({ expiredListings: [{ id: 'listing-9', label: '文京区 8,999万円', validUntil: new Date('2026-10-07T01:05:30Z') }] }), site)
  assert.ok(mail?.text.includes('掲載期限が切れて非表示になった物件: 1件'))
  assert.ok(mail?.text.includes('/admin/listings/listing-9/review'))
  assert.deepEqual(mail?.keys, ['notify:expired:listing-9:2026-10-07T01:05:30.000Z'])
})

test('the digest shows whether the light and full re-checks are running', () => {
  const freshness = { managed: 30, earliestExpiry: new Date('2026-10-08T01:54:48Z'), lastLightCheck: { at: new Date('2026-10-07T22:02:00Z'), extended: 29, hidden: 1 }, lastFullCheck: new Date('2026-10-07T01:40:00Z') }
  const text = buildDigestMail(snapshot({ freshness }), site).text
  assert.ok(text.includes('■ 再確認: 自動掲載 30件 / 最も早い期限 10/8 10:54'))
  assert.ok(text.includes('- 最後の軽い再確認: 10/8 7:02（延長29件・非表示1件）'))
  assert.ok(text.includes('- 最後の全面確認: 10/7 10:40'))
  const never = buildDigestMail(snapshot({ freshness: { ...freshness, lastLightCheck: null } }), site).text
  assert.ok(never.includes('最後の軽い再確認: まだ実行されていません'))
})

test('LINE and WeChat clicks count in the listing interest summary', () => {
  const ranked = rankListingInterest([{ listingId: 'a', pageType: 'contact_click', channel: 'line' }, { listingId: 'a', pageType: 'contact_click', channel: 'wechat' }, { listingId: 'b', pageType: 'listing_detail', channel: null }], 5)
  assert.deepEqual(ranked[0], { id: 'a', views: 0, clicks: { line: 1, wechat: 1 } })
  const text = buildDigestMail(snapshot({ listingInterest: [{ ...ranked[0], label: '港区 6,180万円' }] }), site).text
  assert.ok(text.includes('相談クリック2（LINE 1・WeChat 1）'))
})

test('the digest reports new-listing email subscribers', () => {
  const text = buildDigestMail(snapshot({ alerts: { active: 5, newActive: 2, pending: 1 } }), site).text
  assert.ok(text.includes('■ 新着メール登録: 5人（24時間で+2） / 確認待ち 1人'))
  assert.ok(buildDigestMail(snapshot({ alerts: { active: 0, newActive: 0, pending: 0 } }), site).text.includes('■ 新着メール登録: 0人'))
})
