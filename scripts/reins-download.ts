/**
 * REINS全自動PDFダウンロード
 * ログイン → 売買物件検索 → 条件設定 → 検索 → 全選択 → 図面一括取得
 *
 * Usage:
 *   npx tsx scripts/reins-download.ts
 *   npx tsx scripts/reins-download.ts --headless
 *
 * .env設定:
 *   REINS_LOGIN_ID / REINS_LOGIN_PW  (認証)
 *   REINS_AREA=東京都                (都道府県)
 *   REINS_CITY=中央区                (市区町村、任意)
 *   REINS_PROPERTY_TYPE=売マンション (物件種別)
 *   REINS_PRICE_MIN=10000            (最低価格 万円)
 *   REINS_PRICE_MAX=15000            (最高価格 万円)
 */
import { chromium, type Page, type Download } from 'playwright'
import { resolve } from 'path'
import { mkdir } from 'fs/promises'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env') })

const LOGIN_URL = 'https://system.reins.jp/login/main/KG/GKG001200'
const USER_ID = process.env.REINS_USER_ID || process.env.REINS_LOGIN_ID || ''
const PASSWORD = process.env.REINS_PASSWORD || process.env.REINS_LOGIN_PW || ''
const DOWNLOAD_DIR = resolve(process.env.MAISOKU_WATCH_DIR?.replace('~', process.env.HOME || '') || `${process.env.HOME}/Downloads/maisoku`)

const SEARCH_AREA = process.env.REINS_AREA || '東京都'
const SEARCH_CITY = process.env.REINS_CITY || ''
const SEARCH_PROPERTY_TYPE = process.env.REINS_PROPERTY_TYPE || '売マンション'
const SEARCH_PRICE_MIN = process.env.REINS_PRICE_MIN || ''
const SEARCH_PRICE_MAX = process.env.REINS_PRICE_MAX || ''

const headless = process.argv.includes('--headless')

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

// BootstrapVueのフォームはname属性がなく動的IDのみ。
// ラベルテキストから対応するinput/selectを探すヘルパー。
async function findInputByLabel(page: Page, labelText: string): Promise<string | null> {
  return page.evaluate((text) => {
    const labels = document.querySelectorAll('.p-label-title')
    for (const label of labels) {
      if (label.textContent?.trim().includes(text)) {
        const container = label.closest('.row') || label.closest('.container')
        if (container) {
          const input = container.querySelector('input[type="text"]')
          if (input) return input.id
        }
      }
    }
    return null
  }, labelText)
}

// 物件種別selectを探す（optionテキストでマッチ）
async function findPropertyTypeSelect(page: Page, typeName: string): Promise<{ selectId: string, value: string } | null> {
  return page.evaluate((name) => {
    const selects = document.querySelectorAll('select')
    for (const sel of selects) {
      const opts = Array.from(sel.options)
      const match = opts.find(o => o.textContent?.trim() === name)
      if (match) return { selectId: sel.id, value: match.value }
    }
    return null
  }, typeName)
}

// 価格入力欄を探す（"価格"ラベルのcard-body内の最初の2つのtext input）
async function findPriceInputs(page: Page): Promise<{ minId: string, maxId: string } | null> {
  return page.evaluate(() => {
    const labels = document.querySelectorAll('.p-label-title')
    for (const label of labels) {
      if (label.textContent?.trim() === '価格') {
        const cardBody = label.closest('.card-body')
        if (cardBody) {
          const inputs = cardBody.querySelectorAll('input[type="text"]')
          if (inputs.length >= 2) {
            return { minId: inputs[0].id, maxId: inputs[1].id }
          }
        }
      }
    }
    return null
  })
}

// BootstrapVueモーダルを自動承認
async function dismissModal(page: Page) {
  const modalOk = await page.$('.modal.show button:has-text("OK")')
    || await page.$('.modal.show button.btn-primary')
  if (modalOk) {
    await modalOk.click()
    log('  モーダルOK')
    await page.waitForTimeout(1000)
  }
}

