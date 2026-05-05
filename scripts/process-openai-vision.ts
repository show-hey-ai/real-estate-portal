/**
 * マイソクPDFを処理
 * Step1: OpenAI Vision（広告可否 + 自動掲載ゲート）
 * Step2: OpenAI Vision（詳細抽出 + 構造化JSON）
 *
 * Usage:
 *   npx tsx scripts/process-openai-vision.ts <pdf-path>       # 1ファイル処理
 *   npx tsx scripts/process-openai-vision.ts --all             # ~/Downloads全件処理
 *   npx tsx scripts/process-openai-vision.ts --all --dry-run   # 全件ドライラン
 *   npx tsx scripts/process-openai-vision.ts --all --max=5     # 最大5ファイル
 */
import { resolve, basename } from 'path'
import { readFile, readdir, mkdir, rename } from 'fs/promises'
import { PDFDocument } from 'pdf-lib'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import sharp from 'sharp'
import { openai, extractionSchema, extractionPrompt, translateDescription, EXTRACT_MODEL } from '../src/lib/openai'
import { sanitizeListingWarnings } from '../src/lib/listing-warnings'
import { normalizeTransitStations } from '../src/lib/transit-normalization'
import { formatPublicAddress } from '../src/lib/address'
import { normalizePropertyType } from '../src/lib/property-type'
import { prepareHospitalityCandidate, type HospitalityAssessment } from '../src/lib/hospitality-assessment'
import {
  analyzeMaisokuAdPolicyWithAI,
  removeCompanyBannerWithAI,
} from '../src/lib/maisoku-ai'

config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ADMIN_USER_ID = process.env.IMPORT_ADMIN_USER_ID!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// CLI引数
const ARGS = process.argv.slice(2)
const ALL_MODE = ARGS.includes('--all')
const DRY_RUN = ARGS.includes('--dry-run')
const maxArg = ARGS.find(a => a.startsWith('--max='))
const MAX_FILES = maxArg ? parseInt(maxArg.replace('--max=', ''), 10) : Infinity
const dirArgIndex = ARGS.indexOf('--dir')
const POSITIONAL_ARGS = ARGS.filter((arg, index) => {
  if (arg.startsWith('--')) return false
  if (dirArgIndex !== -1 && index === dirArgIndex + 1) return false
  return true
})
const WATCH_DIR = resolve(
  dirArgIndex !== -1 && ARGS[dirArgIndex + 1]
    ? ARGS[dirArgIndex + 1].replace('~', process.env.HOME || '')
    : process.env.MAISOKU_WATCH_DIR?.replace('~', process.env.HOME || '') || `${process.env.HOME}/Downloads/maisoku`
)
const PROCESSED_DIR = resolve(WATCH_DIR, 'maisoku-processed')

// 非マイソクファイルのスキップパターン
const SKIP_PATTERNS = [/invoice/i, /請求/, /申請書/, /fax_inquiry/i, /仲介手数料/, /merged.*pdf/i, /maisoku-processed/]

// 都心13区（対象エリア）
const TOKYO_13KU = ['千代田区','中央区','港区','新宿区','渋谷区','文京区','目黒区','品川区','豊島区','台東区','墨田区','江東区','大田区']

function isInTokyo13ku(city: string | null, address: string | null): boolean {
  const text = (city || '') + (address || '')
  return TOKYO_13KU.some(ku => text.includes(ku))
}

// 管理番号の自動採番
async function getNextManagementId(): Promise<string> {
  const { data } = await supabase
    .from('listings')
    .select('managementId')
    .not('managementId', 'is', null)
    .order('managementId', { ascending: false })
    .limit(1)
  const lastId = data?.[0]?.managementId || 'TP-0000'
  const num = parseInt(lastId.replace('TP-', ''), 10) + 1
  return `TP-${num.toString().padStart(4, '0')}`
}

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

