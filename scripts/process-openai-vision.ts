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
import { spawnSync } from 'child_process'
import { tmpdir } from 'os'
import { resolve, basename, join } from 'path'
import { access, readFile, readdir, mkdir, rename, writeFile, rm } from 'fs/promises'
import { PDFDocument } from 'pdf-lib'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomUUID } from 'crypto'
import sharp from 'sharp'
import { openai, extractionSchema, extractionPrompt, translateDescription, EXTRACT_MODEL } from '../src/lib/openai'
import { sanitizeListingWarnings } from '../src/lib/listing-warnings'
import { normalizeTransitStations } from '../src/lib/transit-normalization'
import { formatPublicAddress } from '../src/lib/address'
import { normalizePropertyType } from '../src/lib/property-type'
import { isInvestmentTenancy, isPublicPropertyType } from '../src/lib/market-category'
import { formatJevMaisokuNote, reviewMaisokuWithJev } from '../src/lib/jev-maisoku'
import { enqueueImportAudit } from '../src/lib/autonomy/publication'
import { verifiedSourceId } from '../src/lib/autonomy/source-identity'
import { AD_PUBLICATION_RULES } from '../src/lib/ad-publication-policy'
import {
  type HospitalityAssessment,
} from '../src/lib/hospitality-assessment'
import {
  analyzeMaisokuAdPolicyWithAI,
  removeCompanyBannerWithAI,
  type BannerCropAnalysis,
  type MaisokuAdAnalysis,
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
const ALLOW_MISSING_STORAGE = ARGS.includes('--allow-missing-storage')
const CROP_TEST = ARGS.includes('--crop-test')
const cropOutArg = ARGS.find(a => a.startsWith('--out='))
const aiProviderArg = ARGS.find(a => a.startsWith('--ai-provider='))
const AI_PROVIDER = (aiProviderArg?.replace('--ai-provider=', '') || process.env.MAISOKU_AI_PROVIDER || 'openai').toLowerCase()
const CODEX_ON_QUOTA = ARGS.includes('--codex-on-quota') || process.env.MAISOKU_CODEX_ON_QUOTA === 'true'
const CODEX_BIN = process.env.CODEX_BIN || '/Applications/Codex.app/Contents/Resources/codex'
const CODEX_MODEL = process.env.MAISOKU_CODEX_MODEL || 'gpt-5.5'
const CODEX_REASONING_EFFORT = process.env.MAISOKU_CODEX_REASONING_EFFORT || 'low'
const CODEX_TIMEOUT_MS = Number(process.env.MAISOKU_CODEX_TIMEOUT_MS || 240000)
const CODEX_BANNER_VISION_WIDTH = 1200
const MIN_ALLOWED_CONFIDENCE = 0.86
const maxArg = ARGS.find(a => a.startsWith('--max='))
const MAX_FILES = maxArg ? parseInt(maxArg.replace('--max=', ''), 10) : Infinity
const maxPdfPagesArg = ARGS.find(a => a.startsWith('--max-pdf-pages='))
const MAX_PDF_PAGES = maxPdfPagesArg ? Math.max(1, parseInt(maxPdfPagesArg.replace('--max-pdf-pages=', ''), 10) || 1) : Infinity
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
const FAILED_DIR = resolve(WATCH_DIR, 'maisoku-failed')

// 非マイソクファイルのスキップパターン
const SKIP_PATTERNS = [/invoice/i, /請求/, /申請書/, /fax_inquiry/i, /仲介手数料/, /merged.*pdf/i, /maisoku-processed/]

// 売買対象エリア: 東京23区
const TOKYO_23KU = ['千代田区','中央区','港区','新宿区','渋谷区','文京区','品川区','豊島区','台東区','墨田区','江東区','大田区','目黒区','世田谷区','中野区','杉並区','北区','荒川区','板橋区','練馬区','足立区','葛飾区','江戸川区'] as const

function isInTokyo23ku(city: string | null, address: string | null): boolean {
  const text = (city || '') + (address || '')
  return TOKYO_23KU.some(ku => text.includes(ku))
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
  const dotIndex = path.lastIndexOf('.')
  const hasExtension = dotIndex > path.lastIndexOf('/')
  const base = hasExtension ? path.slice(0, dotIndex) : path
  const ext = hasExtension ? path.slice(dotIndex) : ''

  for (let index = 2; index < 1000; index++) {
    const candidate = `${base}-${index}${ext}`
    if (!(await pathExists(candidate))) return candidate
  }

  return `${base}-${Date.now()}${ext}`
}

function isManagementIdConflict(error: unknown) {
  if (!error || typeof error !== 'object') return false
  const value = error as { code?: string; message?: string; details?: string }
  const text = `${value.message || ''} ${value.details || ''}`
  return value.code === '23505' && /managementId/i.test(text)
}

class FatalPipelineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FatalPipelineError'
  }
}

