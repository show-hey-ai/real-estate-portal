import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env') })

async function main() {
  // Load the database only after the environment is configured.
  const { runAutonomyTick } = await import('../src/lib/autonomy/runner')
  const { prisma } = await import('../src/lib/db')
  const { reinsIntake, maisokuImport } = await import('../src/lib/autonomy/intake')
  const { runNotifications } = await import('../src/lib/autonomy/notifications')
  const { runSearchSync } = await import('../src/lib/autonomy/search-sync')
  const { runListingAlerts } = await import('../src/lib/listing-alerts-worker')
  const once = process.argv.includes('--once')
  const notificationIntervalMs = 5 * 60_000
  let lastNotificationAt = 0
  let stopped = false
  process.on('SIGTERM', () => { stopped = true })
  process.on('SIGINT', () => { stopped = true })
  try {
    do {
      try { console.log(JSON.stringify(await runAutonomyTick(5, { reins_intake: reinsIntake, maisoku_import: maisokuImport }))) }
      catch { console.error('Autonomy runtime unavailable; the durable queue is retained.') }
      // Notifications run even while the loop is paused: expiring listings and inquiries still need a person.
      if (once || Date.now() - lastNotificationAt >= notificationIntervalMs) {
        lastNotificationAt = Date.now()
        try { console.log(JSON.stringify({ search: await runSearchSync() })) }
        catch (error) { console.error('Search Console sync failed; it will be retried.', error instanceof Error ? error.message : 'unknown error') }
        try { console.log(JSON.stringify({ notifications: await runNotifications() })) }
        catch (error) { console.error('Notification check failed; it will be retried.', error instanceof Error ? error.message : 'unknown error') }
        try { console.log(JSON.stringify({ listingAlerts: await runListingAlerts() })) }
        catch (error) { console.error('Listing alerts failed; they will be retried.', error instanceof Error ? error.message : 'unknown error') }
      }
      if (!once && !stopped) await new Promise((resolveWait) => setTimeout(resolveWait, 30_000))
    } while (!once && !stopped)
  } finally { await prisma.$disconnect() }
}

main().catch(() => { process.exitCode = 1 })
