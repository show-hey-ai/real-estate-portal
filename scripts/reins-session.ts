/**
 * REINS browser session for the Claude Code operator (0 yen; Playwright only).
 *
 * Launches Chromium with a persistent profile and a local CDP endpoint, logs in to REINS with the
 * credentials from the environment (REINS_LOGIN_ID / REINS_LOGIN_PW — never printed), then keeps the
 * browser open so the operator's Playwright MCP (`--cdp-endpoint http://127.0.0.1:<port>`) can drive it.
 *
 * Usage:
 *   npx tsx scripts/reins-session.ts                                # launch + login + keep alive (170 min)
 *   npx tsx scripts/reins-session.ts --no-login                     # launch only
 *   npx tsx scripts/reins-session.ts --headless                     # or REINS_HEADLESS=true
 *   npx tsx scripts/reins-session.ts --port 9223 --profile <dir> --max-minutes 170
 *   npx tsx scripts/reins-session.ts --relogin [--port 9223]        # attach to the running session, log in again, exit
 *
 * Stdout status line once ready:  REINS_SESSION_READY cdp=http://127.0.0.1:<port> login=ok|skipped|failed
 * The browser closes on SIGTERM/SIGINT or after --max-minutes.
 */
import { chromium, type Page } from 'playwright'
import { appendFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const ARGS = process.argv.slice(2)
function argValue(name: string, fallback: string) {
  const index = ARGS.indexOf(name)
  return index !== -1 && ARGS[index + 1] ? ARGS[index + 1] : fallback
}

const PORT = Number(argValue('--port', '9223'))
const PROFILE = resolve(
  argValue('--profile', `${process.env.HOME}/Library/Application Support/Ziyou Portal/autonomy/claude-operator/chromium-profile`),
)
const DOWNLOAD_DIR = resolve(
  argValue('--downloads', `${process.env.HOME}/Library/Application Support/Ziyou Portal/autonomy/claude-operator/downloads/reins`),
)
const MAX_MINUTES = Number(argValue('--max-minutes', '170'))
const HEADLESS = ARGS.includes('--headless') || process.env.REINS_HEADLESS === 'true'
const DO_LOGIN = !ARGS.includes('--no-login')
const RELOGIN = ARGS.includes('--relogin')
const ENTRY_URL = 'https://system.reins.jp/'
const LOGIN_PATH = 'GKG001200'
const USER_ID = process.env.REINS_USER_ID || process.env.REINS_LOGIN_ID || ''
const PASSWORD = process.env.REINS_PASSWORD || process.env.REINS_LOGIN_PW || ''

function log(message: string) {
  let safe = message
  for (const secret of [USER_ID, PASSWORD].filter(Boolean)) safe = safe.replaceAll(secret, '[REDACTED]')
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${safe}`)
}

async function login(page: Page) {
  if (!USER_ID || !PASSWORD) throw new Error('REINS_LOGIN_ID / REINS_LOGIN_PW が環境変数にありません（runtime.env を読み込んでください）')
  const response = await page.goto(ENTRY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (!response?.ok()) throw new Error(`REINS入口の応答が正常ではありません: HTTP ${response?.status() ?? 'unknown'}`)
  await page.locator('#login-button').click({ timeout: 30000 })
  await page.locator('input[type="password"]').waitFor({ state: 'visible', timeout: 30000 })
  // BootstrapVue: no name attributes; one text input and one password input on the login form.
  await page.locator('input[type="text"]').fill(USER_ID)
  await page.locator('input[type="password"]').fill(PASSWORD)
  // Terms checkbox: the label intercepts clicks, so force the check.
  await page.getByLabel('所属機構の規程及びガイドラインを遵守します', { exact: true }).check({ force: true })
  await page.getByRole('button', { name: 'ログイン', exact: true }).click()
  await page.waitForURL((url) => !url.pathname.includes(LOGIN_PATH), { timeout: 30000 })
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(2000)
  if (page.url().includes(LOGIN_PATH)) throw new Error('ログイン失敗: URLが変化していません')
  log(`REINSログイン成功: ${page.url()}`)
}

async function relogin() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`, { timeout: 15000 })
  const context = browser.contexts()[0]
  if (!context) throw new Error('接続先ブラウザーにコンテキストがありません')
  const page = context.pages()[0] ?? (await context.newPage())
  await login(page)
  console.log(`REINS_RELOGIN_OK cdp=http://127.0.0.1:${PORT}`)
  process.exit(0)
}

async function main() {
  if (RELOGIN) {
    await relogin()
    return
  }
  mkdirSync(PROFILE, { recursive: true, mode: 0o700 })
  const context = await chromium.launchPersistentContext(PROFILE, {
    headless: HEADLESS,
    args: [`--remote-debugging-port=${PORT}`, '--remote-debugging-address=127.0.0.1'],
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  })
  // Downloads belong to this Playwright client (the MCP only attaches over CDP and never sees them),
  // so save every download here and record the actual path for the operator.
  mkdirSync(DOWNLOAD_DIR, { recursive: true, mode: 0o700 })
  const watchPage = (target: Page) => {
    target.on('download', (download) => {
      void (async () => {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-')
        const file = resolve(DOWNLOAD_DIR, `${stamp}-${download.suggestedFilename()}`)
        try {
          await download.saveAs(file)
          const line = JSON.stringify({ savedAt: new Date().toISOString(), file, suggested: download.suggestedFilename(), url: download.url() })
          appendFileSync(resolve(DOWNLOAD_DIR, 'downloads.jsonl'), `${line}\n`, { mode: 0o600 })
          log(`ダウンロード保存: ${file}`)
        } catch (error) {
          log(`ダウンロード保存失敗: ${error instanceof Error ? error.message : String(error)}`)
        }
      })()
    })
  }
  context.pages().forEach(watchPage)
  context.on('page', watchPage)
  const page = context.pages()[0] ?? (await context.newPage())
  let loginState: 'ok' | 'skipped' | 'failed' = 'skipped'
  if (DO_LOGIN) {
    try {
      await login(page)
      loginState = 'ok'
    } catch (error) {
      loginState = 'failed'
      log(`REINSログイン失敗: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  console.log(`REINS_SESSION_READY cdp=http://127.0.0.1:${PORT} login=${loginState}`)

  const deadline = Date.now() + MAX_MINUTES * 60_000
  let closing = false
  const shutdown = async (reason: string) => {
    if (closing) return
    closing = true
    log(`セッション終了: ${reason}`)
    await context.close().catch(() => {})
    process.exit(0)
  }
  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
  const timer = setInterval(() => {
    if (Date.now() > deadline) void shutdown(`${MAX_MINUTES}分経過`)
  }, 30_000)
  context.on('close', () => {
    clearInterval(timer)
    if (!closing) {
      log('ブラウザーが閉じられました')
      process.exit(0)
    }
  })
}

main().catch((error: unknown) => {
  log(`エラー: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
})