interface ExtractedListingData {
  property_type: string | null
  price: number | null
  address_full: string | null
  prefecture: string | null
  city: string | null
  stations: {
    name: string
    name_en?: string | null
    line?: string | null
    walk_minutes?: number | null
  }[]
  land_area: number | null
  building_area: number | null
  floor_count: number | null
  built_year: number | null
  built_month: number | null
  structure: string | null
  zoning: string | null
  current_status: string | null
  delivery_date: string | null
  ad_allowed: boolean
  yield_gross: number | null
  yield_net: number | null
  description_ja: string | null
  appeal_points: string[]
  hospitality_assessment: HospitalityAssessment | null
  warnings: string[]
  confidence?: {
    overall: number
    price: number
    address: number
    area: number
  }
  evidence?: {
    field: string
    raw_text: string
    confidence: number
    page_number?: number | null
  }[]
}

// PDF 1ページを画像化（Vision API向けに長辺2048pxへリサイズ）
async function pdfPageToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const { pdf } = await import('pdf-to-img')
  const doc = await pdf(pdfBuffer, { scale: 2.5 })
  for await (const page of doc) {
    const raw = Buffer.from(page)
    // Vision APIの画像サイズ制限に収まるよう、長辺2048pxにリサイズ
    const meta = await sharp(raw).metadata()
    const maxDim = Math.max(meta.width ?? 0, meta.height ?? 0)
    if (maxDim > 2048) {
      return sharp(raw)
        .resize({ width: meta.width! > meta.height! ? 2048 : undefined,
                   height: meta.height! >= meta.width! ? 2048 : undefined,
                   fit: 'inside' })
        .png()
        .toBuffer()
    }
    return raw
  }
  throw new Error('No pages')
}

async function extractListingDataWithOpenAI(imgBuffer: Buffer): Promise<ExtractedListingData> {
  const base64 = imgBuffer.toString('base64')
  const response = await openai.chat.completions.create({
    model: EXTRACT_MODEL,
    messages: [
      {
        role: 'system',
        content: `${extractionPrompt}

【追加ルール】
- 広告可否は前段の高精度AIゲートで判定済み。ここでは物件情報抽出を優先する。
- ただし広告不可・要承諾が見えた場合は ad_allowed=false にする。
- evidence は読めた範囲で必ず付ける。`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'この売買マイソク画像から物件情報を抽出してください。' },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${base64}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: extractionSchema as Parameters<typeof openai.chat.completions.create>[0]['response_format'] extends { json_schema?: infer T } ? T : never,
    },
    max_tokens: 4096,
    temperature: 0,
  })

  return JSON.parse(response.choices[0]?.message?.content || '{}') as ExtractedListingData
}

