/**
 * Uptime check (every 10 minutes, LaunchAgent com.ziyou.portal-uptime). Opens the home page and the
 * property list; when either fails twice in a row it mails the owner, repeats every few hours while
 * the site stays down, and mails once more when it is back. Needs no database.
 *
 *   npm run ops:uptime [-- --dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as wait } from 'node:timers/promises'
import { INITIAL_UPTIME_STATE, UPTIME_PATHS, isHealthy, nextUptimeState, type CheckResult, type UptimeState } from '../src/lib/ops-watch'
import { sendOperatorMailDirect } from '../src/lib/autonomy/operator-mail'
import { getSiteUrl } from '../src/lib/site-config'

const STATE = process.env.UPTIME_STATE_FILE ?? join(homedir(), 'Library/Application Support/Ziyou Portal/autonomy/uptime-state.json')
const TIMEOUT_MS = 20_000
const RETRY_DELAY_MS = 30_000
const dryRun = process.argv.includes('--dry-run')

async function check(siteUrl: string): Promise<CheckResult[]> {
  return Promise.all(UPTIME_PATHS.map(async (path) => {
    try {
      const response = await fetch(`${siteUrl}${path}`, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'ZiyouUptimeBot/1.0' }, cache: 'no-store' })
      await response.arrayBuffer()
      return { path, status: response.status }
    } catch (error: unknown) {
      return { path, status: null, error: error instanceof Error && error.name === 'TimeoutError' ? '20秒以内に応答なし' : '接続できない' }
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
  let results = await check(siteUrl)
  // One failed look can be a blip; only a second failure counts.
  if (!isHealthy(results)) {
    await wait(RETRY_DELAY_MS)
    results = await check(siteUrl)
  }
  const prev = await readState()
  const { state, mail } = nextUptimeState(prev, results, new Date(), siteUrl)
  if (mail) {
    if (dryRun) console.log(`[dry-run] ${mail.subject}\n${mail.text}`)
    else console.log('mail', (await sendOperatorMailDirect(mail.subject, mail.text)).state)
  }
  if (!dryRun) await writeFile(STATE, `${JSON.stringify(state)}\n`, { mode: 0o600 })
  console.log(`uptime ${new Date().toISOString()}: ${results.map((result) => `${result.path}=${result.status ?? result.error}`).join(' ')}`)
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