function isFatalPipelineError(error: unknown) {
  return error instanceof FatalPipelineError
}

function isOpenAiQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /quota|billing details|insufficient_quota/i.test(message)
}

function getAiLabel() {
  if (AI_PROVIDER === 'codex') return `Codex/${CODEX_MODEL}`
  if (CODEX_ON_QUOTA) return `OpenAI -> Codex/${CODEX_MODEL} on quota`
  return 'OpenAI'
}

const codexAdSchema = {
  type: 'object',
  properties: {
    document_type: {
      type: 'string',
      enum: [
        'sale_maisoku',
        'rental_maisoku',
        'property_list',
        'index_or_map',
        'broker_document',
        'blank_or_unreadable',
        'other',
      ],
    },
    is_sale_property: { type: 'boolean' },
    ad_mentions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          raw_text: { type: 'string' },
          location: { type: 'string', enum: ['bottom_band', 'body', 'unknown'] },
          category: {
            type: 'string',
            enum: ['positive', 'negative', 'approval_needed', 'deadline', 'other'],
          },
          confidence: { type: 'number' },
        },
        required: ['raw_text', 'location', 'category', 'confidence'],
        additionalProperties: false,
      },
    },
    status: {
      type: 'string',
      enum: ['ALLOWED', 'DENIED', 'APPROVAL_NEEDED', 'NOT_MENTIONED', 'AMBIGUOUS'],
    },
    can_publish: { type: 'boolean' },
    positive_evidence: { type: 'array', items: { type: 'string' } },
    blocking_evidence: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
    reason: { type: 'string' },
    verified_allowed: { type: 'boolean' },
    verifier_blocking_texts: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'document_type',
    'is_sale_property',
    'ad_mentions',
    'status',
    'can_publish',
    'positive_evidence',
    'blocking_evidence',
    'confidence',
    'reason',
    'verified_allowed',
    'verifier_blocking_texts',
  ],
  additionalProperties: false,
}

const codexBannerCropSchema = {
  type: 'object',
  properties: {
    has_company_banner: { type: 'boolean' },
    banner_top_y: {
      type: 'integer',
      description: 'Provided image Y coordinate of the top edge of the company/broker footer band. If absent, use image height.',
    },
    confidence: { type: 'number' },
    reason: { type: 'string' },
  },
  required: ['has_company_banner', 'banner_top_y', 'confidence', 'reason'],
  additionalProperties: false,
}

const codexTranslationSchema = {
  type: 'object',
  properties: {
    description_en: { type: 'string' },
    description_zh_tw: { type: 'string' },
    description_zh_cn: { type: 'string' },
    features_en: { type: 'array', items: { type: 'string' } },
    features_zh_tw: { type: 'array', items: { type: 'string' } },
    features_zh_cn: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'description_en',
    'description_zh_tw',
    'description_zh_cn',
    'features_en',
    'features_zh_tw',
    'features_zh_cn',
  ],
  additionalProperties: false,
}

interface ListingTranslations {
  descriptionEn: string
  descriptionZhTw: string
  descriptionZhCn: string
  featuresEn: string[]
  featuresZhTw: string[]
  featuresZhCn: string[]
}