async function processPage(pdfBuffer: Buffer, fileName: string, pageNum: number) {
  log(`  画像化中... (p${pageNum})`)

  // PDF → 画像
  let imgBuffer: Buffer
  try {
    imgBuffer = await pdfPageToImage(pdfBuffer)
  } catch (e) {
    return { skipped: true, reason: `画像化失敗: ${e}` }
  }

  log(`  Step1: AI広告判定中...`)
  let adAnalysis: Awaited<ReturnType<typeof analyzeMaisokuAdPolicyWithAI>>
  try {
    adAnalysis = await analyzeMaisokuAdPolicyWithAI(imgBuffer)
  } catch (err) {
    return { skipped: true, reason: `広告判定AI失敗: ${err instanceof Error ? err.message.slice(0, 160) : err}` }
  }

  log(`  広告判定: ${adAnalysis.document_type} / ${adAnalysis.status} / publish=${adAnalysis.can_publish} / confidence=${adAnalysis.confidence.toFixed(2)}`)

  if (!adAnalysis.is_sale_property) {
    return { skipped: true, reason: `非売買物件 [${adAnalysis.document_type}] ${adAnalysis.reason}` }
  }

  // 人間レビューなし運用のため、AIが高信頼でALLOWEDと検証したページだけ通す
  if (!adAnalysis.can_publish) {
    const evidence = [...adAnalysis.blocking_evidence, ...adAnalysis.positive_evidence]
      .filter(Boolean)
      .slice(0, 3)
      .join(' / ')
    return { skipped: true, reason: `広告掲載不可または不確実 [${adAnalysis.status}]: ${evidence || adAnalysis.reason}` }
  }

  log(`  Step2: OpenAI詳細抽出中...`)
  let data: ExtractedListingData
  try {
    data = await extractListingDataWithOpenAI(imgBuffer)
  } catch (err) {
    return { skipped: true, reason: `詳細抽出AI失敗: ${err instanceof Error ? err.message.slice(0, 120) : err}` }
  }

  const adAllowed = true
  log(`  広告ステータス: ${adAnalysis.status} → adAllowed=true`)

  const price = data.price ? Number(data.price) : null
  if (!price || price < 500_000 || price > 50_000_000_000) return { skipped: true, reason: `価格異常: ${price}` }
  if (!data.address_full && !data.prefecture) return { skipped: true, reason: '住所なし' }
  const normalizedStations = normalizeTransitStations(data.stations)
  const sanitizedWarnings = sanitizeListingWarnings(data.warnings)
  const propertyType = normalizePropertyType(data.property_type, {
    descriptionJa: data.description_ja,
    features: data.appeal_points,
    evidence: data.evidence,
    buildingArea: data.building_area,
    landArea: data.land_area,
    floorCount: data.floor_count,
  })

  if (propertyType === '区分マンション') {
    return { skipped: true, reason: '区分マンションは原則ポータル掲載対象外のためスキップ' }
  }

  const hospitalityCandidate = prepareHospitalityCandidate({
    propertyType,
    zoning: data.zoning,
    currentStatus: data.current_status,
    descriptionJa: data.description_ja,
    features: data.appeal_points,
    warnings: sanitizedWarnings,
    evidence: data.evidence,
    buildingArea: data.building_area,
    landArea: data.land_area,
    floorCount: data.floor_count,
    builtYear: data.built_year,
    structure: data.structure,
    stations: normalizedStations,
    assessment: data.hospitality_assessment,
  })

  let translations = {
    descriptionEn: '',
    descriptionZhTw: '',
    descriptionZhCn: '',
    featuresEn: [] as string[],
    featuresZhTw: [] as string[],
    featuresZhCn: [] as string[],
  }
  if (data.description_ja) {
    try {
      translations = await translateDescription(data.description_ja, hospitalityCandidate.features)
    } catch (err) {
      log(`  ⚠ 翻訳AI失敗。日本語のみ保存: ${err instanceof Error ? err.message.slice(0, 100) : err}`)
    }
  }

  // 都心13区フィルタ
  if (!isInTokyo13ku(data.city, data.address_full)) {
    return { skipped: true, reason: `都心13区外: ${data.city || data.address_full}` }
  }

  // 重複チェック（住所+価格が一致する既存物件）
  const addrFull = data.address_full || ''
  if (addrFull && price) {
    const { data: existing } = await supabase
      .from('listings')
      .select('managementId')
      .eq('addressPrivate', addrFull)
      .eq('price', price)
      .limit(1)
    if (existing && existing.length > 0) {
      return { skipped: true, reason: `重複: ${existing[0].managementId} と同一 (${addrFull})` }
    }
  }

  // PDF → Supabase Storage
  log(`  PDFアップロード中...`)
  const safeName = `${Date.now()}-${fileName.replace(/[^\x20-\x7E]/g, '_')}`
  const { error: upErr } = await supabase.storage.from('pdfs').upload(safeName, pdfBuffer, { contentType: 'application/pdf' })
  const pdfUrl = upErr ? '' : supabase.storage.from('pdfs').getPublicUrl(safeName).data.publicUrl

  // 帯除去画像
  log(`  AI画像処理（管理会社帯除去）...`)
  let croppedImg: Buffer | null = null
  try {
    croppedImg = await removeCompanyBannerWithAI(imgBuffer)
  } catch (err) {
    log(`  ⚠ 帯除去AI失敗。画像保存をスキップ: ${err instanceof Error ? err.message.slice(0, 120) : err}`)
  }

  // ステータス決定: allowed のみ到達するので DRAFT
  const listingStatus = 'DRAFT'

  if (DRY_RUN) {
    log(`  [DRY-RUN] 登録対象: ${propertyType} / ${hospitalityCandidate.category} | score ${hospitalityCandidate.assessment.potential_score}/5 | ${data.address_full} | ${(price/10000).toLocaleString()}万円 | ステータス: ${listingStatus}`)
    return { success: true, listingId: 'DRY-RUN' }
  }

  // DB保存
  const addrResult = formatPublicAddress(data.address_full)
  const managementId = await getNextManagementId()
  const listingId = randomUUID()
  const now = new Date().toISOString()
  log(`  管理番号: ${managementId}`)

  const { error: dbErr } = await supabase.from('listings').insert({
    id: listingId,
    managementId,
    status: listingStatus,
    adAllowed: adAllowed,
    propertyType,
    hospitalityCategory: hospitalityCandidate.category,
    price,
    addressPublic: addrResult.publicAddress,
    addressPrivate: data.address_full,
    addressBlocked: addrResult.isBlocked,
    prefecture: data.prefecture,
    city: data.city,
    stations: normalizedStations,
    landArea: data.land_area,
    buildingArea: data.building_area,
    floorCount: data.floor_count,
    builtYear: data.built_year,
    builtMonth: data.built_month,
    structure: data.structure,
    zoning: data.zoning,
    currentStatus: data.current_status,
    deliveryDate: data.delivery_date || null,
    yieldGross: data.yield_gross,
    yieldNet: data.yield_net,
    features: hospitalityCandidate.features,
    featuresEn: translations.featuresEn,
    featuresZhTw: translations.featuresZhTw,
    featuresZhCn: translations.featuresZhCn,
    descriptionJa: data.description_ja,
    descriptionEn: translations.descriptionEn,
    descriptionZhTw: translations.descriptionZhTw,
    descriptionZhCn: translations.descriptionZhCn,
    extractionConfidence: data.confidence?.overall || null,
    warnings: hospitalityCandidate.warnings,
    sourcePdfUrl: pdfUrl,
    sourcePdfPages: 1,
    adminNotes: hospitalityCandidate.adminNotes,
    createdById: ADMIN_USER_ID,
    createdAt: now,
    updatedAt: now,
  })

  if (dbErr) return { skipped: false, failed: true, reason: `DB保存失敗: ${JSON.stringify(dbErr)}` }

  // 画像保存
  if (croppedImg) {
    const imgPath = `${listingId}/page-0.jpg`
    const { error: imgErr } = await supabase.storage.from('media').upload(imgPath, croppedImg, { contentType: 'image/jpeg' })
    if (!imgErr) {
      const imgUrl = supabase.storage.from('media').getPublicUrl(imgPath).data.publicUrl
      await supabase.from('media').insert({
        id: randomUUID(), listingId, url: imgUrl,
        category: 'EXTERIOR', source: 'EXTRACTED', sortOrder: 0, isAdopted: true,
      })
    }
  }

  log(`  ✓ 登録完了: ${listingId} | ${propertyType} / ${hospitalityCandidate.category} | score ${hospitalityCandidate.assessment.potential_score}/5 | ${data.address_full} | ${price?.toLocaleString()}円 | ${listingStatus}`)
  return { success: true, listingId }
}

