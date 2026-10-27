/**
 * Weekly database backup (Sundays, LaunchAgent com.ziyou.portal-backup). Dumps the public and auth
 * schemas with pg_dump into a private folder on this Mac, checks the dump can be read back, keeps the
 * newest eight, and mails the owner only when a backup fails. The repository is public, so backups
 * never go to GitHub.
 *
 *   npm run ops:backup
 *   Restore: pg_restore --clean --if-exists --no-owner --dbname "$DIRECT_URL" <file>
 */
import { execFile } from 'node:child_process'
import { chmod, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { BACKUP_MIN_TABLES, backupFileName, backupsToDelete } from '../src/lib/ops-watch'
import { sendOperatorMailDirect } from '../src/lib/autonomy/operator-mail'

const run = promisify(execFile)
const DIR = process.env.BACKUP_DIR ?? join(homedir(), 'Library/Application Support/Ziyou Portal/backups/weekly')
const BIN = process.env.PG_BIN_DIR ?? '/opt/homebrew/opt/libpq/bin'
const TIMEOUT_MS = 15 * 60_000

async function backup(): Promise<string> {
  const url = process.env.DIRECT_URL
  if (!url) throw new Error('DIRECT_URL is not set')
  await mkdir(DIR, { recursive: true, mode: 0o700 })
  const file = join(DIR, backupFileName(new Date()))
  const env = { ...process.env, PGSSLMODE: 'require' }
  await run(join(BIN, 'pg_dump'), ['--dbname', url, '--format', 'custom', '--no-owner', '--no-privileges', '--schema', 'public', '--schema', 'auth', '--file', file], { env, timeout: TIMEOUT_MS })
  await chmod(file, 0o600)
  const { stdout } = await run(join(BIN, 'pg_restore'), ['--list', file], { timeout: TIMEOUT_MS, maxBuffer: 32 * 1024 * 1024 })
  const tables = stdout.split('\n').filter((line) => line.includes(' TABLE DATA ')).length
  if (tables < BACKUP_MIN_TABLES) throw new Error(`the dump holds only ${tables} tables`)
  for (const name of backupsToDelete(await readdir(DIR))) await rm(join(DIR, name))
  return `${file} (${tables} tables, ${Math.round((await stat(file)).size / 1024)} KB)`
}

async function main() {
  try {
    console.log(`backup ${new Date().toISOString()}: ${await backup()}`)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message.split('\n')[0] : String(error)
    console.error(`backup failed: ${message}`)
    process.exitCode = 1
    const text = `今週のデータベースのバックアップに失敗しました。サイトの表示には影響ありません。\n\n理由：${message.replace(/postgres(ql)?:\/\/[^\s]+/g, '[接続先]')}\n\nClaudeかCodexに「バックアップが失敗した」と伝えてください。`
    console.log('mail', (await sendOperatorMailDirect('【確認】ポータルのバックアップに失敗しました', text)).state)
  }
}

main()
