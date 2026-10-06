import { spawn } from 'child_process'
import { access, mkdir, readdir, readFile, rename, writeFile } from 'fs/promises'
import { basename, extname, join, resolve } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'

config({ path: resolve(process.cwd(), '.env') })

const args = process.argv.slice(2)
const skipReins = args.includes('--skip-reins') || args.includes('--skip-download')
const skipSplit = args.includes('--skip-split')
const dirArgIndex = args.indexOf('--dir')
const watchDir = dirArgIndex !== -1 && args[dirArgIndex + 1]
  ? resolve(args[dirArgIndex + 1].replace('~', process.env.HOME || ''))
  : resolve(process.env.MAISOKU_WATCH_DIR?.replace('~', process.env.HOME || '') || `${process.env.HOME}/Downloads/maisoku`)

const tsxCli = resolve(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs')
const reinsScript = resolve(process.cwd(), 'scripts', 'reins-download.ts')
const importScript = resolve(process.cwd(), 'scripts', 'process-openai-vision.ts')

interface RecentListing {
  managementId: string | null
  addressPublic: string | null
  propertyType: string | null
  price: number | string | null
  status: string | null
  adAllowed: boolean | null
}

function log(message: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${message}`)
}

function formatRunStamp(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '_',
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('')
}

async function pathExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function uniquePath(path: string) {
  if (!(await pathExists(path))) return path
  const ext = extname(path)
  const base = path.slice(0, path.length - ext.length)

  for (let index = 2; index < 1000; index++) {
    const candidate = `${base}-${index}${ext}`
    if (!(await pathExists(candidate))) return candidate
  }

  return `${base}-${Date.now()}${ext}`
}

function runTsxScript(scriptPath: string, scriptArgs: string[], env: NodeJS.ProcessEnv) {
  return new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [tsxCli, scriptPath, ...scriptArgs], {
      cwd: process.cwd(),
      env,
      stdio: 'inherit',
    })

    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }
      rejectPromise(new Error(`${scriptPath} exited with code ${code ?? 'null'}`))
    })
  })
}

// === PDF分割: 結合PDF(zmn_list_*.pdf)を1ページずつに分割 ===
async function splitCombinedPdfs(targetDir: string) {
  log('結合PDFを個別ファイルに分割中...')
  await mkdir(targetDir, { recursive: true })

  const combinedFiles = (await readdir(targetDir))
    .filter(file => /^zmn_list_.*\.pdf$/i.test(file))
    .sort()

  if (combinedFiles.length === 0) {
    log('  分割対象の結合PDFなし')
    return
  }

  const combinedDir = join(targetDir, 'combined-originals')
  await mkdir(combinedDir, { recursive: true })
  log(`  ${combinedFiles.length}件の結合PDFを検出`)

  let splitCount = 0
  let movedCount = 0

  for (const fileName of combinedFiles) {
    const filePath = join(targetDir, fileName)
    const sourcePdf = await PDFDocument.load(await readFile(filePath))
    const baseName = basename(fileName, '.pdf')
    const pageCount = sourcePdf.getPageCount()

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const singlePdf = await PDFDocument.create()
      const [page] = await singlePdf.copyPages(sourcePdf, [pageIndex])
      singlePdf.addPage(page)

      const outputName = `split_${baseName}_p${String(pageIndex + 1).padStart(3, '0')}.pdf`
      await writeFile(await uniquePath(join(targetDir, outputName)), Buffer.from(await singlePdf.save()))
      splitCount++
    }

    await rename(filePath, await uniquePath(join(combinedDir, fileName)))
    movedCount++
  }

  log(`  分割完了: ${splitCount}件の個別PDF作成、${movedCount}件の結合PDFを退避`)
}

// === ポータル検証: 登録済み物件をチェック ===
async function verifyPortal(sinceIso?: string) {
  log('ポータル登録結果を確認中...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    log('  ⚠ Supabase設定が見つかりません。検証スキップ')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 最新の物件を取得（実行開始後。未指定なら直近24時間以内）
  const since = sinceIso || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: listings, error } = await supabase
    .from('listings')
    .select('managementId, addressPublic, propertyType, price, status, adAllowed, createdAt')
    .gte('createdAt', since)
    .order('createdAt', { ascending: false })

  if (error) {
    log(`  ⚠ DB取得エラー: ${error.message}`)
    return
  }

  if (!listings || listings.length === 0) {
    log('  新規登録なし')
    return
  }

  log(`  新規登録: ${listings.length}件`)
  log('')
  log('  管理番号    | 住所                           | 種別         | 価格        | 広告  | ステータス')
  log('  ' + '-'.repeat(100))

  const recentListings = (listings || []) as RecentListing[]

  for (const l of recentListings) {
    const addr = (l.addressPublic || '').slice(0, 28).padEnd(28)
    const type = (l.propertyType || '').slice(0, 10).padEnd(10)
    const price = l.price ? `${(Number(l.price) / 10000).toLocaleString()}万円`.padEnd(10) : '不明'.padEnd(10)
    const ad = l.adAllowed ? '✅' : '❌'
    const status = l.status || 'DRAFT'
    log(`  ${l.managementId} | ${addr} | ${type} | ${price} | ${ad}   | ${status}`)
  }

  const adAllowed = recentListings.filter((listing) => listing.adAllowed).length
  const draft = recentListings.filter((listing) => listing.status === 'DRAFT').length

  log('')
  log(`  合計: ${recentListings.length}件 (広告可: ${adAllowed}件, 下書き: ${draft}件)`)

  if (draft > 0) {
    log(`  → ${draft}件の下書きがレビュー待ちです: http://localhost:3000/admin/listings`)
  }
}

