/**
 * 一括PDFをClaude CLIローカルで処理するスクリプト
 * 分割 → 順次処理
 *
 * Usage: npx tsx scripts/bulk-process-local.ts <pdf-path>
 */
import { resolve, basename } from 'path'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { execSync } from 'child_process'
import { config } from 'dotenv'
import { PDFDocument } from 'pdf-lib'

config({ path: resolve(process.cwd(), '.env') })

const SPLIT_DIR = resolve(process.cwd(), 'tmp-split')
const SCRIPT_PATH = resolve(process.cwd(), 'scripts/process-maisoku-local.ts')

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

async function splitPdf(filePath: string): Promise<string[]> {
  const fileName = basename(filePath, '.pdf')
  const fileBuffer = await readFile(filePath)
  const pdfDoc = await PDFDocument.load(fileBuffer)
  const pageCount = pdfDoc.getPageCount()

  log(`PDF分割: ${basename(filePath)} (${pageCount}ページ)`)
  await mkdir(SPLIT_DIR, { recursive: true })
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

  log(`分割完了: ${pageCount}ページ`)
  return splitFiles
}

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/bulk-process-local.ts <pdf-path>')
    process.exit(1)
  }

  const absPath = resolve(filePath)
  const splitFiles = await splitPdf(absPath)

  let success = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < splitFiles.length; i++) {
    const file = splitFiles[i]
    log(`--- ページ ${i + 1}/${splitFiles.length} ---`)

    try {
      const result = execSync(`npx tsx ${SCRIPT_PATH} "${file}"`, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        timeout: 180000,
        cwd: process.cwd(),
      })

      const lines = result.trim().split('\n')
      const lastLine = lines[lines.length - 1]
      try {
        const json = JSON.parse(lastLine)
        if (json.skipped) {
          log(`スキップ: p${i + 1} - ${json.reason}`)
          skipped++
        } else if (json.success) {
          log(`完了: p${i + 1} -> 物件ID: ${json.listingId}`)
          success++
        }
      } catch {
        log(lines.pop() || '')
      }
    } catch (err) {
      log(`失敗: p${i + 1} - ${err instanceof Error ? err.message : err}`)
      failed++
    }

    // Claude CLI呼び出し間隔
    if (i < splitFiles.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  log('')
  log('=== 処理結果 ===')
  log(`成功: ${success}`)
  log(`スキップ: ${skipped}`)
  log(`失敗: ${failed}`)
  log(`合計: ${splitFiles.length}ページ`)
}

main()