async function runCodexVisionJson<T>(imgBuffer: Buffer, schema: object, prompt: string, label: string): Promise<T> {
  const tempDir = await mkdtempCompat()
  const imagePath = join(tempDir, 'page.png')
  const schemaPath = join(tempDir, 'schema.json')
  const outputPath = join(tempDir, 'output.json')

  try {
    const pngBuffer = await sharp(imgBuffer).png().toBuffer()
    await Promise.all([
      writeFile(imagePath, pngBuffer),
      writeFile(schemaPath, JSON.stringify(schema, null, 2)),
    ])

    const args = [
      'exec',
      '--ephemeral',
      '--ignore-user-config',
      '--ignore-rules',
      '--sandbox',
      'read-only',
      '-m',
      CODEX_MODEL,
      '-c',
      `model_reasoning_effort="${CODEX_REASONING_EFFORT}"`,
      '--output-schema',
      schemaPath,
      '-i',
      imagePath,
      '-o',
      outputPath,
      prompt,
    ]
    const result = spawnSync(CODEX_BIN, args, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: CODEX_TIMEOUT_MS,
      maxBuffer: 20 * 1024 * 1024,
    })

    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      const stderr = result.stderr?.trim()
      const stdout = result.stdout?.trim()
      throw new Error(`Codex ${label} failed with code ${result.status}: ${(stderr || stdout || '').slice(0, 800)}`)
    }

    return JSON.parse(await readFile(outputPath, 'utf-8')) as T
  } finally {
    if (process.env.MAISOKU_CODEX_KEEP_TMP !== 'true') {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}

async function runCodexTextJson<T>(schema: object, prompt: string, label: string): Promise<T> {
  const tempDir = await mkdtempCompat()
  const schemaPath = join(tempDir, 'schema.json')
  const outputPath = join(tempDir, 'output.json')

  try {
    await writeFile(schemaPath, JSON.stringify(schema, null, 2))

    const result = spawnSync(CODEX_BIN, [
      'exec',
      '--ephemeral',
      '--ignore-user-config',
      '--ignore-rules',
      '--sandbox',
      'read-only',
      '-m',
      CODEX_MODEL,
      '-c',
      `model_reasoning_effort="${CODEX_REASONING_EFFORT}"`,
      '--output-schema',
      schemaPath,
      '-o',
      outputPath,
      prompt,
    ], {
      cwd: process.cwd(),
      encoding: 'utf-8',
      timeout: CODEX_TIMEOUT_MS,
      maxBuffer: 20 * 1024 * 1024,
    })

    if (result.error) {
      throw result.error
    }
    if (result.status !== 0) {
      const stderr = result.stderr?.trim()
      const stdout = result.stdout?.trim()
      throw new Error(`Codex ${label} failed with code ${result.status}: ${(stderr || stdout || '').slice(0, 800)}`)
    }

    return JSON.parse(await readFile(outputPath, 'utf-8')) as T
  } finally {
    if (process.env.MAISOKU_CODEX_KEEP_TMP !== 'true') {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}

async function mkdtempCompat() {
  const { mkdtemp } = await import('fs/promises')
  return mkdtemp(join(tmpdir(), 'maisoku-codex-'))
}

async function analyzeMaisokuAdPolicyWithCodex(imgBuffer: Buffer): Promise<MaisokuAdAnalysis> {
  const prompt = `Attached is one page of a Japanese real estate maisoku / broker sheet.

Return JSON only. Judge whether this page can be published on our own company Tokyo property portal.

${AD_PUBLICATION_RULES}
- Fill positive_evidence and blocking_evidence with short Japanese raw text snippets where possible.
- verified_allowed must be true only if you found clear positive evidence and no blocker.
- confidence must be low if the advertising text is small or unclear.`

  const result = await runCodexVisionJson<MaisokuAdAnalysis>(
    imgBuffer,
    codexAdSchema,
    prompt,
    'ad judgment'
  )

  return {
    ...result,
    status: result.can_publish && result.verified_allowed && result.status === 'ALLOWED' && result.confidence >= MIN_ALLOWED_CONFIDENCE
      ? 'ALLOWED'
      : result.status,
    can_publish:
      result.can_publish &&
      result.verified_allowed &&
      result.status === 'ALLOWED' &&
      result.confidence >= MIN_ALLOWED_CONFIDENCE,
  }
}

interface ExtractedListingData {
  reins_property_id?: string | null
  info_registered_at?: string | null
  info_updated_at?: string | null
  conditions_expiry?: string | null
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
- 自社ポータルに適用する未解消の広告禁止・未充足の承諾条件が見えた場合だけ ad_allowed=false にする。明示的な自社HP例外で解消された一般禁止は共通基準どおり扱う。
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

async function extractListingDataWithCodex(imgBuffer: Buffer): Promise<ExtractedListingData> {
  const prompt = `${extractionPrompt}

【画像入力】
Attached image is one page of a Japanese sale maisoku. Extract the property fields from the image and return JSON only matching the schema.

Additional rules:
- Use null for unknown fields. Do not invent missing details.
- price must be in yen, not man-yen.
- Keep address_full as the full visible address if readable.
- property_type must match the schema enum. Be strict about distinguishing whole buildings from unit condominiums.
- ad_allowed is already gated before this step, but set it false for any unresolved prohibition applying to our own portal or unmet consent condition. Evaluate expressly linked own-site exceptions using the shared advertising rules.
- warnings must not include advertising permission, REINS, media restrictions, or internal operation notes.`

  return runCodexVisionJson<ExtractedListingData>(
    imgBuffer,
    extractionSchema.schema as object,
    prompt,
    'property extraction'
  )
}

async function detectCompanyBannerWithCodex(pageBuffer: Buffer): Promise<BannerCropAnalysis> {
  const metadata = await sharp(pageBuffer).metadata()
  const originalHeight = metadata.height || 1

  const visionBuffer = await sharp(pageBuffer)
    .rotate()
    .resize({ width: CODEX_BANNER_VISION_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer()
  const visionMeta = await sharp(visionBuffer).metadata()
  const visionHeight = visionMeta.height || originalHeight
  const visionWidth = visionMeta.width || CODEX_BANNER_VISION_WIDTH

  const prompt = `Attached image is a Japanese real estate maisoku page.

Task: detect only the bottom company/broker footer band so it can be cropped off.

Image size you see: width ${visionWidth}px, height ${visionHeight}px.

Company/broker footer band features:
- horizontal block near the very bottom of the page
- contains company name, phone, fax, address, license number, staff name, logo, or QR
- not the property title, price, property details, floor plan, map, or photos

Return JSON only:
- has_company_banner: true only when the footer band is clearly present
- banner_top_y: Y coordinate in this provided image for the top edge of the footer band. If absent, use ${visionHeight}
- confidence: 0 to 1
- reason: short explanation

When uncertain, avoid cutting into property content.`

  const parsed = await runCodexVisionJson<BannerCropAnalysis>(
    visionBuffer,
    codexBannerCropSchema,
    prompt,
    'banner crop'
  )
  const scaleY = originalHeight / visionHeight

  return {
    ...parsed,
    banner_top_y: Math.round(parsed.banner_top_y * scaleY),
  }
}

async function removeCompanyBannerWithCodex(pageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(pageBuffer).metadata()
  const width = metadata.width || 1
  const height = metadata.height || 1
  const analysis = await detectCompanyBannerWithCodex(pageBuffer)

  if (!analysis.has_company_banner) {
    return sharp(pageBuffer).jpeg({ quality: 92 }).toBuffer()
  }

  if (
    analysis.confidence < 0.74 ||
    analysis.banner_top_y < Math.round(height * 0.45) ||
    analysis.banner_top_y > height
  ) {
    throw new Error(`Company banner crop is not reliable: ${JSON.stringify(analysis)}`)
  }

  const cropHeight = Math.max(100, Math.min(height, analysis.banner_top_y - 12))

  return sharp(pageBuffer)
    .extract({ left: 0, top: 0, width, height: cropHeight })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function analyzeMaisokuAdPolicy(imgBuffer: Buffer): Promise<MaisokuAdAnalysis> {
  if (AI_PROVIDER === 'codex') return analyzeMaisokuAdPolicyWithCodex(imgBuffer)

  try {
    return await analyzeMaisokuAdPolicyWithAI(imgBuffer)
  } catch (err) {
    if (CODEX_ON_QUOTA && isOpenAiQuotaError(err)) {
      log(`  OpenAI quota/billing error。Codex/${CODEX_MODEL}で広告判定に切替`)
      return analyzeMaisokuAdPolicyWithCodex(imgBuffer)
    }
    throw err
  }
}

async function extractListingData(imgBuffer: Buffer): Promise<ExtractedListingData> {
  if (AI_PROVIDER === 'codex') return extractListingDataWithCodex(imgBuffer)

  try {
    return await extractListingDataWithOpenAI(imgBuffer)
  } catch (err) {
    if (CODEX_ON_QUOTA && isOpenAiQuotaError(err)) {
      log(`  OpenAI quota/billing error。Codex/${CODEX_MODEL}で詳細抽出に切替`)
      return extractListingDataWithCodex(imgBuffer)
    }
    throw err
  }
}

async function removeCompanyBanner(imgBuffer: Buffer): Promise<Buffer> {
  if (AI_PROVIDER === 'codex') return removeCompanyBannerWithCodex(imgBuffer)

  try {
    return await removeCompanyBannerWithAI(imgBuffer)
  } catch (err) {
    if (CODEX_ON_QUOTA && isOpenAiQuotaError(err)) {
      log(`  OpenAI quota/billing error。Codex/${CODEX_MODEL}で帯除去に切替`)
      return removeCompanyBannerWithCodex(imgBuffer)
    }
    throw err
  }
}

async function translateDescriptionWithCodex(descriptionJa: string, featuresJa: string[]): Promise<ListingTranslations> {
  const prompt = `You are a professional real estate translator for an international investor-facing Japanese property portal.

Return JSON only. Translate the Japanese property description and feature tags into:
- English
- Traditional Chinese for Taiwan
- Simplified Chinese for mainland China

Requirements:
- Keep a professional, sales-oriented real estate tone.
- Preserve concrete details such as place names, prices, areas, yields, room counts, station access, legal/building risks, and hospitality conversion caveats.
- Do not add facts that are not present in the Japanese text.
- Description translations should stay concise and natural.
- Feature tag translations should remain short labels.

Japanese description:
${descriptionJa}

Japanese feature tags:
${featuresJa.length > 0 ? featuresJa.map(feature => `- ${feature}`).join('\n') : '- none'}`

  const result = await runCodexTextJson<{
    description_en: string
    description_zh_tw: string
    description_zh_cn: string
    features_en: string[]
    features_zh_tw: string[]
    features_zh_cn: string[]
  }>(codexTranslationSchema, prompt, 'translation')

  return {
    descriptionEn: result.description_en || '',
    descriptionZhTw: result.description_zh_tw || '',
    descriptionZhCn: result.description_zh_cn || '',
    featuresEn: result.features_en || [],
    featuresZhTw: result.features_zh_tw || [],
    featuresZhCn: result.features_zh_cn || [],
  }
}

async function translateListingDescription(descriptionJa: string, featuresJa: string[]): Promise<ListingTranslations> {
  if (AI_PROVIDER === 'codex') {
    return translateDescriptionWithCodex(descriptionJa, featuresJa)
  }

  try {
    return await translateDescription(descriptionJa, featuresJa)
  } catch (err) {
    if (CODEX_ON_QUOTA && isOpenAiQuotaError(err)) {
      log(`  OpenAI quota/billing error。Codex/${CODEX_MODEL}で翻訳に切替`)
      return translateDescriptionWithCodex(descriptionJa, featuresJa)
    }
    throw err
  }
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

  log(`  Step1: AI広告判定中... (${getAiLabel()})`)
  let adAnalysis: MaisokuAdAnalysis
  try {
    adAnalysis = await analyzeMaisokuAdPolicy(imgBuffer)
  } catch (err) {
    if (isOpenAiQuotaError(err)) {
      throw new FatalPipelineError(`OpenAI quota/billing error: ${err instanceof Error ? err.message.slice(0, 180) : err}`)
    }
    return { skipped: true, reason: `広告判定AI失敗: ${err instanceof Error ? err.message.slice(0, 160) : err}` }
  }

  log(`  広告判定: ${adAnalysis.document_type} / ${adAnalysis.status} / publish=${adAnalysis.can_publish} / confidence=${adAnalysis.confidence.toFixed(2)}`)

  if (!adAnalysis.is_sale_property) {
    return { skipped: true, reason: `非売買物件 [${adAnalysis.document_type}] ${adAnalysis.reason}` }
  }

  // 自動取込の段階では人が個別確認しないため、高信頼でALLOWEDと検証したページだけ下書きへ通す。
  if (!adAnalysis.can_publish) {
    if (process.env.AUTONOMY_JOB_ID && adAnalysis.status === 'DENIED' && adAnalysis.confidence >= 0.96) {
      const identityData = await extractListingData(imgBuffer)
      const sourceId = verifiedSourceId(identityData.reins_property_id, identityData.evidence)
      if (sourceId) {
        const { revokeSourcePermission } = await import('../src/lib/autonomy/intake')
        await revokeSourcePermission(sourceId)
      }
    }
    const evidence = [...adAnalysis.blocking_evidence, ...adAnalysis.positive_evidence]
      .filter(Boolean)
      .slice(0, 3)
      .join(' / ')
    return { skipped: true, reason: `広告掲載不可または不確実 [${adAnalysis.status}]: ${evidence || adAnalysis.reason}` }
  }

  log(`  Step2: 詳細抽出中... (${getAiLabel()})`)
  let data: ExtractedListingData
  try {
    data = await extractListingData(imgBuffer)
  } catch (err) {
    if (isOpenAiQuotaError(err)) {
      throw new FatalPipelineError(`OpenAI quota/billing error: ${err instanceof Error ? err.message.slice(0, 180) : err}`)
    }
    return { skipped: true, reason: `詳細抽出AI失敗: ${err instanceof Error ? err.message.slice(0, 120) : err}` }
  }

  if (data.ad_allowed !== true) {
    return { skipped: true, reason: '詳細抽出で広告不可または広告許可を確認できなかったため保留' }
  }
  const adAllowed = true
  log(`  広告ステータス: ${adAnalysis.status} / 詳細抽出でも広告可 → adAllowed=true`)

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

  if (!isPublicPropertyType(propertyType)) {
    return { skipped: true, reason: `売買対象外の物件種別: ${propertyType}` }
  }

  // 賃貸中の区分・戸建も投資用候補として保存し、資料の現況を残す。
  const tenancyText = [data.current_status, ...sanitizedWarnings, ...(data.evidence || []).map((item) => item.raw_text)].filter(Boolean).join(' ')
  const currentStatus = isInvestmentTenancy(tenancyText) ? '賃貸中（資料に記載。現況要確認）' : data.current_status

  // 東京23区フィルタ
  if (!isInTokyo23ku(data.city, data.address_full)) {
    return { skipped: true, reason: `東京23区外: ${data.city || data.address_full}` }
  }

  // 重複チェック（住所+価格が一致する既存物件）
  const addrFull = data.address_full || ''
  const sourcePropertyId = verifiedSourceId(data.reins_property_id, data.evidence)
  let renewing: { id: string; managementId: string; createdAt: string; updatedAt: string } | null = null
  if (process.env.AUTONOMY_JOB_ID && sourcePropertyId) {
    const { data: override, error: overrideError } = await supabase.from('autonomy_records').select('id').eq('ventureId', 'ziyou-portal').eq('dedupeKey', `source-override:${sourcePropertyId}`).maybeSingle()
    if (overrideError) throw new Error('Source override state could not be verified.')
    if (override) return { skipped: true, reason: '人による変更・停止を維持します' }
    const { data: existingSource, error: sourceLookupError } = await supabase.from('listings').select('id,managementId,createdAt,updatedAt,autonomyValidUntil').eq('sourcePropertyId', sourcePropertyId).maybeSingle()
    if (sourceLookupError) throw new Error('Source identity state could not be verified.')
    if (existingSource) {
      if (!existingSource.autonomyValidUntil) return { skipped: true, reason: '既存の手動登録物件は自動上書きしません' }
      renewing = existingSource
    }
  }
  if (addrFull && price && !renewing) {
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

  let jevNote = 'Jev予備判定: 未実施（APIキー未設定）。公開前に人が確認。'
  if (process.env.JEV_API_KEY) {
    try {
      const review = await reviewMaisokuWithJev({
        propertyType,
        price,
        city: data.city,
        buildingArea: data.building_area,
        landArea: data.land_area,
        builtYear: data.built_year,
        currentStatus,
        zoning: data.zoning,
        stationCount: normalizedStations.length,
        evidenceCount: data.evidence?.length || 0,
        features: data.appeal_points,
        warnings: sanitizedWarnings,
      })
      if (review) {
        jevNote = formatJevMaisokuNote(review)
        log(`  ${jevNote}`)
      }
    } catch (error) {
      jevNote = 'Jev予備判定: 通信・応答エラーにより未実施。公開前に人が確認。'
      log(`  ⚠ Jev予備判定エラー: ${error instanceof Error ? error.message : 'unknown'}`)
    }
  }

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
      translations = await translateListingDescription(data.description_ja, data.appeal_points)
    } catch (err) {
      log(`  ⚠ 翻訳AI失敗。日本語のみ保存: ${err instanceof Error ? err.message.slice(0, 100) : err}`)
    }
  }

  // ステータス決定: allowed のみ到達するので DRAFT
  const listingStatus = 'DRAFT'

  if (DRY_RUN) {
    log(`  [DRY-RUN] 登録対象: ${propertyType} | ${data.address_full} | ${(price/10000).toLocaleString()}万円 | ステータス: ${listingStatus}`)
    return { success: true, listingId: 'DRY-RUN' }
  }

  // PDF → Supabase Storage
  log(`  PDFアップロード中...`)
  const safeName = `${Date.now()}-${fileName.replace(/[^\x20-\x7E]/g, '_')}`
  const { error: upErr } = await supabase.storage
    .from('pdfs')
    .upload(safeName, pdfBuffer, { contentType: 'application/pdf' })
  if (upErr && !ALLOW_MISSING_STORAGE) {
    return { skipped: false, failed: true, reason: `PDFアップロード失敗: ${upErr.message}` }
  }
  if (upErr) {
    log(`  ⚠ PDFアップロード失敗。sourcePdfUrlなしで続行: ${upErr.message}`)
  }
  const pdfUrl = upErr ? '' : supabase.storage.from('pdfs').getPublicUrl(safeName).data.publicUrl

  // 帯除去画像
  log(`  AI画像処理（管理会社帯除去）...`)
  let croppedImg: Buffer | null = null
  try {
    if (!process.env.AUTONOMY_JOB_ID) croppedImg = await removeCompanyBanner(imgBuffer)
  } catch (err) {
    log(`  ⚠ 帯除去AI失敗。画像保存をスキップ: ${err instanceof Error ? err.message.slice(0, 120) : err}`)
  }

  // DB保存
  // Detailed disclosure waits for the desktop review of every original page and footer.
  const addrResult = formatPublicAddress(data.address_full)
  const listingId = renewing?.id || randomUUID()
  const now = new Date().toISOString()
  let managementId = ''
  let dbErr: unknown = null
  let savedListing: Record<string, unknown> | null = null

  for (let attempt = 1; attempt <= 5; attempt++) {
    managementId = renewing?.managementId || await getNextManagementId()
    log(`  管理番号: ${managementId}${attempt > 1 ? ` (retry ${attempt})` : ''}`)

    const values = {
      id: listingId,
      managementId,
      status: listingStatus,
      adAllowed: adAllowed,
      propertyType,
      hospitalityCategory: null,
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
      currentStatus,
      deliveryDate: data.delivery_date || null,
      yieldGross: data.yield_gross,
      yieldNet: data.yield_net,
      features: data.appeal_points,
      featuresEn: translations.featuresEn,
      featuresZhTw: translations.featuresZhTw,
      featuresZhCn: translations.featuresZhCn,
      descriptionJa: data.description_ja,
      descriptionEn: translations.descriptionEn,
      descriptionZhTw: translations.descriptionZhTw,
      descriptionZhCn: translations.descriptionZhCn,
      extractionConfidence: data.confidence?.overall || null,
      warnings: sanitizedWarnings,
      sourcePdfUrl: pdfUrl,
      sourcePropertyId,
      autonomyValidUntil: process.env.AUTONOMY_JOB_ID ? new Date(Date.now() - 1).toISOString() : null,
      infoRegisteredAt: data.info_registered_at ? new Date(data.info_registered_at).toISOString() : null,
      infoUpdatedAt: data.info_updated_at ? new Date(data.info_updated_at).toISOString() : null,
      conditionsExpiry: data.conditions_expiry ? new Date(data.conditions_expiry).toISOString() : null,
      sourcePdfPages: 1,
      adminNotes: jevNote,
      createdById: ADMIN_USER_ID,
      createdAt: renewing?.createdAt || now,
      updatedAt: now,
    }
    let saved: Record<string, unknown> | null
    let error: unknown = null
    if (renewing) {
      saved = await (await import('../src/lib/autonomy/intake')).renewAutomaticSourceListing(listingId, renewing.updatedAt, values)
      if (!saved) return { skipped: true, reason: '物件が変更されたため自動更新を中止' }
    } else {
      const inserted = await supabase.from('listings').insert(values).select().single()
      saved = inserted.data
      error = inserted.error
    }

    dbErr = error
    savedListing = saved
    if (!dbErr) break
    if (!isManagementIdConflict(dbErr)) break
    await new Promise(r => setTimeout(r, 500))
  }

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

  if (savedListing) {
    try {
      const queued = await enqueueImportAudit(supabase, listingId, savedListing, {
        sourceHash: process.env.AUTONOMY_SOURCE_HASH || createHash('sha256').update(pdfBuffer).digest('hex'), ad: adAnalysis,
        confidence: { overall: data.confidence?.overall ?? 0, price: data.confidence?.price ?? 0, address: data.confidence?.address ?? 0 },
        evidence: (data.evidence || []).map((item) => ({ field_name: item.field, raw_text: item.raw_text, confidence: item.confidence })),
      })
      log(queued ? '  自律運営の品質検査ジョブを登録' : '  自律運営の接続待ち。下書きは保存済み')
    } catch { log('  自律運営ジョブ登録失敗。下書きは保存済み') }
  }

  log(`  ✓ 登録完了: ${listingId} | ${propertyType} | ${data.address_full} | ${price?.toLocaleString()}円 | ${listingStatus}`)
  return { success: true, listingId }
}

// 1ファイルを処理（複数ページ対応）
async function processFile(absPath: string): Promise<{ success: number; skipped: number; failed: number }> {
  const buffer = await readFile(absPath)
  const pdfDoc = await PDFDocument.load(buffer)
  const pageCount = pdfDoc.getPageCount()
  log(`ファイル: ${basename(absPath)} (${pageCount}ページ)`)

  let success = 0, skipped = 0, failed = 0

  const pagesToProcess = Math.min(pageCount, MAX_PDF_PAGES)
  if (pagesToProcess < pageCount) {
    log(`処理ページ数制限: ${pagesToProcess}/${pageCount}ページ`)
  }

  for (let i = 0; i < pagesToProcess; i++) {
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
      if (isFatalPipelineError(e)) throw e
      failed++
      log(`  ✗ 例外: ${e instanceof Error ? e.message.slice(0, 200) : e}`)
    }

    if (i < pagesToProcess - 1) await new Promise(r => setTimeout(r, 3000))
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
  npx tsx scripts/process-openai-vision.ts --all --max=5     # 最大5件
  npx tsx scripts/process-openai-vision.ts --all --max-pdf-pages=1  # 各PDFの最大処理ページ数
  npx tsx scripts/process-openai-vision.ts --all --ai-provider=codex  # Codexで広告判定・抽出・帯除去
  npx tsx scripts/process-openai-vision.ts --all --codex-on-quota     # OpenAI 429時だけCodexへフォールバック
  npx tsx scripts/process-openai-vision.ts --crop-test <pdf-path> --ai-provider=codex --out=/tmp/cropped.jpg
  npx tsx scripts/process-openai-vision.ts --all --allow-missing-storage  # PDF保存失敗でもDB登録`)
    process.exit(0)
  }

  if (!['openai', 'codex'].includes(AI_PROVIDER)) {
    throw new FatalPipelineError(`Unknown AI provider: ${AI_PROVIDER}. Use --ai-provider=openai or --ai-provider=codex.`)
  }

  if (CROP_TEST) {
    const filePath = POSITIONAL_ARGS[0]
    if (!filePath) {
      throw new FatalPipelineError('Usage: npx tsx scripts/process-openai-vision.ts --crop-test <pdf-path> [--ai-provider=codex] [--out=/tmp/cropped.jpg]')
    }
    const absPath = resolve(filePath)
    const outputPath = resolve(
      cropOutArg?.replace('--out=', '') ||
      join(tmpdir(), `${basename(absPath).replace(/\.pdf$/i, '')}-cropped.jpg`)
    )

    log(`帯除去テスト: ${basename(absPath)} (${getAiLabel()})`)
    const imgBuffer = await pdfPageToImage(await readFile(absPath))
    const cropped = await removeCompanyBanner(imgBuffer)
    await writeFile(outputPath, cropped)
    log(`  出力: ${outputPath}`)
    return
  }

  if (ALL_MODE) {
    // === 全件処理モード ===
    log('=== マイソク全件処理モード ===')
    log(`  監視ディレクトリ: ${WATCH_DIR}`)
    log(`  AI: ${getAiLabel()}`)
    if (DRY_RUN) log('  ※ DRY-RUNモード（DB書き込みなし）')

    await mkdir(WATCH_DIR, { recursive: true })
    await mkdir(PROCESSED_DIR, { recursive: true })
    await mkdir(FAILED_DIR, { recursive: true })
    const processedFiles = new Set(await readdir(PROCESSED_DIR).catch(() => []))
    const failedFiles = new Set(await readdir(FAILED_DIR).catch(() => []))

    const allFiles = await readdir(WATCH_DIR)
    const pdfFiles = allFiles
      .filter(f => f.toLowerCase().endsWith('.pdf'))
      .filter(f => !processedFiles.has(f))
      .filter(f => !failedFiles.has(f))
      .filter(f => !SKIP_PATTERNS.some(p => p.test(f)))
      .sort()
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

        // 処理済みに移動（DRY-RUN以外）。失敗ありは再投入対象と混ざらないよう分離。
        if (!DRY_RUN) {
          const archiveDir = result.failed > 0 ? FAILED_DIR : PROCESSED_DIR
          await rename(filePath, await uniquePath(resolve(archiveDir, fileName)))
          log(`  → ${result.failed > 0 ? 'maisoku-failed' : 'maisoku-processed'}/ に移動`)
        }
      } catch (e) {
        if (isFatalPipelineError(e)) throw e
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
    log(`AI: ${getAiLabel()}`)
    const { success, skipped, failed } = await processFile(absPath)
    log(`\n=== 結果: 成功${success} / スキップ${skipped} / 失敗${failed} ===`)
    if (process.env.AUTONOMY_JOB_ID && failed > 0) process.exitCode = 1
  }
}

main().then(async () => {
  if (process.env.AUTONOMY_JOB_ID) await (await import('../src/lib/db')).prisma.$disconnect()
}).catch(e => { console.error(e); process.exit(1) })
