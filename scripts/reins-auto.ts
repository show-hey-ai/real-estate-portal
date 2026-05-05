import { spawn } from 'child_process'
import { resolve } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

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
async function splitCombinedPdfs() {
  log('結合PDFを個別ファイルに分割中...')

  // PyMuPDF (fitz) を使って分割
  const { execSync } = await import('child_process')

  const pythonScript = `
import fitz, os, glob, sys

maisoku_dir = sys.argv[1]
combined_pdfs = sorted(glob.glob(os.path.join(maisoku_dir, "zmn_list_*.pdf")))

if not combined_pdfs:
    print("分割対象の結合PDFなし")
    sys.exit(0)

print(f"{len(combined_pdfs)}件の結合PDFを検出")

total = 0
for pdf_path in combined_pdfs:
    doc = fitz.open(pdf_path)
    bn = os.path.splitext(os.path.basename(pdf_path))[0]
    for i in range(len(doc)):
        total += 1
        out = fitz.open()
        out.insert_pdf(doc, from_page=i, to_page=i)
        out.save(os.path.join(maisoku_dir, f"split_{bn}_p{i+1:03d}.pdf"))
        out.close()
    doc.close()

# 結合PDFを退避
combined_dir = os.path.join(maisoku_dir, "combined-originals")
os.makedirs(combined_dir, exist_ok=True)
for p in combined_pdfs:
    os.rename(p, os.path.join(combined_dir, os.path.basename(p)))

print(f"分割完了: {total}件の個別PDF作成、{len(combined_pdfs)}件の結合PDFを退避")
`

  try {
    const result = execSync(`python3 -c ${JSON.stringify(pythonScript)} ${JSON.stringify(watchDir)}`, {
      encoding: 'utf-8',
      timeout: 120000,
    })
    result.trim().split('\n').forEach(line => log(`  ${line}`))
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    // python3が無い場合のフォールバック: Node.jsのpdf-libで分割
    log('  python3/PyMuPDF が利用不可。フォールバック: 結合PDFをそのまま処理します')
    log(`  エラー: ${message.slice(0, 100)}`)
  }
}

// === ポータル検証: 登録済み物件をチェック ===
async function verifyPortal() {
  log('ポータル登録結果を確認中...')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    log('  ⚠ Supabase設定が見つかりません。検証スキップ')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // 最新の物件を取得（直近24時間以内に登録されたもの）
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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
    log('  直近24時間の新規登録なし')
    return
  }

  log(`  直近24時間の新規登録: ${listings.length}件`)
  log('')
  log('  管理番号    | 住所                           | 種別         | 価格        | 広告  | ステータス')
  log('  ' + '-'.repeat(100))

  const recentListings = (listings || []) as RecentListing[]

  for (const l of recentListings) {
    const addr = (l.addressPublic || '').slice(0, 28).padEnd(28)
    const type = (l.propertyType || '').slice(0, 10).padEnd(10)
    const price = l.price ? `¥${Number(l.price).toLocaleString()}万`.padEnd(10) : '不明'.padEnd(10)
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
  npx tsx scripts/reins-auto.ts --skip-reins --dir ~/Downloads/maisoku
  npx tsx scripts/reins-auto.ts --skip-reins --skip-split   # 分割済みの場合

Options:
  --headless          ブラウザ非表示でREINS操作
  --max-pages=N       REINSの最大ページ数 (default: 20)
  --max=N             取り込み最大件数
  --dry-run           取り込みのドライラン
  --skip-reins        REINSダウンロードをスキップ
  --skip-split        PDF分割をスキップ
  --dir <path>        監視ディレクトリ指定`)
    process.exit(0)
  }

  const sharedEnv = {
    ...process.env,
    MAISOKU_WATCH_DIR: watchDir,
  }

  const downloadArgs = args.filter(arg => arg === '--headless' || arg.startsWith('--max-pages='))
  const importArgs = ['--all', '--dir', watchDir]

  for (const arg of args) {
    if (arg === '--dry-run' || arg.startsWith('--max=')) {
      importArgs.push(arg)
    }
  }

  let step = 1

  log('=== REINS自動取得 + PDF分割 + 自動取り込み ===')
  log(`  監視ディレクトリ: ${watchDir}`)
  log(`  ダウンロード: ${skipReins ? 'skip' : downloadArgs.includes('--headless') ? 'headless' : 'browser'}`)
  log(`  PDF分割: ${skipSplit ? 'skip' : 'auto'}`)
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
    await splitCombinedPdfs()
    step++
  }

  // Step 3: AI分類 + DB登録
  log(`${step}. ダウンロード済みPDFを自動解析して登録`)
  await runTsxScript(importScript, importArgs, sharedEnv)
  step++

  // Step 4: ポータル検証
  log(`${step}. ポータル登録結果を確認`)
  await verifyPortal()

  log('=== 完了 ===')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
