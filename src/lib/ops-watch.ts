// Uptime alerts and weekly database backups, run on the owner's Mac (LaunchAgents
// com.ziyou.portal-uptime and com.ziyou.portal-backup). Pure decisions live here so they can be tested.

/** Served by Vercel's CDN without running the app, so looking at it costs no function CPU. */
export const UPTIME_LIGHT_PATHS = ['/robots.txt'] as const
/**
 * Rendered by the app with the database. Every look uses the free plan's Active CPU (4 hours a
 * month, 90% used by 2026-10-27), so it is opened hourly, and on every run while something fails.
 */
export const UPTIME_FULL_PATHS = ['/'] as const
export const UPTIME_FULL_EVERY_MINUTES = 60
/** How often the LaunchAgent runs the check (StartInterval 600 in its plist). */
export const UPTIME_INTERVAL_MINUTES = 10
/**
 * Failed runs in a row before the first mail. The Mac reaches Vercel through the provider's
 * IPv6-to-IPv4 gateway, which drops out for a minute now and then while the site is fine for
 * everyone else (2026-10-27 18:12), so one failed run is not enough.
 */
export const UPTIME_CONFIRM_RUNS = 2
/** While the site stays down, repeat the alert this often. */
export const UPTIME_REMIND_HOURS = 6
export const BACKUP_KEEP = 8
/** A dump with fewer tables than this is treated as broken. */
export const BACKUP_MIN_TABLES = 20

export interface CheckResult {
  path: string
  /** HTTP status, or null when the request did not complete. */
  status: number | null
  error?: string
}

export interface UptimeState {
  down: boolean
  since: string | null
  lastAlertAt: string | null
  /** Failed runs in a row; the first mail waits for UPTIME_CONFIRM_RUNS. */
  failedRuns: number
  /** When the app-rendered page was last opened. */
  lastFullAt: string | null
}

export interface UptimeMail {
  subject: string
  text: string
}

export const INITIAL_UPTIME_STATE: UptimeState = { down: false, since: null, lastAlertAt: null, failedRuns: 0, lastFullAt: null }

/** The CDN file every run; the app page hourly, and every run while a failure is being confirmed or lasts. */
export function uptimePaths(state: UptimeState, now: Date): string[] {
  const fullDue = state.down || state.failedRuns > 0 || !state.lastFullAt || now.getTime() - new Date(state.lastFullAt).getTime() >= UPTIME_FULL_EVERY_MINUTES * 60_000
  return fullDue ? [...UPTIME_LIGHT_PATHS, ...UPTIME_FULL_PATHS] : [...UPTIME_LIGHT_PATHS]
}

export function isHealthy(results: readonly CheckResult[]): boolean {
  return results.length > 0 && results.every((result) => result.status === 200)
}

const jst = (iso: string) => new Date(iso).toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 16)

function describe(results: readonly CheckResult[], siteUrl: string): string {
  return results.map((result) => `・${siteUrl}${result.path} → ${result.status ?? `応答なし（${result.error ?? '不明'}）`}`).join('\n')
}

/** The next state and the mail to send, if any: down, still down (every few hours), or back up. */
export function nextUptimeState(prev: UptimeState, results: readonly CheckResult[], now: Date, siteUrl: string): { state: UptimeState; mail: UptimeMail | null } {
  const at = now.toISOString()
  if (isHealthy(results)) {
    const cleared = { ...INITIAL_UPTIME_STATE, lastFullAt: prev.lastFullAt }
    // A blip that never reached a mail clears quietly.
    if (!prev.down) return { state: cleared, mail: null }
    const minutes = prev.since ? Math.round((now.getTime() - new Date(prev.since).getTime()) / 60_000) : null
    return {
      state: cleared,
      mail: {
        subject: '【復旧】ポータルが再び開けるようになりました',
        text: `${siteUrl} は ${jst(at)} に正常に戻りました。${minutes !== null ? `\n止まっていた時間：約${minutes}分（${jst(prev.since!)}〜）` : ''}\n\n対応は不要です。`,
      },
    }
  }
  const failedRuns = prev.failedRuns + 1
  const since = prev.since ?? at
  if (!prev.down && failedRuns < UPTIME_CONFIRM_RUNS) return { state: { ...prev, since, failedRuns }, mail: null }
  const remindAfter = UPTIME_REMIND_HOURS * 3600_000
  const due = !prev.down || !prev.lastAlertAt || now.getTime() - new Date(prev.lastAlertAt).getTime() >= remindAfter
  const state: UptimeState = { ...prev, down: true, since, lastAlertAt: due ? at : prev.lastAlertAt, failedRuns }
  if (!due) return { state, mail: null }
  return {
    state,
    mail: {
      subject: prev.down ? '【継続中】ポータルがまだ開けません' : '【至急】ポータルが開けません',
      text: `${jst(since)} から、ポータルが正常に表示されていません（${UPTIME_INTERVAL_MINUTES}分おきの確認で${UPTIME_CONFIRM_RUNS}回続けて失敗）。\n\n${describe(results, siteUrl)}\n\nスマホのWi-Fiを切ってモバイル回線で開けるなら、このMac側の回線の不調です。\n直ったら「復旧」のメールが届きます。続く場合はClaudeかCodexに「サイトが落ちてる」と伝えてください。`,
    },
  }
}

/** Node's fetch reports every network failure as "fetch failed"; the reason is in `cause.code`. */
export function describeFetchFailure(error: unknown): string {
  if (error instanceof Error && error.name === 'TimeoutError') return '20秒以内に応答なし'
  const cause = error instanceof Error ? error.cause : undefined
  const code = cause && typeof cause === 'object' && 'code' in cause ? String(cause.code) : ''
  switch (code) {
    case 'UND_ERR_CONNECT_TIMEOUT': return '10秒以内につながらない'
    case 'ENOTFOUND':
    case 'EAI_AGAIN': return 'DNSでアドレスを引けない'
    case 'ECONNREFUSED': return '接続を断られた'
    case 'ECONNRESET':
    case 'UND_ERR_SOCKET': return '接続が途中で切れた'
    case 'ENETUNREACH':
    case 'EHOSTUNREACH': return 'このMacから経路がない'
    default: return code ? `接続できない（${code}）` : '接続できない'
  }
}

const BACKUP_NAME = /^portal-\d{4}-\d{2}-\d{2}\.dump$/

/** Backup files beyond the newest `keep`, oldest first. Other files in the folder are left alone. */
export function backupsToDelete(names: readonly string[], keep = BACKUP_KEEP): string[] {
  const backups = names.filter((name) => BACKUP_NAME.test(name)).sort()
  return backups.slice(0, Math.max(0, backups.length - keep))
}

export function backupFileName(now: Date): string {
  return `portal-${now.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 10)}.dump`
}
