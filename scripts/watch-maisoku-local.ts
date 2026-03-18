/**
 * マイソク自動アップロード（Claude CLIローカル処理版）
 * GPT API不要 — Claude Code定額内で全処理
 *
 * Usage: npx tsx scripts/watch-maisoku-local.ts
 */
import chokidar from 'chokidar'
import { resolve, basename, extname } from 'path'
import { rename, mkdir, stat, readFile, writeFile } from 'fs/promises'
import { execSync } from 'child_process'
import { config } from 'dotenv'
import { PDFDocument } from 'pdf-lib'

config({ path: resolve(process.cwd(), '.env') })

const WATCH_DIR = resolve(process.env.MAISOKU_WATCH_DIR?.replace('~', process.env.HOME || '') || `${process.env.HOME}/Downloads/maisoku`)
const PROCESSED_DIR = resolve(WATCH_DIR, 'processed')
const FAILED_DIR = resolve(WATCH_DIR, 'failed')
const SPLIT_DIR = resolve(WATCH_DIR, 'split')
const SCRIPT_PATH = resolve(process.cwd(), 'scripts/process-maisoku-local.ts')

const SPLIT_THRESHOLD = 1 * 1024 * 1024
const SUPPORTED_EXTENSIONS = ['.pdf']
const CONCURRENCY = 3 // 並列処理数
const processing = new Set<string>()
let activeJobs = 0
const jobQueue: string[] = []

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

function logError(msg: string) {
  console.error(`[${new Date().toLocaleTimeString('ja-JP')}] ERROR: ${msg}`)
}

async function ensureDirs() {
  await mkdir(WATCH_DIR, { recursive: true })
  await mkdir(PROCESSED_DIR, { recursive: true })
  await mkdir(FAILED_DIR, { recursive: true })
  await mkdir(SPLIT_DIR, { recursive: true })
}

async function waitForFileReady(filePath: string, maxWait = 10000): Promise<boolean> {
  const start = Date.now()
  let lastSize = -1
  while (Date.now() - start < maxWait) {
    try {
      const s = await stat(filePath)
      if (s.size > 0 && s.size === lastSize) return true
      lastSize = s.size
    } catch { return false }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

async function splitPdf(filePath: string): Promise<string[]> {
  const fileName = basename(filePath, '.pdf')
  const fileBuffer = await readFile(filePath)
  const pdfDoc = await PDFDocument.load(fileBuffer)
  const pageCount = pdfDoc.getPageCount()

  log(`PDF分割: ${basename(filePath)} (${pageCount}ページ)`)
  const splitFiles: string[] = []

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create()
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i])
    newPdf.addPage(copiedPage)
    const pdfBytes = await newPdf.save()
    const splitPath = resolve(SPLIT_DIR, `${fileName}_p${i + 1}.pdf`)
    await writeFile(splitPath, pdfBytes)
    splitFiles.push(splitPath)
  }

  const dest = resolve(PROCESSED_DIR, `${Date.now()}_${basename(filePath)}`)
  await rename(filePath, dest)
  log(`分割完了: ${pageCount}ページ -> split/ へ出力`)
  return splitFiles
}

async function processWithClaude(filePath: string): Promise<void> {
  const fileName = basename(filePath)

  log(`Claude処理中: ${fileName}`)

  try {
    const result = execSync(`npx tsx ${SCRIPT_PATH} "${filePath}"`, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 180000, // 3分タイムアウト
      cwd: process.cwd(),
    })

    // 結果をパース
    const lines = result.trim().split('\n')
    const lastLine = lines[lines.length - 1]
    try {
      const json = JSON.parse(lastLine)
      if (json.skipped) {
        log(`スキップ: ${fileName} - ${json.reason}`)
      } else if (json.success) {
        log(`完了: ${fileName} -> 物件ID: ${json.listingId}`)
      }
    } catch {
      // JSON以外の出力はログとして表示
      log(result.trim().split('\n').pop() || '')
    }

    // 処理済みに移動
    const dest = resolve(PROCESSED_DIR, `${Date.now()}_${fileName}`)
    await rename(filePath, dest)
    log(`移動: ${fileName} -> processed/`)

  } catch (err) {
    logError(`失敗: ${fileName} - ${err instanceof Error ? err.message : err}`)
    try {
      const dest = resolve(FAILED_DIR, `${Date.now()}_${fileName}`)
      await rename(filePath, dest)
      log(`移動: ${fileName} -> failed/`)
    } catch {
      // 移動失敗は無視
    }
  }
}

// 並列キュー処理
function drainQueue() {
  while (activeJobs < CONCURRENCY && jobQueue.length > 0) {
    const file = jobQueue.shift()!
    activeJobs++
    log(`[並列${activeJobs}/${CONCURRENCY}] 開始: ${basename(file)} (残キュー: ${jobQueue.length})`)
    processWithClaude(file)
      .then(() => {
        activeJobs--
        drainQueue() // 次のジョブを起動
      })
      .catch(() => {
        activeJobs--
        drainQueue()
      })
  }
}

async function handleFile(filePath: string): Promise<void> {
  const fileName = basename(filePath)
  if (processing.has(filePath)) return
  processing.add(filePath)

  try {
    log(`検知: ${fileName}`)
    const ready = await waitForFileReady(filePath)
    if (!ready) {
      logError(`ファイル待機タイムアウト: ${fileName}`)
      return
    }

    // 大きいPDFは分割してキューに追加
    const ext = extname(fileName).toLowerCase()
    if (ext === '.pdf') {
      const s = await stat(filePath)
      if (s.size > SPLIT_THRESHOLD) {
        const splitFiles = await splitPdf(filePath)
        for (const splitFile of splitFiles) {
          jobQueue.push(splitFile)
        }
        drainQueue()
        return
      }
    }

    jobQueue.push(filePath)
    drainQueue()
  } catch (err) {
    logError(`失敗: ${fileName} - ${err instanceof Error ? err.message : err}`)
  } finally {
    processing.delete(filePath)
  }
}

async function main() {
  await ensureDirs()

  log('=== マイソク自動アップロード（Claude CLIローカル版） ===')
  log(`監視フォルダ: ${WATCH_DIR}`)
  log(`処理: Claude CLI (GPT API不使用)`)
  log(`分割閾値: ${(SPLIT_THRESHOLD / 1024 / 1024).toFixed(1)}MB`)
  log('Ctrl+C で終了')
  log('')

  const watcher = chokidar.watch(WATCH_DIR, {
    ignoreInitial: false,
    depth: 0,
    awaitWriteFinish: { stabilityThreshold: 1000, pollInterval: 200 },
  })

  watcher.on('add', (filePath: string) => {
    const ext = extname(filePath).toLowerCase()
    if (!SUPPORTED_EXTENSIONS.includes(ext)) return
    if (filePath.startsWith(PROCESSED_DIR) || filePath.startsWith(FAILED_DIR) || filePath.startsWith(SPLIT_DIR)) return
    handleFile(filePath)
  })

  watcher.on('error', (err: Error) => logError(`監視エラー: ${err.message}`))

  process.on('SIGINT', () => {
    log('終了します...')
    watcher.close()
    process.exit(0)
  })
}

main()