async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`Usage:
  npx tsx scripts/reins-auto.ts
  npx tsx scripts/reins-auto.ts --headless
  npx tsx scripts/reins-auto.ts --headless --max-pages=1 --max=1
  npx tsx scripts/reins-auto.ts --dry-run --max=5
  npx tsx scripts/reins-auto.ts --dry-run --max=1 --max-pdf-pages=1
  npx tsx scripts/reins-auto.ts --dry-run --max=1 --ai-provider=codex
  npx tsx scripts/reins-auto.ts --skip-reins --dir ~/Downloads/maisoku
  npx tsx scripts/reins-auto.ts --skip-reins --skip-split   # 分割済みの場合

Options:
  --headless          ブラウザ非表示でREINS操作（2026-05-27時点ではREINSが503を返すため通常は非推奨）
  --max-pages=N       REINSの最大ページ数 (default: 20)
  --max=N             取り込み最大件数
  --max-pdf-pages=N   1つのPDF内で処理する最大ページ数
  --ai-provider=openai|codex  広告判定・抽出・帯除去に使うAI
  --codex-on-quota    OpenAI quota/billing 429時だけCodexへ切替
  --dry-run           取り込みのドライラン
  --allow-missing-storage  PDF保存失敗でもDB登録を続行
  --skip-reins        REINSダウンロードをスキップ
  --skip-split        PDF分割をスキップ
  --dir <path>        監視ディレクトリ指定`)
    process.exit(0)
  }

  const downloadArgs = args.filter(arg => arg === '--headless' || arg.startsWith('--max-pages='))
  let activeDir = watchDir

  if (!skipReins) {
    activeDir = resolve(watchDir, `reins-run-${formatRunStamp()}`)
    await mkdir(activeDir, { recursive: true })
  }

  const sharedEnv = {
    ...process.env,
    MAISOKU_WATCH_DIR: activeDir,
  }

  const importArgs = ['--all', '--dir', activeDir]

  for (const arg of args) {
    if (
      arg === '--dry-run' ||
      arg === '--allow-missing-storage' ||
      arg === '--codex-on-quota' ||
      arg.startsWith('--max=') ||
      arg.startsWith('--max-pdf-pages=') ||
      arg.startsWith('--ai-provider=')
    ) {
      importArgs.push(arg)
    }
  }

  let step = 1
  const runStartedAt = new Date().toISOString()

  log('=== REINS自動取得 + PDF分割 + 自動取り込み ===')
  log(`  監視ディレクトリ: ${watchDir}`)
  if (activeDir !== watchDir) log(`  今回の実行ディレクトリ: ${activeDir}`)
  log(`  ダウンロード: ${skipReins ? 'skip' : downloadArgs.includes('--headless') ? 'headless' : 'browser'}`)
  log(`  PDF分割: ${skipSplit ? 'skip' : 'auto'}`)
  log(`  AI: ${args.find(arg => arg.startsWith('--ai-provider='))?.replace('--ai-provider=', '') || process.env.MAISOKU_AI_PROVIDER || 'openai'}${args.includes('--codex-on-quota') || process.env.MAISOKU_CODEX_ON_QUOTA === 'true' ? ' (quota時Codex)' : ''}`)
  if (importArgs.includes('--dry-run')) log('  取り込み: dry-run')
  log('')

  // Step 1: REINS DL
  if (!skipReins) {
    log(`${step}. REINSからマイソクを取得`)
    await runTsxScript(reinsScript, downloadArgs, sharedEnv)
    step++
  }

  // Step 2: PDF分割
  if (!skipSplit) {
    log(`${step}. 結合PDFを個別ファイルに分割`)
    await splitCombinedPdfs(activeDir)
    step++
  }

  // Step 3: AI分類 + DB登録
  log(`${step}. ダウンロード済みPDFを自動解析して登録`)
  await runTsxScript(importScript, importArgs, sharedEnv)
  step++

  // Step 4: ポータル検証
  log(`${step}. ポータル登録結果を確認`)
  await verifyPortal(runStartedAt)

  log('=== 完了 ===')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
