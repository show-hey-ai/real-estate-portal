import chokidar from 'chokidar'
import { resolve, basename, extname } from 'path'
import { rename, mkdir, stat, readFile, writeFile } from 'fs/promises'
import { config } from 'dotenv'
import { PDFDocument } from 'pdf-lib'

config({ path: resolve(process.cwd(), '.env') })

const WATCH_DIR = resolve(process.env.MAISOKU_WATCH_DIR?.replace('~', process.env.HOME || '') || `${process.env.HOME}/Downloads/maisoku`)
const PROCESSED_DIR = resolve(WATCH_DIR, 'processed')
const FAILED_DIR = resolve(WATCH_DIR, 'failed')
const SPLIT_DIR = resolve(WATCH_DIR, 'split')
const API_URL = process.env.IMPORT_API_URL || 'http://localhost:3000/api/admin/import'
const API_KEY = process.env.IMPORT_API_KEY

// 1MB以上のPDFは分割対象（一括DLの結合PDFを想定）
const SPLIT_THRESHOLD = 1 * 1024 * 1024

const SUPPORTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']
const processing = new Set<string>()

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
    } catch {
      return false
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return false
}

// 大きいPDFをページごとに分割
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

  // 元ファイルをprocessedに移動
  const dest = resolve(PROCESSED_DIR, `${Date.now()}_${basename(filePath)}`)
  await rename(filePath, dest)
  log(`分割完了: ${pageCount}ページ -> split/ へ出力`)

  return splitFiles
}

async function uploadFile(filePath: string): Promise<void> {
  const fileName = basename(filePath)

  if (processing.has(filePath)) return
  processing.add(filePath)

  try {
    log(`検知: ${fileName}`)

    const ready = await waitForFileReady(filePath)
    if (!ready) {
      logError(`ファイルの書き込み完了を待機できませんでした: ${fileName}`)
      return
    }

    // 大きいPDFは分割してから処理
    const ext = extname(fileName).toLowerCase()
    if (ext === '.pdf') {
      const s = await stat(filePath)
      if (s.size > SPLIT_THRESHOLD) {
        const splitFiles = await splitPdf(filePath)
        // 分割ファイルを順次アップロード
        for (const splitFile of splitFiles) {
          await uploadSingleFile(splitFile)
          // サーバー負荷軽減のため間隔を空ける
          await new Promise(r => setTimeout(r, 2000))
        }
        return
      }
    }

    await uploadSingleFile(filePath)
  } catch (err) {
    logError(`失敗: ${fileName} - ${err instanceof Error ? err.message : err}`)
    try {
      const dest = resolve(FAILED_DIR, `${Date.now()}_${fileName}`)
      await rename(filePath, dest)
      log(`移動: ${fileName} -> failed/`)
    } catch {
      // 移動失敗は無視
    }
  } finally {
    processing.delete(filePath)
  }
}

async function uploadSingleFile(filePath: string): Promise<void> {
  const fileName = basename(filePath)

  log(`アップロード中: ${fileName}`)

  const fileBuffer = await readFile(filePath)
  const ext = extname(fileName).toLowerCase()
  const mimeType = ext === '.pdf' ? 'application/pdf'
    : ext === '.png' ? 'image/png'
    : 'image/jpeg'

  const file = new File([fileBuffer], fileName, { type: mimeType })
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'x-api-key': API_KEY || '' },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API error ${response.status}: ${error}`)
  }

  const result = await response.json()

  if (result.skipped) {
    log(`スキップ: ${fileName} - ${result.reason}`)
  } else {
    log(`完了: ${fileName} -> 物件ID: ${result.listingId}`)
  }

  // 処理済みフォルダへ移動
  const dest = resolve(PROCESSED_DIR, `${Date.now()}_${fileName}`)
  await rename(filePath, dest)
  log(`移動: ${fileName} -> processed/`)
}

async function main() {
  if (!API_KEY) {
    logError('IMPORT_API_KEY が設定されていません。.env を確認してください。')
    process.exit(1)
  }

  await ensureDirs()

  log('=== マイソク自動アップロード ===')
  log(`監視フォルダ: ${WATCH_DIR}`)
  log(`API: ${API_URL}`)
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

    // processed/ failed/ split/ 内のファイルは無視
    if (filePath.startsWith(PROCESSED_DIR) || filePath.startsWith(FAILED_DIR) || filePath.startsWith(SPLIT_DIR)) return

    uploadFile(filePath)
  })

  watcher.on('error', (err: Error) => logError(`監視エラー: ${err.message}`))

  process.on('SIGINT', () => {
    log('終了します...')
    watcher.close()
    process.exit(0)
  })
}

main()