// 1ファイルを処理（複数ページ対応）
async function processFile(absPath: string): Promise<{ success: number; skipped: number; failed: number }> {
  const buffer = await readFile(absPath)
  const pdfDoc = await PDFDocument.load(buffer)
  const pageCount = pdfDoc.getPageCount()
  log(`ファイル: ${basename(absPath)} (${pageCount}ページ)`)

  let success = 0, skipped = 0, failed = 0

  for (let i = 0; i < pageCount; i++) {
    log(`\n--- ページ ${i + 1}/${pageCount} ---`)
    const singlePdf = await PDFDocument.create()
    const [p] = await singlePdf.copyPages(pdfDoc, [i])
    singlePdf.addPage(p)
    const pageBuffer = Buffer.from(await singlePdf.save())

    try {
      const result = await processPage(pageBuffer, `${basename(absPath)}_p${i+1}.pdf`, i + 1)
      if (result.success) success++
      else if (result.failed) { failed++; log(`  ✗ ${result.reason}`) }
      else { skipped++; log(`  - スキップ: ${result.reason}`) }
    } catch (e) {
      failed++
      log(`  ✗ 例外: ${e instanceof Error ? e.message.slice(0, 200) : e}`)
    }

    if (i < pageCount - 1) await new Promise(r => setTimeout(r, 3000))
  }

  return { success, skipped, failed }
}

