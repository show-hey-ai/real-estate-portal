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
 *   REINS_PROPERTY_TYPE=売外全     (物件種別。宿泊業候補は一棟系を優先)
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
const SEARCH_PROPERTY_TYPE = process.env.REINS_PROPERTY_TYPE || '売外全'
const SEARCH_PRICE_MIN = process.env.REINS_PRICE_MIN || ''
const SEARCH_PRICE_MAX = process.env.REINS_PRICE_MAX || ''
const maxPagesArg = process.argv.find(arg => arg.startsWith('--max-pages='))
const MAX_PAGES = maxPagesArg ? Math.max(1, parseInt(maxPagesArg.replace('--max-pages=', ''), 10) || 1) : 20

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

  // まずメインメニューのボタンを確認
  const menuButtons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button, a')).map(el => ({
      text: el.textContent?.trim()?.replace(/\s+/g, ' ') || '',
      tag: el.tagName,
    })).filter(b => b.text.length > 0 && b.text.length < 50).slice(0, 40)
  })
  log(`  メニュー項目: ${menuButtons.map(b => b.text).join(' | ')}`)

  // 物件種別名でメニューボタンを直接探す
  if (SEARCH_PROPERTY_TYPE) {
    const directMatch = await page.evaluate((typeName) => {
      const elements = [...document.querySelectorAll('button, a, .nav-link')]
      for (const el of elements) {
        const text = el.textContent?.trim()?.replace(/\s+/g, ' ') || ''
        if (text.includes(typeName)) {
          ;(el as HTMLElement).click()
          return text
        }
      }
      return null
    }, SEARCH_PROPERTY_TYPE)

    if (directMatch) {
      log(`  メニューから直接: ${directMatch}`)
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(3000)
      log(`  URL: ${page.url()}`)
      return
    }
  }

  // "売買 物件検索" をクリック
  const btn = await page.$('button:has-text("売買 物件検索")')
    || await page.$('button:has-text("売買")')
  if (btn) {
    await btn.click()
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(3000)
  }
  log(`  URL: ${page.url()}`)

  // デバッグ: ページ上の全selectのoption一覧を表示
  const selectDebug = await page.evaluate(() => {
    const selects = document.querySelectorAll('select')
    return Array.from(selects).map(sel => ({
      id: sel.id,
      options: Array.from(sel.options).map(o => `${o.value}:${o.textContent?.trim()}`),
    }))
  })
  for (const sel of selectDebug) {
    log(`  select#${sel.id}: ${sel.options.join(' | ')}`)
  }

  // 物件種別selectを探す（部分一致で）
  if (SEARCH_PROPERTY_TYPE) {
    const typeResult = await page.evaluate((typeName) => {
      const selects = document.querySelectorAll('select')
      for (const sel of selects) {
        const opts = Array.from(sel.options)
        // 完全一致
        let match = opts.find(o => o.textContent?.trim() === typeName)
        // 部分一致
        if (!match) match = opts.find(o => o.textContent?.trim().includes(typeName))
        if (match) {
          sel.value = match.value
          sel.dispatchEvent(new Event('change', { bubbles: true }))
          return { selectId: sel.id, value: match.value, text: match.textContent?.trim() }
        }
      }
      return null
    }, SEARCH_PROPERTY_TYPE)

    if (typeResult) {
      log(`  物件種別select: ${typeResult.text} (value=${typeResult.value})`)
      await page.waitForTimeout(2000)
      // 物件種別変更後、ページ構造が変わる場合がある
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await page.waitForTimeout(2000)
      log(`  URL: ${page.url()}`)
    } else {
      log(`  物件種別 "${SEARCH_PROPERTY_TYPE}" がselectに見つかりません`)
    }
  }
}

