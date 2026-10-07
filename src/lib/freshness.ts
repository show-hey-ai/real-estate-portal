/**
 * How long an automatically published listing stays visible after it was checked against REINS.
 * User decision 2026-10-07: check each listing once a week. A day of grace keeps a listing up
 * when the weekly run is a little late; past that it drops out of the public scope.
 */

const DAY_MS = 24 * 3600_000

export const UPDATE_INTERVAL_DAYS = 7
export const UPDATE_GRACE_MS = DAY_MS
/** Visibility granted by one check: the weekly interval plus the grace day. */
export const CHECK_VALIDITY_MS = UPDATE_INTERVAL_DAYS * DAY_MS + UPDATE_GRACE_MS
/** The original drawing is re-read in full at least this often, and whenever REINS shows a change. */
export const FULL_CHECK_INTERVAL_MS = 30 * DAY_MS

export function validUntilAfterCheck(checkedAt: Date): Date {
  return new Date(checkedAt.getTime() + CHECK_VALIDITY_MS)
}

export interface ListingUpdateDates {
  /** When the information was last confirmed (shown as 情報更新日). */
  updatedOn: Date
  /** When it will be confirmed again (shown as 次回更新予定日); null for manually managed listings. */
  nextUpdateOn: Date | null
}

/**
 * Until 2026-10-07 a check granted 24 hours. Those validities all end before this instant, and
 * a weekly one cannot (the earliest ends 8 days after the switch), so they are told apart here.
 */
const DAILY_SCHEME_ENDS_MS = Date.parse('2026-10-10T00:00:00+09:00')

/** Display dates for a listing, derived without exposing the private validity timestamp itself. */
export function listingUpdateDates(listing: { autonomyValidUntil: Date | null; updatedAt: Date }): ListingUpdateDates {
  if (!listing.autonomyValidUntil) return { updatedOn: listing.updatedAt, nextUpdateOn: null }
  const validUntil = listing.autonomyValidUntil.getTime()
  if (validUntil <= DAILY_SCHEME_ENDS_MS) return { updatedOn: new Date(validUntil - DAY_MS), nextUpdateOn: listing.autonomyValidUntil }
  const nextUpdateOn = new Date(validUntil - UPDATE_GRACE_MS)
  return { updatedOn: new Date(nextUpdateOn.getTime() - UPDATE_INTERVAL_DAYS * DAY_MS), nextUpdateOn }
}
