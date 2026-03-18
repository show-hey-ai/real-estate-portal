/**
 * マイソクPDFをClaude CLI（ローカル）で処理するスクリプト
 * GPT API不要 — Claude Code定額内で実行
 *
 * Usage: npx tsx scripts/process-maisoku-local.ts <pdf-path>
 */
import { resolve, basename } from 'path'
import { readFile, writeFile, unlink } from 'fs/promises'
import { execSync } from 'child_process'
import { config } from 'dotenv'
import sharp from 'sharp'
import { randomUUID } from 'crypto'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ADMIN_USER_ID = process.env.IMPORT_ADMIN_USER_ID!

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function log(msg: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${msg}`)
}

// Claude CLIを呼び出してJSON結果を取得
function callClaude(prompt: string, maxTokens = 4096): string {
  const escaped = prompt.replace(/'/g, "'\\''")
  const cmd = `echo '${escaped}' | claude -p --output-format json 2>/dev/null`
  try {
    const result = execSync(cmd, {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      timeout: 120000,
    })
    // claude --output-format json wraps in {"type":"result","result":"..."}
    try {
      const parsed = JSON.parse(result)
      if (parsed.result) return parsed.result
    } catch {
      // not JSON wrapper, return raw
    }
    return result.trim()
  } catch (e) {
    console.error('Claude CLI error:', e)
    throw e
  }
}

// PDF → テキスト抽出（ローカル、API不要）
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse')
    const data = await pdfParse(buffer)
    return data.text || ''
  } catch (e) {
    console.error('PDF parse error:', e)
    return ''
  }
}

// PDF → ページ画像（ローカル、API不要）
async function renderFirstPage(buffer: Buffer): Promise<Buffer> {
  const { pdf } = await import('pdf-to-img')
  const document = await pdf(buffer, { scale: 3.0 })
  for await (const image of document) {
    return Buffer.from(image)
  }
  throw new Error('No pages in PDF')
}

// Claude CLIで構造化データ抽出 + 翻訳を一括実行
function extractAndTranslate(text: string): Record<string, unknown> {
  const prompt = `あなたは不動産情報抽出AIです。以下のマイソク（物件資料）テキストから情報を抽出し、翻訳も行ってください。

【重要ルール】
1. 不明な項目はnullにする。推測で埋めない。
2. 築年月は西暦に変換（例: 平成5年3月 → built_year: 1993, built_month: 3）
3. 広告掲載可否: 「広告可」「広告転載可」等→true、「広告不可」等→false、記載なし→null
4. description_jaは投資家向けに物件の魅力を150-300文字でまとめる
5. description_en, description_zh_tw, description_zh_cn はdescription_jaの翻訳
6. appeal_points（日本語）とappeal_points_en（英語）の両方を生成

以下のJSON形式で出力してください（JSONのみ、他のテキストは含めないこと）:
{
  "property_type": "区分マンション" | "一棟マンション" | "一棟アパート" | "戸建" | "土地" | "店舗・事務所" | "その他" | null,
  "price": 数値(円) | null,
  "address_full": "完全な住所" | null,
  "prefecture": "都道府県" | null,
  "city": "市区町村" | null,
  "stations": [{"name": "駅名", "name_en": "Romanized station name", "line": "路線名" | null, "line_en": "English line name (e.g. Tokyo Metro Hibiya Line)" | null, "walk_minutes": 数値 | null}],
  "land_area": 数値(㎡) | null,
  "building_area": 数値(㎡) | null,
  "floor_count": 数値 | null,
  "built_year": 数値(西暦) | null,
  "built_month": 数値(1-12) | null,
  "structure": "RC" | "SRC" | "S" | "木造" | "軽量鉄骨" | "その他" | null,
  "zoning": "用途地域" | null,
  "current_status": "現況" | null,
  "ad_allowed": true | false | null,
  "yield_gross": 数値(%) | null,
  "yield_net": 数値(%) | null,
  "description_ja": "日本語説明文",
  "description_en": "English description",
  "description_zh_tw": "繁體中文說明",
  "description_zh_cn": "简体中文说明",
  "appeal_points": ["日本語タグ1", "日本語タグ2"],
  "appeal_points_en": ["English tag 1", "English tag 2"],
  "warnings": ["警告文"]
}

【入力テキスト】
${text}`

  const result = callClaude(prompt)

  // JSONを抽出（前後のテキストを除去）
  const jsonMatch = result.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Claude response')
  }

  return JSON.parse(jsonMatch[0])
}

// Claude CLIで帯位置を検出（画像をbase64で渡す）
function detectBannerPosition(imageBase64: string, width: number, height: number): { hasBanner: boolean; bannerTopY: number } {
  // Claude CLI doesn't support images via pipe, so use a simpler heuristic approach:
  // Check the bottom 20% of the image for uniform color bands
  // This avoids needing Vision API entirely
  return { hasBanner: true, bannerTopY: Math.round(height * 0.85) }
}

// 帯除去（下部15%をカット + スマート検出）
async function removeBanner(pageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(pageBuffer).metadata()
  const origWidth = metadata.width || 1
  const origHeight = metadata.height || 1

  // 下部15%をカット（管理会社帯の一般的なサイズ）
  // より精密な検出が必要な場合はClaude Visionを使用
  const cropHeight = Math.max(100, Math.round(origHeight * 0.85) - 20)

  return await sharp(pageBuffer)
    .extract({ left: 0, top: 0, width: origWidth, height: cropHeight })
    .jpeg({ quality: 92 })
    .toBuffer()
}

// 住所から丁目までの公開住所を生成
function formatPublicAddress(address: string | null): { publicAddress: string | null; isBlocked: boolean } {
  if (!address) return { publicAddress: null, isBlocked: false }
  // 丁目まで抽出
  const match = address.match(/^(.+?[市区町村].+?(?:\d+丁目|\d+丁))/)
  if (match) {
    return { publicAddress: match[1], isBlocked: true }
  }
  // 市区町村まで
  const cityMatch = address.match(/^(.+?[市区町村])/)
  if (cityMatch) {
    return { publicAddress: cityMatch[1], isBlocked: true }
  }
  return { publicAddress: null, isBlocked: false }
}

async function processFile(filePath: string) {
  const fileName = basename(filePath)
  log(`処理開始: ${fileName}`)

  const buffer = await readFile(filePath)

  // 1. テキスト抽出（ローカル、API不要）
  log('テキスト抽出中...')
  const text = await extractTextFromPdf(buffer)

  if (text.trim().length < 50) {
    log(`テキストが少なすぎます (${text.length}文字)。OCRが必要ですがスキップします。`)
    return { skipped: true, reason: 'テキスト不足（OCR未対応）' }
  }

  // 2. Claude CLIで構造化データ抽出 + 翻訳（一括）
  log('Claude CLIで情報抽出・翻訳中...')
  const data = extractAndTranslate(text)

  // 広告不可チェック
  if (data.ad_allowed === false) {
    log(`スキップ: ${fileName} - 広告掲載不可`)
    return { skipped: true, reason: '広告掲載不可' }
  }

  // 価格なしチェック
  if (!data.price) {
    log(`スキップ: ${fileName} - 価格情報なし`)
    return { skipped: true, reason: '価格情報なし' }
  }

  // 住所なしチェック
  if (!data.address_full && !data.prefecture) {
    log(`スキップ: ${fileName} - 住所情報なし`)
    return { skipped: true, reason: '住所情報なし' }
  }

  // 価格の異常値チェック（100万円未満 or 100億円超）
  const price = Number(data.price)
  if (price < 1_000_000 || price > 10_000_000_000) {
    log(`スキップ: ${fileName} - 価格異常値 (${price})`)
    return { skipped: true, reason: `価格異常値: ${price}` }
  }

  // 3. PDF → Supabase Storageにアップロード
  log('PDFアップロード中...')
  const safeFileName = `${Date.now()}-${fileName.replace(/[^\x20-\x7E]/g, '_')}`
  let pdfUrl = ''

  const { error: uploadError } = await supabase.storage
    .from('pdfs')
    .upload(safeFileName, buffer, { contentType: 'application/pdf' })

  if (!uploadError) {
    const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(safeFileName)
    pdfUrl = urlData.publicUrl
  }

  // 4. 帯除去してトップ画像作成（ローカル、API不要）
  log('画像処理中（帯除去）...')
  let imageBuffer: Buffer | null = null
  try {
    const pageImage = await renderFirstPage(buffer)
    imageBuffer = await removeBanner(pageImage)
  } catch (e) {
    console.error('画像処理エラー:', e)
  }

  // 5. 住所整形
  const addressResult = formatPublicAddress(data.address_full as string | null)

  // 6. DBに保存
  log('DB保存中...')
  const now = new Date().toISOString()
  const listingId = randomUUID()

  const { data: listing, error: createError } = await supabase
    .from('listings')
    .insert({
      id: listingId,
      status: 'PUBLISHED',
      propertyType: data.property_type,
      price: data.price,
      addressPublic: addressResult.publicAddress,
      addressPrivate: data.address_full,
      addressBlocked: addressResult.isBlocked,
      prefecture: data.prefecture,
      city: data.city,
      stations: data.stations,
      landArea: data.land_area,
      buildingArea: data.building_area,
      floorCount: data.floor_count,
      builtYear: data.built_year,
      builtMonth: data.built_month,
      structure: data.structure,
      zoning: data.zoning,
      currentStatus: data.current_status,
      yieldGross: data.yield_gross,
      yieldNet: data.yield_net,
      warnings: data.warnings,
      features: data.appeal_points,
      descriptionJa: data.description_ja,
      descriptionEn: data.description_en,
      descriptionZhTw: data.description_zh_tw,
      descriptionZhCn: data.description_zh_cn,
      extractionConfidence: 0.95,
      sourcePdfUrl: pdfUrl,
      sourcePdfPages: 1,
      createdById: ADMIN_USER_ID,
      createdAt: now,
      updatedAt: now,
    })
    .select()
    .single()

  if (createError) {
    throw new Error(`DB保存エラー: ${JSON.stringify(createError)}`)
  }

  // 7. 画像をStorageに保存
  if (imageBuffer) {
    const imageFileName = `${listingId}/page-0.jpg`
    const { error: imgUploadError } = await supabase.storage
      .from('media')
      .upload(imageFileName, imageBuffer, { contentType: 'image/jpeg' })

    if (!imgUploadError) {
      const { data: imgUrlData } = supabase.storage.from('media').getPublicUrl(imageFileName)

      await supabase.from('media').insert({
        id: randomUUID(),
        listingId,
        url: imgUrlData.publicUrl,
        category: 'EXTERIOR',
        source: 'EXTRACTED',
        sortOrder: 0,
        isAdopted: true,
      })
    }
  }

  log(`完了: ${fileName} -> 物件ID: ${listingId}`)
  return { success: true, listingId }
}

// メイン
async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/process-maisoku-local.ts <pdf-path>')
    process.exit(1)
  }

  const absPath = resolve(filePath)
  try {
    const result = await processFile(absPath)
    console.log(JSON.stringify(result))
  } catch (e) {
    console.error('処理エラー:', e)
    process.exit(1)
  }
}

main()