async function main() {
  // ヘルプ
  if (ARGS.includes('--help') || ARGS.includes('-h')) {
    console.log(`Usage:
  npx tsx scripts/process-openai-vision.ts <pdf-path>       # 1ファイル処理
  npx tsx scripts/process-openai-vision.ts --all             # 監視ディレクトリ全件処理
  npx tsx scripts/process-openai-vision.ts --all --dir ~/Downloads/maisoku
  npx tsx scripts/process-openai-vision.ts --all --dry-run   # ドライラン
  npx tsx scripts/process-openai-vision.ts --all --max=5     # 最大5件`)
    process.exit(0)
  }

  if (ALL_MODE) {
    // === 全件処理モード ===
    log('=== マイソク全件処理モード ===')
    log(`  監視ディレクトリ: ${WATCH_DIR}`)
    if (DRY_RUN) log('  ※ DRY-RUNモード（DB書き込みなし）')

    await mkdir(WATCH_DIR, { recursive: true })
    await mkdir(PROCESSED_DIR, { recursive: true })
    const processedFiles = new Set(await readdir(PROCESSED_DIR).catch(() => []))

    const allFiles = await readdir(WATCH_DIR)
    const pdfFiles = allFiles
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .filter(f => !processedFiles.has(f))
      .filter(f => !SKIP_PATTERNS.some(p => p.test(f)))
      .slice(0, MAX_FILES)

    log(`対象PDF: ${pdfFiles.length}件`)
    if (pdfFiles.length === 0) { log('処理対象なし'); return }

    let totalSuccess = 0, totalSkipped = 0, totalFailed = 0

    for (let i = 0; i < pdfFiles.length; i++) {
      const fileName = pdfFiles[i]
      const filePath = resolve(WATCH_DIR, fileName)
      log(`\n========== [${i + 1}/${pdfFiles.length}] ${fileName} ==========`)

      try {
        const result = await processFile(filePath)
        totalSuccess += result.success
        totalSkipped += result.skipped
        totalFailed += result.failed

        // 処理済みに移動（DRY-RUN以外）
        if (!DRY_RUN) {
          await rename(filePath, resolve(PROCESSED_DIR, fileName))
          log(`  → maisoku-processed/ に移動`)
        }
      } catch (e) {
        totalFailed++
        log(`  ✗ ファイル例外: ${e instanceof Error ? e.message.slice(0, 200) : e}`)
      }

      // ファイル間の待機
      if (i < pdfFiles.length - 1) await new Promise(r => setTimeout(r, 2000))
    }

    log(`\n${'='.repeat(50)}`)
    log(`=== 全体結果: 成功${totalSuccess} / スキップ${totalSkipped} / 失敗${totalFailed} ===`)

  } else {
    // === 単一ファイルモード ===
    const filePath = POSITIONAL_ARGS[0]
    if (!filePath) {
      console.error('Usage: npx tsx scripts/process-openai-vision.ts <pdf> [--dry-run]')
      console.error('       npx tsx scripts/process-openai-vision.ts --all [--dir <path>] [--dry-run] [--max=N]')
      process.exit(1)
    }

    const absPath = resolve(filePath)
    if (DRY_RUN) log('※ DRY-RUNモード')
    const { success, skipped, failed } = await processFile(absPath)
    log(`\n=== 結果: 成功${success} / スキップ${skipped} / 失敗${failed} ===`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
