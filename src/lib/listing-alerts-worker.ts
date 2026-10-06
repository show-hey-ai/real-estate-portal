import nodemailer from 'nodemailer'
import { prisma } from './db'
import { readNotificationConfig } from './autonomy/notification-policy'
import { withPasswordFile } from './autonomy/notifications'
import { getPublicListingRows } from './public-listing-cards'
import { parseDbTimestamp } from './db-timestamp'
import { formatPrice } from './format'
import { localizedPath } from './locale-url'
import { absoluteUrl, buildListingHeading } from './site-config'
import { buildConfirmMail, buildDigestMail, matchesCriteria, type AlertCriteria } from './listing-alerts'

/** Sent by the Mac worker every few minutes: confirmation mails, then weekly digests that are due. */

const DIGEST_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000
const MAX_CONFIRMATIONS_PER_RUN = 50
const MAX_ITEMS_PER_DIGEST = 20
const OPERATOR_MAILBOX = 'admin@ziyou-fudosan.com'

function tokenUrl(path: string, token: string, locale: string): string {
  const lang = locale === 'en' ? '' : `&lang=${encodeURIComponent(locale)}`
  return `${absoluteUrl(path)}?token=${encodeURIComponent(token)}${lang}`
}

export async function runListingAlerts(now = new Date(), env: Record<string, string | undefined> = process.env) {
  const config = readNotificationConfig(await withPasswordFile(env))
  if (!config) return { state: 'not_configured' as const }
  const transport = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.pass } })
  const send = (to: string, subject: string, text: string, unsubscribeUrl?: string) => transport.sendMail({
    from: config.from, to, subject, text,
    ...(unsubscribeUrl ? { list: { unsubscribe: [{ url: unsubscribeUrl.replace('/alerts/unsubscribe', '/api/alerts/unsubscribe'), comment: 'Unsubscribe' }, `${OPERATOR_MAILBOX}?subject=unsubscribe`] }, headers: { 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
  })

  let confirmations = 0
  const pending = await prisma.listingAlertSubscription.findMany({ where: { status: 'pending', confirmationSentAt: null }, orderBy: { createdAt: 'asc' }, take: MAX_CONFIRMATIONS_PER_RUN })
  for (const subscription of pending) {
    const mail = buildConfirmMail(subscription.locale, subscription.criteria as AlertCriteria, tokenUrl('/alerts/confirm', subscription.token, subscription.locale))
    await send(subscription.email, mail.subject, mail.text)
    await prisma.listingAlertSubscription.update({ where: { id: subscription.id }, data: { confirmationSentAt: now } })
    confirmations += 1
  }

  const active = await prisma.listingAlertSubscription.findMany({ where: { status: 'active', confirmedAt: { not: null } } })
  const due = active.filter((subscription) => now.getTime() - (subscription.lastDigestAt ?? subscription.confirmedAt!).getTime() >= DIGEST_INTERVAL_MS)
  let digests = 0
  if (due.length) {
    const rows = await getPublicListingRows()
    for (const subscription of due) {
      const since = subscription.lastDigestAt ?? subscription.confirmedAt!
      const criteria = subscription.criteria as AlertCriteria
      const fresh = rows
        .filter((row) => (parseDbTimestamp(row.publishedAt)?.getTime() ?? 0) > since.getTime() && matchesCriteria(criteria, row))
        .slice(0, MAX_ITEMS_PER_DIGEST)
      if (fresh.length) {
        const items = fresh.map((row) => ({
          title: buildListingHeading(row, subscription.locale),
          price: row.price ? formatPrice(BigInt(row.price), subscription.locale) : '',
          url: absoluteUrl(localizedPath(`/listings/${row.id}`, subscription.locale)),
        }))
        const unsubscribeUrl = tokenUrl('/alerts/unsubscribe', subscription.token, subscription.locale)
        const mail = buildDigestMail(subscription.locale, criteria, items, unsubscribeUrl)
        await send(subscription.email, mail.subject, mail.text, unsubscribeUrl)
        digests += 1
      }
      // The window moves on even without new listings, so nothing is sent twice.
      await prisma.listingAlertSubscription.update({ where: { id: subscription.id }, data: { lastDigestAt: now } })
    }
  }
  return { state: 'ok' as const, confirmations, digests, due: due.length }
}