// === ステップ1: ログイン ===
async function login(page: Page) {
  log('1. REINSにログイン...')
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)

  // BootstrapVue: name属性なし、type="text"が1つ、type="password"が1つ
  const userField = await page.$('input[type="text"]')
  if (userField) await userField.fill(USER_ID)

  const passField = await page.$('input[type="password"]')
  if (passField) await passField.fill(PASSWORD)

  // 規程遵守チェックボックス（BootstrapVue: labelがinterceptするのでforce使用）
  for (const cb of await page.$$('input[type="checkbox"]')) {
    if (!(await cb.isChecked())) await cb.check({ force: true })
  }

  await page.waitForTimeout(500)
  const loginBtn = await page.$('button:has-text("ログイン")')
  if (loginBtn) await loginBtn.click()

  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(3000)

  if (page.url().includes('GKG001200')) {
    throw new Error('ログイン失敗: URLが変化していません')
  }
  log(`  ログイン成功: ${page.url()}`)
}

// === ステップ2: 売買物件検索ページへ ===
async function navigateToSearch(page: Page) {
  log('2. 売買物件検索ページへ...')
  const btn = await page.$('button:has-text("売買 物件検索")')
  if (btn) {
    await btn.click()
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(3000)
  }
  log(`  URL: ${page.url()}`)
}

// === ステップ3: 検索条件設定 ===
async function setSearchCriteria(page: Page) {
  log('3. 検索条件を設定...')

  // 物件種別
  if (SEARCH_PROPERTY_TYPE) {
    const typeInfo = await findPropertyTypeSelect(page, SEARCH_PROPERTY_TYPE)
    if (typeInfo) {
      await page.selectOption(`#${typeInfo.selectId}`, typeInfo.value)
      log(`  物件種別: ${SEARCH_PROPERTY_TYPE}`)
      await page.waitForTimeout(500)
    }
  }

  // 都道府県
  if (SEARCH_AREA) {
    const prefId = await findInputByLabel(page, '都道府県名')
    if (prefId) {
      await page.fill(`#${prefId}`, SEARCH_AREA)
      log(`  都道府県: ${SEARCH_AREA}`)
    }
  }

  // 市区町村
  if (SEARCH_CITY) {
    const cityId = await findInputByLabel(page, '所在地名１')
    if (cityId) {
      await page.fill(`#${cityId}`, SEARCH_CITY)
      log(`  所在地名1: ${SEARCH_CITY}`)
    }
  }

  // 価格
  if (SEARCH_PRICE_MIN || SEARCH_PRICE_MAX) {
    const priceIds = await findPriceInputs(page)
    if (priceIds) {
      if (SEARCH_PRICE_MIN) {
        await page.fill(`#${priceIds.minId}`, SEARCH_PRICE_MIN)
        log(`  価格下限: ${SEARCH_PRICE_MIN}万円`)
      }
      if (SEARCH_PRICE_MAX) {
        await page.fill(`#${priceIds.maxId}`, SEARCH_PRICE_MAX)
        log(`  価格上限: ${SEARCH_PRICE_MAX}万円`)
      }
    }
  }

  await page.waitForTimeout(500)
}

// === ステップ4: 検索実行 ===
async function executeSearch(page: Page) {
  log('4. 検索実行...')

  // 「検索」ボタン（テキスト完全一致）
  const btns = await page.$$('button')
  for (const btn of btns) {
    const text = (await btn.textContent())?.trim()
    if (text === '検索') {
      await btn.click()
      log('  検索ボタンクリック')
      break
    }
  }

  // モーダル（件数超過の確認など）を自動承認
  await page.waitForTimeout(2000)
  await dismissModal(page)

  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(3000)

  // 件数取得
  const bodyText = await page.textContent('body') || ''
  const countMatch = bodyText.match(/(\d+)\s*件/)
  if (countMatch) log(`  検索結果: ${countMatch[1]}件`)

  log(`  結果URL: ${page.url()}`)
}

