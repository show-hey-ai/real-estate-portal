/**
 * マイソクPDFを処理
 * Step1: Claude Sonnet 4.6（文書分類 + 広告判定）
 * Step2: Claude Sonnet 4.6（詳細抽出 + 構造化JSON）
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
import Anthropic from '@anthropic-ai/sdk'

config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const ADMIN_USER_ID = process.env.IMPORT_ADMIN_USER_ID!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

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

// PDF 1ページを画像化
async function pdfPageToImage(pdfBuffer: Buffer): Promise<Buffer> {
  const { pdf } = await import('pdf-to-img')
  const doc = await pdf(pdfBuffer, { scale: 2.5 })
  for await (const page of doc) {
    return Buffer.from(page)
  }
  throw new Error('No pages')
}

// 帯除去（下部15%カット）
async function removeBanner(imgBuffer: Buffer): Promise<Buffer> {
  const meta = await sharp(imgBuffer).metadata()
  const h = meta.height!
  const w = meta.width!
  return sharp(imgBuffer)
    .extract({ left: 0, top: 0, width: w, height: Math.round(h * 0.85) })
    .jpeg({ quality: 90 })
    .toBuffer()
}

// 住所整形
function formatPublicAddress(addr: string | null): { publicAddress: string | null; isBlocked: boolean } {
  if (!addr) return { publicAddress: null, isBlocked: false }
  const m = addr.match(/^(.+?(?:\d+丁目|\d+-\d+))/u)
  if (m) return { publicAddress: m[1], isBlocked: true }
  const c = addr.match(/^(.+?[市区町村])/u)
  if (c) return { publicAddress: c[1], isBlocked: true }
  return { publicAddress: addr, isBlocked: false }
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

  const base64 = imgBuffer.toString('base64')

  // --- Step 1: 文書分類 + 広告判定 (Claude Sonnet 4.6 — 日本語OCR精度重視) ---
  const CLASSIFY_SYSTEM_PROMPT = `あなたは不動産書類の分類AIです。画像を見て文書タイプと広告掲載許可ステータスを判定してください。

【文書タイプの定義】
- "売買マイソク": 売買用の物件資料（販売図面）。物件名・価格・所在地・面積・構造・利回り等が1ページに記載された販売チラシ。物件概要書も含む。
- "賃貸マイソク": 賃貸用の物件資料。「賃料」「管理費」「敷金」「礼金」等の賃貸条件が記載。
- "物件一覧表": 複数物件が表形式でリストされたページ。
- "目次・索引": 目次、インデックス、地図のみのページ。
- "業者向け資料": FAX送付状、仲介手数料表、申込書、請求書。
- "白紙・判読不能": 白紙、または文字がほぼ読めないページ。
- "その他": 上記に該当しない。

【広告掲載許可ステータス（ad_status）の判定】
★★★ 必ずページ下部の帯（オビ）・バナー部分を重点的に確認すること ★★★
小さい文字で「広告」に関する記載がある場合が多い。見落とし厳禁。

- "allowed": 以下のいずれかの記載がある場合
  ・「広告掲載：可」「広告掲載全媒介可」「承諾不要」
  ・「自社HP掲載可」「自社HPは可」「御社ホームページのみ掲載可能」「自社媒体のみ広告可」
  ・「紙媒体・自社HPは可」
  ・「広告掲載申請（自社ホームページのみ）」
  ※「SUUMO等ポータル厳禁」「SNS掲載不可」でも「自社HP可」なら "allowed"
  ※「楽待不可」「健美家不可」等の特定媒体のみ不可 → "allowed"

- "approval_needed": 以下のいずれかの記載がある場合
  ・「広告承認」（帯に記載）
  ・「物件確認・広告掲載はこちらから」等の広告申込窓口の案内
  ・「承諾書なき広告は一切禁止」（＝承諾書取得で可能）
  ・「広告両面協議はメールにて承諾書を」
  ・「広告可 要連絡」「広告可（但し要連絡）」「広告可・要連絡」（要連絡＝事前承諾必要）
  ・「広告転載不可（物件のご紹介のみ可）」（転載不可だがご紹介は可→確認が必要）

- "denied": 以下のいずれかの記載がある場合
  ・「広告転載不可」「広告掲載厳禁」「広告掲載一切不可」「広告不可」「広告：不可」

- "not_mentioned": 上記いずれの記載もない

【注意】
- 「広告有効期限 YYYY/MM」はREINSの登録期限であり広告許可とは無関係 → 無視すること
- 帯の中の小さい文字を見逃さないこと

JSONのみで返してください（余計なテキスト不要）:
{"document_type": "...", "is_sale_property": true/false, "ad_status": "allowed|approval_needed|denied|not_mentioned", "ad_evidence": "広告関連の原文を引用（なければnull）", "reason": "判定理由を20文字以内で"}`

  // Claude API呼び出しヘルパー（リトライ付き）
  async function callClaude(system: string, userText: string, imgBase64: string, maxTokens: number): Promise<string> {
    const MAX_RETRIES = 2
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTokens,
          system,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: userText },
                { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imgBase64 } },
              ],
            },
          ],
        })
        return res.content[0]?.type === 'text' ? res.content[0].text : ''
      } catch (err) {
        if (attempt < MAX_RETRIES) {
          log(`  ⚠ Claude API失敗 (${attempt + 1}/${MAX_RETRIES}), リトライ中... ${err instanceof Error ? err.message.slice(0, 80) : err}`)
          await new Promise(r => setTimeout(r, 3000 * (attempt + 1)))
        } else {
          throw err
        }
      }
    }
    throw new Error('unreachable')
  }

  log(`  Step1: 文書分類中...`)
  let classifyRaw = ''
  try {
    classifyRaw = await callClaude(CLASSIFY_SYSTEM_PROMPT, 'この書類を分類してください。', base64, 256)
  } catch (err) {
    return { skipped: true, reason: `分類API失敗: ${err instanceof Error ? err.message.slice(0, 100) : err}` }
  }
  const classifyMatch = classifyRaw.match(/\{[\s\S]*\}/)
  if (!classifyMatch) return { skipped: true, reason: '分類JSON抽出失敗' }

  let classifyData: { document_type: string; is_sale_property: boolean; ad_status: string; ad_evidence: string | null; reason: string }
  try { classifyData = JSON.parse(classifyMatch[0]) } catch { return { skipped: true, reason: '分類JSONパース失敗' } }

  log(`  分類結果: ${classifyData.document_type} / 広告=${classifyData.ad_status} (${classifyData.reason})`)

  if (!classifyData.is_sale_property) {
    return { skipped: true, reason: `非売買物件 [${classifyData.document_type}] ${classifyData.reason}` }
  }

  // 広告ステータスで早期スキップ（denied/not_mentioned → Step2不要）
  if (classifyData.ad_status === 'denied') {
    return { skipped: true, reason: `広告不可（明示）: ${classifyData.ad_evidence || ''}` }
  }
  if (classifyData.ad_status === 'not_mentioned') {
    return { skipped: true, reason: '広告許可の記載なし' }
  }

  // --- Step 2: 詳細抽出 (Claude Sonnet 4.6 — allowed/approval_needed のみ) ---
  const EXTRACT_SYSTEM_PROMPT = `あなたは不動産マイソク（販売図面）の情報抽出AIです。

【抽出ルール】
- 不明な項目はnull。推測で埋めない。
- 価格は円単位の整数。コンマは千位区切り記号であり小数点ではない。
  例: 1億2000万円 → 120000000 / 11,980万円 → 119800000 / 5,800万円 → 58000000
  ⚠ 「11,980万円」は11億9800万ではなく1億1980万円（119,800,000円）。万円単位のときは×10,000する。
  例: 4億1,999万円 → 419990000 / 3億9,000万円 → 390000000 / 2億4,990万円 → 249900000
  ⚠ 億+万の混在価格: 4億1,999万 = 4×100,000,000 + 1999×10,000 = 419,990,000円。億部分を絶対に落とさないこと。
  ⚠ 億単位の価格を万に誤変換しない: 4.2億 = 420,000,000円（42,000,000ではない）
- 築年は西暦（例: 平成5年 → 1993、昭和63年 → 1988）
- ad_allowed判定（下部の帯・オビを重点確認）:
  true: 「広告掲載：可」「広告掲載全媒介可」「承諾不要」「自社HP掲載可」「自社HPは可」「御社HP掲載可」「自社媒体のみ可」「紙媒体・自社HPは可」「広告掲載申請（自社HPのみ）」
  true: 「SUUMO等ポータル厳禁」でも「自社HP可」なら true
  true: 「楽待不可」「健美家不可」等の特定媒体のみ不可 → true（自社ポータルは該当しない）
  false: 「広告転載不可」「広告掲載厳禁」「広告掲載一切不可」
  false: 「広告可 要連絡」「広告可（但し要連絡）」「広告可・要連絡」 → false（要連絡＝事前承諾が必要）
  false: 「広告転載不可（物件のご紹介のみ可）」→ false（承諾確認が必要）
  false: 記載なし
  ※「広告有効期限 YYYY/MM」はREINS登録期限で広告許可とは無関係 → 無視
- description_ja: 投資家向けに150-300文字でまとめる（マイソクの情報から魅力・投資メリットを構成）
- description_en / description_zh_tw / description_zh_cn: それぞれ自然な翻訳
- 各フィールドの抽出元テキストをevidenceに記録

以下のJSON形式のみで返してください（余計なテキスト不要）:
{
  "property_type": "区分マンション" | "一棟マンション" | "一棟アパート" | "戸建" | "土地" | "店舗・事務所" | "その他" | null,
  "price": 整数(円) | null,
  "address_full": "番地まで含む完全な住所" | null,
  "prefecture": "都道府県" | null,
  "city": "市区町村" | null,
  "stations": [{"name": "駅名", "line": "路線名" | null, "walk_minutes": 整数 | null}],
  "land_area": 数値(㎡) | null,
  "building_area": 数値(㎡) | null,
  "floor_count": 整数 | null,
  "built_year": 整数(西暦) | null,
  "built_month": 整数 | null,
  "structure": "RC" | "SRC" | "S" | "木造" | "軽量鉄骨" | "その他" | null,
  "zoning": "用途地域" | null,
  "current_status": "現況" | null,
  "delivery_date": "引渡日" | null,
  "ad_allowed": true | false,
  "yield_gross": 数値(%) | null,
  "yield_net": 数値(%) | null,
  "features": ["特徴1", ...],
  "description_ja": "日本語説明文(150-300文字)",
  "description_en": "English description",
  "description_zh_tw": "繁體中文說明",
  "description_zh_cn": "简体中文说明",
  "warnings": ["注意点", ...],
  "confidence": {"overall": 0.0-1.0, "price": 0.0-1.0, "address": 0.0-1.0, "area": 0.0-1.0},
  "evidence": [{"field": "フィールド名", "raw_text": "原文", "confidence": 0.0-1.0}]
}`

  log(`  Step2: 詳細抽出中...`)
  let extractRaw = ''
  try {
    extractRaw = await callClaude(EXTRACT_SYSTEM_PROMPT, 'この売買マイソクから物件情報を抽出してください。', base64, 4096)
  } catch (err) {
    return { skipped: true, reason: `抽出API失敗: ${err instanceof Error ? err.message.slice(0, 100) : err}` }
  }

  const jsonMatch = extractRaw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { skipped: true, reason: 'Step2 JSON抽出失敗' }

  let data: Record<string, unknown>
  try { data = JSON.parse(jsonMatch[0]) } catch { return { skipped: true, reason: 'Step2 JSONパース失敗' } }

  // ad_statusはStep1で既にfilter済み（allowed or approval_needed のみ到達）
  // Step1のad_statusを最終判定として使用（要連絡ルール含む）
  const adStatus = classifyData.ad_status as 'allowed' | 'approval_needed'
  // allowed → adAllowed=true / approval_needed → adAllowed=false（承諾必要アイコン表示）
  const adAllowed = adStatus === 'allowed'
  log(`  広告ステータス: ${adStatus} → adAllowed=${adAllowed}${adStatus === 'approval_needed' ? ' (承諾必要・要連絡)' : ''}`)

  const price = data.price ? Number(data.price) : null
  if (!price || price < 500_000 || price > 50_000_000_000) return { skipped: true, reason: `価格異常: ${price}` }
  if (!data.address_full && !data.prefecture) return { skipped: true, reason: '住所なし' }

  // 都心13区フィルタ
  if (!isInTokyo13ku(data.city as string | null, data.address_full as string | null)) {
    return { skipped: true, reason: `都心13区外: ${data.city || data.address_full}` }
  }

  // 重複チェック（住所+価格が一致する既存物件）
  const addrFull = data.address_full as string || ''
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
  log(`  画像処理（帯除去）...`)
  let croppedImg: Buffer | null = null
  try { croppedImg = await removeBanner(imgBuffer) } catch {}

  // ステータス決定: allowed のみ到達するので DRAFT
  const listingStatus = 'DRAFT'

  if (DRY_RUN) {
    log(`  [DRY-RUN] 登録対象: ${data.property_type} | ${data.address_full} | ${(price/10000).toLocaleString()}万円 | ステータス: ${listingStatus}`)
    return { success: true, listingId: 'DRY-RUN' }
  }

  // DB保存
  const addrResult = formatPublicAddress(data.address_full as string | null)
  const managementId = await getNextManagementId()
  const listingId = randomUUID()
  const now = new Date().toISOString()
  log(`  管理番号: ${managementId}`)

  const { error: dbErr } = await supabase.from('listings').insert({
    id: listingId,
    managementId,
    status: listingStatus,
    adAllowed: adAllowed,
    propertyType: data.property_type,
    price,
    addressPublic: addrResult.publicAddress,
    addressPrivate: data.address_full,
    addressBlocked: addrResult.isBlocked,
    prefecture: data.prefecture,
    city: data.city,
    stations: data.stations || [],
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
    features: data.features || [],
    descriptionJa: data.description_ja,
    descriptionEn: data.description_en,
    descriptionZhTw: data.description_zh_tw,
    descriptionZhCn: data.description_zh_cn,
    warnings: data.warnings || [],
    sourcePdfUrl: pdfUrl,
    sourcePdfPages: 1,
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

  log(`  ✓ 登録完了: ${listingId} | ${data.property_type} | ${data.address_full} | ${price?.toLocaleString()}円 | ${listingStatus}`)
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
