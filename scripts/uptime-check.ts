/**
 * Uptime check (every 10 minutes, LaunchAgent com.ziyou.portal-uptime). Looks at robots.txt (CDN, no
 * function CPU) every run and the home page hourly; when a look fails on two runs in a row it mails
 * the owner, repeats every few hours while the site stays down, and mails once more when it is back.
 * Needs no database.
 *
 *   npm run ops:uptime [-- --dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as wait } from 'node:timers/promises'
import { INITIAL_UPTIME_STATE, UPTIME_LIGHT_PATHS, describeFetchFailure, isHealthy, nextUptimeState, uptimePaths, type CheckResult, type UptimeState } from '../src/lib/ops-watch'
import { sendOperatorMailDirect } from '../src/lib/autonomy/operator-mail'
import { getSiteUrl } from '../src/lib/site-config'

const STATE = process.env.UPTIME_STATE_FILE ?? join(homedir(), 'Library/Application Support/Ziyou Portal/autonomy/uptime-state.json')
const TIMEOUT_MS = 20_000
const RETRY_DELAY_MS = 30_000
const dryRun = process.argv.includes('--dry-run')

async function check(siteUrl: string, paths: readonly string[]): Promise<CheckResult[]> {
  return Promise.all(paths.map(async (path) => {
    try {
      const response = await fetch(`${siteUrl}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'ZiyouUptimeBot/1.0' }, cache: 'no-store' })
      await response.arrayBuffer()
      return { path, status: response.status }
    } catch (error: unknown) {
      return { path, status: null, error: describeFetchFailure(error) }
    }
  }))
}

async function readState(): Promise<UptimeState> {
  try {
    return { ...INITIAL_UPTIME_STATE, ...JSON.parse(await readFile(STATE, 'utf8')) }
  } catch {
    return INITIAL_UPTIME_STATE
  }
}

async function main() {
  const siteUrl = getSiteUrl()
  const prev = await readState()
  const now = new Date()
  let paths = uptimePaths(prev, now)
  let results = await check(siteUrl, paths)
  // One failed look can be a blip; look again, at the app page too, before counting the run as failed.
  if (!isHealthy(results)) {
    await wait(RETRY_DELAY_MS)
    paths = uptimePaths({ ...prev, failedRuns: prev.failedRuns + 1 }, now)
    results = await check(siteUrl, paths)
  }
  const next = nextUptimeState(prev, results, now, siteUrl)
  const mail = next.mail
  const state = { ...next.state, lastFullAt: paths.length > UPTIME_LIGHT_PATHS.length ? now.toISOString() : next.state.lastFullAt }
  if (mail) {
    if (dryRun) console.log(`[dry-run] ${mail.subject}\n${mail.text}`)
    else console.log('mail', (await sendOperatorMailDirect(mail.subject, mail.text)).state)
  }
  if (!dryRun) await writeFile(STATE, `${JSON.stringify(state)}\n`, { mode: 0o600 })
  console.log(`uptime ${new Date().toISOString()}: ${results.map((result) => `${result.path}=${result.status ?? result.error}`).join(' ')}`)
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
