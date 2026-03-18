/**
 * REINS debug - モーダル対応 + 検索→結果→DL確認
 */
import { chromium } from 'playwright'
import { resolve } from 'path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env') })

const LOGIN_URL = 'https://system.reins.jp/login/main/KG/GKG001200'
const USER_ID = process.env.REINS_LOGIN_ID || ''
const PASSWORD = process.env.REINS_LOGIN_PW || ''

async function main() {
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({ locale: 'ja-JP' })
  const page = await context.newPage()
  page.on('dialog', async (d) => { console.log(`Dialog: "${d.message()}"`); await d.accept() })

  // 1. ログイン
  console.log('1. ログイン...')
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForTimeout(2000)
  await page.$('input[type="text"]').then(el => el?.fill(USER_ID))
  await page.$('input[type="password"]').then(el => el?.fill(PASSWORD))
  for (const cb of await page.$$('input[type="checkbox"]')) {
    if (!(await cb.isChecked())) await cb.check({ force: true })
  }
  await page.waitForTimeout(500)
  await page.$('button:has-text("ログイン")').then(el => el?.click())
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(3000)

  // 2. 売買物件検索ページへ
  console.log('2. 売買物件検索ページへ...')
  await page.$('button:has-text("売買 物件検索")').then(el => el?.click())
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(3000)

  // 3. 条件設定
  console.log('3. 条件設定...')

  // 物件種別1: 売マンション
  await page.selectOption('#__BVID__288', '03')
  console.log('  物件種別1: 売マンション')
  await page.waitForTimeout(500)

  // 都道府県名
  await page.fill('#__BVID__341', '東京都')
  console.log('  都道府県: 東京都')

  // 所在地名１
  await page.fill('#__BVID__345', '中央区')
  console.log('  所在地名1: 中央区')

  // 価格（万円）: __BVID__472=min, __BVID__474=max
  await page.fill('#__BVID__472', '10000')
  await page.fill('#__BVID__474', '15000')
  console.log('  価格: 10000〜15000万円')

  await page.waitForTimeout(1000)

  // 4. 検索実行（件数事前確認はスキップ、直接検索）
  console.log('4. 検索実行...')

  // 検索ボタン（"件数事前確認"ではなく、"検索"と完全一致するボタン）
  const searchBtns = await page.$$('button')
  for (const btn of searchBtns) {
    const text = await btn.textContent()
    if (text?.trim() === '検索') {
      await btn.click()
      console.log('  「検索」ボタンクリック')
      break
    }
  }

  // モーダルが出たら承認
  await page.waitForTimeout(2000)
  const modalOk = await page.$('.modal.show button:has-text("OK")')
    || await page.$('.modal.show button.btn-primary')
  if (modalOk) {
    await modalOk.click()
    console.log('  モーダルOKクリック')
  }

  await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(5000)

  console.log(`結果URL: ${page.url()}`)
  await page.screenshot({ path: '/tmp/reins-results3.png', fullPage: true })

  // 5. 結果ページ分析
  const bodyText = await page.textContent('body') || ''
  const countMatch = bodyText.match(/(\d+)\s*件/)
  if (countMatch) console.log(`検索結果: ${countMatch[1]}件`)

  // ボタン一覧
  const allButtons = await page.$$eval('button', els =>
    els.map(e => ({
      text: e.textContent?.trim().substring(0, 50),
      visible: e.getBoundingClientRect().width > 0,
    })).filter(e => e.text && e.visible)
  )
  console.log('Buttons:', JSON.stringify(allButtons.map(b => b.text)))

  // チェックボックス一覧
  const cbs = await page.$$('input[type="checkbox"]')
  console.log(`Checkboxes: ${cbs.length}`)

  // テーブル
  const tables = await page.$$eval('table', els => els.map(e => ({
    rows: e.rows.length,
    class: e.className?.substring(0, 50),
  })))
  console.log('Tables:', JSON.stringify(tables))

  await browser.close()
}
main()