// === ステップ3: 検索条件設定 ===
async function setSearchCriteria(page: Page) {
  log('3. 検索条件を設定...')

  // 物件種別（selectがある場合のみ — タブで既に選択済みならスキップ）
  if (SEARCH_PROPERTY_TYPE) {
    const typeInfo = await findPropertyTypeSelect(page, SEARCH_PROPERTY_TYPE)
    if (typeInfo) {
      await page.selectOption(`#${typeInfo.selectId}`, typeInfo.value)
      log(`  物件種別(select): ${SEARCH_PROPERTY_TYPE}`)
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

  // 図面あり チェックボックス
  const zumenChecked = await page.evaluate(() => {
    const labels = document.querySelectorAll('label, span, .custom-control-label')
    for (const label of labels) {
      const text = label.textContent?.trim() || ''
      if (text.includes('図面あり') || text.includes('図面有')) {
        // ラベルに紐づくcheckboxをクリック
        const forId = label.getAttribute('for')
        if (forId) {
          const cb = document.getElementById(forId) as HTMLInputElement
          if (cb && !cb.checked) { cb.click(); return '図面あり (by for)' }
          if (cb?.checked) return '図面あり (already checked)'
        }
        // 親要素のcheckbox
        const parent = label.closest('.custom-control, .form-check, .form-group')
        if (parent) {
          const cb = parent.querySelector('input[type="checkbox"]') as HTMLInputElement
          if (cb && !cb.checked) { cb.click(); return '図面あり (by parent)' }
          if (cb?.checked) return '図面あり (already checked)'
        }
        // label自体をクリック
        ;(label as HTMLElement).click()
        return '図面あり (label click)'
      }
    }
    return null
  })

  if (zumenChecked) {
    log(`  ${zumenChecked}`)
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

  // モーダル（件数超過の確認など）を自動承認 — 複数回試行
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(2000)
    await dismissModal(page)
  }

  // 検索結果の表示を待つ（最大30秒、要素の出現を監視）
  log('  検索結果を待機中...')
  let resultFound = false
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(2000)

    // ページ内全選択ボタンが出現したら結果が表示されている
    const selectAllBtn = await page.$('button:has-text("ページ内全選択")')
    if (selectAllBtn) {
      log('  結果表示確認（ページ内全選択ボタン検出）')
      resultFound = true
      break
    }

    // テーブルや結果リストの出現チェック
    const hasResults = await page.evaluate(() => {
      const tables = document.querySelectorAll('table')
      for (const t of tables) {
        if (t.querySelectorAll('tr').length > 2) return true
      }
      // チェックボックスの存在（物件選択用）
      const checkboxes = document.querySelectorAll('input[type="checkbox"]')
      if (checkboxes.length > 10) return true
      return false
    })

    if (hasResults) {
      log(`  結果テーブル/チェックボックス検出 (${(i + 1) * 2}秒)`)
      resultFound = true
      break
    }

    // モーダルが再出現する場合
    await dismissModal(page)
  }

  if (!resultFound) {
    log('  警告: 検索結果の表示を確認できませんでした')
  }

  await page.waitForTimeout(2000)

  // 件数取得
  const bodyText = await page.textContent('body') || ''
  const countMatch = bodyText.match(/(\d+)\s*件/)
  if (countMatch) log(`  検索結果: ${countMatch[1]}件`)
  else log('  件数パターン検出できず')

  log(`  結果URL: ${page.url()}`)
  await page.screenshot({ path: resolve(DOWNLOAD_DIR, 'debug-search-result.png'), fullPage: true }).catch(() => {})
}

// === ステップ5: ページ内全選択 → 図面一括取得（複数DL対応）===
async function selectAllAndDownload(page: Page): Promise<Download[]> {
  log('5. ページ内全選択 + 図面一括取得...')

  // デバッグ: ページ上のボタン一覧
  const buttonTexts = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean).slice(0, 30)
  })
  log(`  ボタン一覧: ${buttonTexts.join(' | ')}`)

  // 「ページ内全選択」ボタン（テキスト部分一致）
  let selectAllBtn = await page.$('button:has-text("ページ内全選択")')
  if (!selectAllBtn) {
    selectAllBtn = await page.$('button:has-text("全選択")')
  }
  if (selectAllBtn) {
    await selectAllBtn.click()
    log('  ページ内全選択')
    await page.waitForTimeout(500)
  } else {
    log('  全選択ボタンが見つかりません')
    await page.screenshot({ path: resolve(DOWNLOAD_DIR, 'debug-no-select-all.png') }).catch(() => {})
  }

  // 「図面一括取得」ボタンをクリック（複数ダウンロード対応）
  let dlBtn = await page.$('button:has-text("図面一括取得")')
  if (!dlBtn) {
    dlBtn = await page.$('button:has-text("図面")')
  }

  if (!dlBtn) {
    log('  図面一括取得ボタンが見つかりません')
    await page.screenshot({ path: resolve(DOWNLOAD_DIR, 'debug-no-download-btn.png') }).catch(() => {})
    return []
  }

  // 複数DLを収集（REINSは50件を25件×2ファイルに分割）
  const downloads: Download[] = []
  const downloadHandler = (dl: Download) => { downloads.push(dl) }
  page.on('download', downloadHandler)

  await page.waitForTimeout(500)
  log('  図面一括取得クリック')
  await dlBtn.click()
  // BootstrapVueモーダル確認
  await page.waitForTimeout(2000)
  await dismissModal(page)

  // 最初のDLを最大120秒待つ
  const deadline = Date.now() + 120000
  while (downloads.length === 0 && Date.now() < deadline) {
    await page.waitForTimeout(1000)
  }

  // 2つ目のDLを最大30秒待つ
  if (downloads.length > 0) {
    const deadline2 = Date.now() + 30000
    while (downloads.length < 2 && Date.now() < deadline2) {
      await page.waitForTimeout(1000)
    }
  }

  page.off('download', downloadHandler)
  log(`  ダウンロード検出: ${downloads.length}件`)
  return downloads
}

// === ステップ6: ファイル保存（複数DL対応）===
async function saveDownloads(downloads: Download[], pageNum: number) {
  if (downloads.length === 0) {
    log(`  ダウンロード検出できず（ページ${pageNum}）`)
    return 0
  }

  let saved = 0
  for (const download of downloads) {
    const fileName = download.suggestedFilename() || `reins-page${pageNum}-${saved + 1}.pdf`
    const savePath = resolve(DOWNLOAD_DIR, fileName)
    await download.saveAs(savePath)
    log(`  保存完了: ${savePath}`)
    saved++
  }
  return saved
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
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      log(`\n--- ページ ${pageNum} ---`)
      const downloads = await selectAllAndDownload(page)
      const saved = await saveDownloads(downloads, pageNum)
      totalDownloads += saved

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
    log('→ 取り込みは必要に応じて `npm run maisoku:all` を実行してください')
    await browser.close()
    process.exit(0)
  }
}

main()
