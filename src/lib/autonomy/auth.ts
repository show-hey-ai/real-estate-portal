import { timingSafeEqual } from 'node:crypto'

export function hasSchedulerAuthorization(header: string | null, configuredSecret = process.env.AUTONOMY_CRON_SECRET): boolean {
  if (!configuredSecret || configuredSecret.length < 32 || !header?.startsWith('Bearer ')) return false
  const supplied = Buffer.from(header.slice(7))
  const expected = Buffer.from(configuredSecret)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}
