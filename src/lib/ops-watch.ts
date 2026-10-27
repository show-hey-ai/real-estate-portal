// Uptime alerts and weekly database backups, run on the owner's Mac (LaunchAgents
// com.ziyou.portal-uptime and com.ziyou.portal-backup). Pure decisions live here so they can be tested.

export const UPTIME_PATHS = ['/', '/listings'] as const
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
}

export interface UptimeMail {
  subject: string
  text: string
}

export const INITIAL_UPTIME_STATE: UptimeState = { down: false, since: null, lastAlertAt: null }

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
    if (!prev.down) return { state: prev, mail: null }
    const minutes = prev.since ? Math.round((now.getTime() - new Date(prev.since).getTime()) / 60_000) : null
    return {
      state: INITIAL_UPTIME_STATE,
      mail: {
        subject: '【復旧】ポータルが再び開けるようになりました',
        text: `${siteUrl} は ${jst(at)} に正常に戻りました。${minutes !== null ? `\n止まっていた時間：約${minutes}分（${jst(prev.since!)}〜）` : ''}\n\n対応は不要です。`,
      },
    }
  }
  const remindAfter = UPTIME_REMIND_HOURS * 3600_000
  const due = !prev.down || !prev.lastAlertAt || now.getTime() - new Date(prev.lastAlertAt).getTime() >= remindAfter
  const state: UptimeState = { down: true, since: prev.since ?? at, lastAlertAt: due ? at : prev.lastAlertAt }
  if (!due) return { state, mail: null }
  return {
    state,
    mail: {
      subject: prev.down ? '【継続中】ポータルがまだ開けません' : '【至急】ポータルが開けません',
      text: `${jst(state.since!)} から、ポータルが正常に表示されていません（2回続けて確認）。\n\n${describe(results, siteUrl)}\n\n直ったら「復旧」のメールが届きます。続く場合はClaudeかCodexに「サイトが落ちてる」と伝えてください。`,
    },
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