// === ステップ5: ページ内全選択 → 図面一括取得 ===
async function selectAllAndDownload(page: Page): Promise<Download | null> {
  log('5. ページ内全選択 + 図面一括取得...')

  // 「ページ内全選択」ボタン
  const selectAllBtn = await page.$('button:has-text("ページ内全選択")')
  if (selectAllBtn) {
    await selectAllBtn.click()
    log('  ページ内全選択')
    await page.waitForTimeout(500)
  }

  // 「図面一括取得」ボタンをクリック（ダウンロードイベント監視付き）
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 120000 }).catch(() => null),
    (async () => {
      await page.waitForTimeout(500)
      const dlBtn = await page.$('button:has-text("図面一括取得")')
      if (dlBtn) {
        log('  図面一括取得クリック')
        await dlBtn.click()
        // BootstrapVueモーダル確認
        await page.waitForTimeout(2000)
        await dismissModal(page)
      } else {
        log('  図面一括取得ボタンが見つかりません')
      }
    })(),
  ])

  return download
}

// === ステップ6: ファイル保存 ===
async function saveDownload(download: Download | null, pageNum: number) {
  if (!download) {
    log(`  ダウンロード検出できず（ページ${pageNum}）`)
    return false
  }

  const fileName = download.suggestedFilename() || `reins-page${pageNum}.pdf`
  const savePath = resolve(DOWNLOAD_DIR, fileName)
  await download.saveAs(savePath)
  log(`  保存完了: ${savePath}`)
  return true
}

// === ページネーション ===
async function goNextPage(page: Page, currentPage: number): Promise<boolean> {
  // ページボタンは数字のボタン（1, 2, 3, 4, 5...）
  const nextPageNum = currentPage + 1
  const btns = await page.$$('button')
  for (const btn of btns) {
    const text = (await btn.textContent())?.trim()
    if (text === String(nextPageNum)) {
      await btn.click()
      log(`  ページ ${nextPageNum} へ移動`)
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(2000)
      return true
    }
  }
  return false
}

// === メイン ===
async function main() {
  await mkdir(DOWNLOAD_DIR, { recursive: true })

  log('=== REINS全自動PDFダウンロード ===')
  log(`エリア: ${SEARCH_AREA} ${SEARCH_CITY}`)
  log(`物件種別: ${SEARCH_PROPERTY_TYPE}`)
  log(`価格帯: ${SEARCH_PRICE_MIN || '-'}〜${SEARCH_PRICE_MAX || '-'}万円`)
  log(`保存先: ${DOWNLOAD_DIR}`)
  log('')

  const browser = await chromium.launch({ headless, downloadsPath: DOWNLOAD_DIR })
  const context = await browser.newContext({ acceptDownloads: true, locale: 'ja-JP' })

  const page = await context.newPage()
  page.on('dialog', async (d) => { log(`ダイアログ: "${d.message()}"`); await d.accept() })

  let totalDownloads = 0

  try {
    await login(page)
    await navigateToSearch(page)
    await setSearchCriteria(page)
    await executeSearch(page)

    // ページごとにDL
    const MAX_PAGES = 20
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      log(`\n--- ページ ${pageNum} ---`)
      const download = await selectAllAndDownload(page)
      const saved = await saveDownload(download, pageNum)
      if (saved) totalDownloads++

      // 次ページへ
      const moved = await goNextPage(page, pageNum)
      if (!moved) {
        log('最終ページに到達')
        break
      }
    }
  } catch (err) {
    log(`エラー: ${err instanceof Error ? err.message : err}`)
    await page.screenshot({ path: resolve(DOWNLOAD_DIR, 'error-screenshot.png') }).catch(() => {})
  } finally {
    log('')
    log(`=== 完了: ${totalDownloads}件ダウンロード ===`)
    log('→ watch-maisoku-local.ts が自動で処理を開始します')
    await browser.close()
    process.exit(0)
  }
}

main()
