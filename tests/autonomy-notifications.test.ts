import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAlertMail, buildDigestMail, digestKey, isDigestDue, readNotificationConfig, type NotificationSnapshot } from '../src/lib/autonomy/notification-policy'

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

test('mail settings are optional and incomplete settings disable sending', () => {
  assert.equal(readNotificationConfig({}), null)
  assert.equal(readNotificationConfig({ NOTIFY_EMAIL_TO: 'a@example.com', SMTP_USER: 'u' }), null)
  assert.deepEqual(readNotificationConfig({ NOTIFY_EMAIL_TO: 'a@example.com', SMTP_USER: 'u@example.com', SMTP_PASS: 'p' }), {
    to: 'a@example.com', from: 'u@example.com', host: 'smtp.gmail.com', port: 465, user: 'u@example.com', pass: 'p',
  })
})
