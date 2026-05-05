import sharp from 'sharp'
import { openai } from '@/lib/openai'

const DEFAULT_AD_MODEL = 'gpt-4.1'
const DEFAULT_BANNER_MODEL = 'gpt-4.1'
const AD_MODEL = process.env.MAISOKU_AD_MODEL || process.env.OPENAI_VISION_MODEL || DEFAULT_AD_MODEL
const BANNER_MODEL = process.env.MAISOKU_BANNER_MODEL || process.env.OPENAI_VISION_MODEL || DEFAULT_BANNER_MODEL

const VISION_MAX_WIDTH = 1600
const BANNER_VISION_WIDTH = 1200
const AD_BOTTOM_BAND_RATIO = 0.45
const MIN_ALLOWED_CONFIDENCE = 0.86

export type AdPublicationStatus =
  | 'ALLOWED'
  | 'DENIED'
  | 'APPROVAL_NEEDED'
  | 'NOT_MENTIONED'
  | 'AMBIGUOUS'

export interface AdMention {
  raw_text: string
  location: 'bottom_band' | 'body' | 'unknown'
  category: 'positive' | 'negative' | 'approval_needed' | 'deadline' | 'other'
  confidence: number
}

export interface MaisokuAdAnalysis {
  document_type:
    | 'sale_maisoku'
    | 'rental_maisoku'
    | 'property_list'
    | 'index_or_map'
    | 'broker_document'
    | 'blank_or_unreadable'
    | 'other'
  is_sale_property: boolean
  ad_mentions: AdMention[]
  status: AdPublicationStatus
  can_publish: boolean
  positive_evidence: string[]
  blocking_evidence: string[]
  confidence: number
  reason: string
  verified_allowed: boolean
  verifier_blocking_texts: string[]
}

interface AdEvidenceResult {
  document_type: MaisokuAdAnalysis['document_type']
  is_sale_property: boolean
  ad_mentions: AdMention[]
  page_summary: string
}

interface AdDecisionResult {
  status: AdPublicationStatus
  can_publish: boolean
  positive_evidence: string[]
  blocking_evidence: string[]
  confidence: number
  reason: string
}

interface AdVerifierResult {
  verified_allowed: boolean
  has_blocking_text: boolean
  blocking_texts: string[]
  confidence: number
  reason: string
}

export interface BannerCropAnalysis {
  has_company_banner: boolean
  banner_top_y: number
  confidence: number
  reason: string
}

function asChatJsonSchema(schema: unknown) {
  return {
    type: 'json_schema',
    json_schema: schema,
  } as Parameters<typeof openai.chat.completions.create>[0]['response_format']
}

async function resizeImageForVision(buffer: Buffer, maxWidth = VISION_MAX_WIDTH): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function cropBottomBandForVision(buffer: Buffer): Promise<Buffer> {
  const meta = await sharp(buffer).metadata()
  const width = meta.width || 1
  const height = meta.height || 1
  const top = Math.max(0, Math.floor(height * (1 - AD_BOTTOM_BAND_RATIO)))
  const bandHeight = Math.max(1, height - top)

  return sharp(buffer)
    .rotate()
    .extract({ left: 0, top, width, height: bandHeight })
    .resize({ width: VISION_MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 94 })
    .toBuffer()
}

function toImagePart(buffer: Buffer) {
  return {
    type: 'image_url' as const,
    image_url: {
      url: `data:image/jpeg;base64,${buffer.toString('base64')}`,
      detail: 'high' as const,
    },
  }
}

const adEvidenceSchema = {
  name: 'maisoku_ad_evidence',
  strict: true,
  schema: {
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
      page_summary: { type: 'string' },
    },
    required: ['document_type', 'is_sale_property', 'ad_mentions', 'page_summary'],
    additionalProperties: false,
  },
}

const adDecisionSchema = {
  name: 'maisoku_ad_decision',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['ALLOWED', 'DENIED', 'APPROVAL_NEEDED', 'NOT_MENTIONED', 'AMBIGUOUS'],
      },
      can_publish: { type: 'boolean' },
      positive_evidence: { type: 'array', items: { type: 'string' } },
      blocking_evidence: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
      reason: { type: 'string' },
    },
    required: ['status', 'can_publish', 'positive_evidence', 'blocking_evidence', 'confidence', 'reason'],
    additionalProperties: false,
  },
}

const adVerifierSchema = {
  name: 'maisoku_ad_verifier',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      verified_allowed: { type: 'boolean' },
      has_blocking_text: { type: 'boolean' },
      blocking_texts: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'number' },
      reason: { type: 'string' },
    },
    required: ['verified_allowed', 'has_blocking_text', 'blocking_texts', 'confidence', 'reason'],
    additionalProperties: false,
  },
}

const bannerCropSchema = {
  name: 'maisoku_banner_crop',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      has_company_banner: { type: 'boolean' },
      banner_top_y: {
        type: 'integer',
        description: '画像内の管理会社帯の上端Y座標。帯がなければ画像の高さ。',
      },
      confidence: { type: 'number' },
      reason: { type: 'string' },
    },
    required: ['has_company_banner', 'banner_top_y', 'confidence', 'reason'],
    additionalProperties: false,
  },
}

async function extractAdEvidenceWithAI(pageBuffer: Buffer): Promise<AdEvidenceResult> {
  const [fullImage, bottomBand] = await Promise.all([
    resizeImageForVision(pageBuffer),
    cropBottomBandForVision(pageBuffer),
  ])

  const response = await openai.chat.completions.create({
    model: AD_MODEL,
    messages: [
      {
        role: 'system',
        content: `あなたは不動産販売図面（マイソク）の広告掲載可否を調べるAIです。
目的は「自社ポータルへ自動掲載してよいか」を安全側で判定することです。

このステップでは結論を急がず、画像内の広告関連文言をすべて原文で抽出してください。
特に2枚目の画像はページ下部の帯です。小さい文字を最優先で読んでください。

広告関連文言に含めるもの:
- 広告可、広告掲載可、広告転載可、自社HP可、自社サイト可、ネット広告可
- 広告不可、広告掲載不可、広告転載不可、転載不可、ネット広告不可、掲載厳禁、一切不可
- 広告承認、承諾書、要承諾、要連絡、事前確認、応相談
- SUUMO、HOME'S、楽待、健美家、SNS、ポータル等の媒体制限
- 広告有効期限は deadline として抽出する。ただし広告許可とは別扱いにする。

曖昧な小文字は捨てず、読める範囲で raw_text に入れてください。`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '1枚目はページ全体、2枚目は下部帯の拡大です。広告関連文言を抽出してください。' },
          toImagePart(fullImage),
          toImagePart(bottomBand),
        ],
      },
    ],
    response_format: asChatJsonSchema(adEvidenceSchema),
    max_tokens: 1400,
    temperature: 0,
  })

  return JSON.parse(response.choices[0]?.message?.content || '{}') as AdEvidenceResult
}

async function decideAdPolicyWithAI(evidence: AdEvidenceResult): Promise<AdDecisionResult> {
  const response = await openai.chat.completions.create({
    model: AD_MODEL,
    messages: [
      {
        role: 'system',
        content: `あなたは日本の不動産マイソク広告掲載ポリシー判定AIです。
人間レビューは入りません。誤って広告不可物件を掲載しないことを最優先にしてください。

最終ステータス:
- ALLOWED: 自社ポータル掲載を明確に許可する原文があり、禁止・承諾条件がない。
- DENIED: 広告不可、広告転載不可、掲載不可、転載不可、ネット広告不可、掲載厳禁、一切不可等がある。
- APPROVAL_NEEDED: 広告承認、要承諾、要連絡、承諾書、事前確認、応相談等がある。
- NOT_MENTIONED: 広告関連の許可/禁止/承諾条件が見つからない。
- AMBIGUOUS: 証拠が矛盾、読みにくい、媒体制限の意味が判断できない。

can_publish=true にしてよい条件:
1. status が ALLOWED
2. positive_evidence に「広告可」「広告掲載可」「広告転載可」「自社HP可」「自社サイト可」「自社ホームページのみ可」「御社HP可」等の明確な許可原文がある
3. blocking_evidence が空
4. 「SUUMO以外可」「SUUMO不可」「楽待不可」「健美家不可」「ポータルサイト不可」等の特定媒体のみ不可は、自社ポータルがその禁止媒体に該当しない限り ALLOWED としてよい。
5. ただし「ネット広告不可」「ポータル全般不可」「HP含む不可」「広告転載不可」「広告掲載不可」は DENIED。
6. 「広告有効期限」だけでは ALLOWED にしない。
7. 迷ったら can_publish=false。

この判定は自動掲載ゲートです。保守的に判断してください。`,
      },
      {
        role: 'user',
        content: JSON.stringify(evidence, null, 2),
      },
    ],
    response_format: asChatJsonSchema(adDecisionSchema),
    max_tokens: 900,
    temperature: 0,
  })

  return JSON.parse(response.choices[0]?.message?.content || '{}') as AdDecisionResult
}

async function verifyAllowedDecisionWithAI(
  pageBuffer: Buffer,
  evidence: AdEvidenceResult,
  decision: AdDecisionResult
): Promise<AdVerifierResult> {
  const [fullImage, bottomBand] = await Promise.all([
    resizeImageForVision(pageBuffer),
    cropBottomBandForVision(pageBuffer),
  ])

  const response = await openai.chat.completions.create({
    model: AD_MODEL,
    messages: [
      {
        role: 'system',
        content: `あなたは広告掲載可判定の最終検証AIです。
前段が ALLOWED と判定しました。あなたの役割は反証探しです。

画像を読み直し、次のような掲載ブロック文言が1つでもあれば verified_allowed=false:
- 広告不可、広告掲載不可、広告転載不可、転載不可、ネット広告不可
- 掲載厳禁、一切不可、ポータル全般不可、HP含む不可
- 承諾書、広告承認、要承諾、要連絡、事前確認、応相談
- 自社HP可と矛盾する禁止文言

「SUUMO以外可」「SUUMO不可」「楽待不可」「健美家不可」などの特定媒体のみ不可は、自社ポータルが該当しないためブロック文言ではない。
自社HP可、広告可、または特定媒体以外可など明確な許可があり、上記ブロックが見当たらない場合のみ verified_allowed=true。
迷ったら false。`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `前段の証拠と判定です:\n${JSON.stringify({ evidence, decision }, null, 2)}\n\n画像を再確認して、ALLOWEDで本当に安全か検証してください。`,
          },
          toImagePart(fullImage),
          toImagePart(bottomBand),
        ],
      },
    ],
    response_format: asChatJsonSchema(adVerifierSchema),
    max_tokens: 700,
    temperature: 0,
  })

  return JSON.parse(response.choices[0]?.message?.content || '{}') as AdVerifierResult
}

export async function analyzeMaisokuAdPolicyWithAI(pageBuffer: Buffer): Promise<MaisokuAdAnalysis> {
  const evidence = await extractAdEvidenceWithAI(pageBuffer)

  if (!evidence.is_sale_property) {
    return {
      document_type: evidence.document_type,
      is_sale_property: false,
      ad_mentions: evidence.ad_mentions,
      status: 'AMBIGUOUS',
      can_publish: false,
      positive_evidence: [],
      blocking_evidence: [],
      confidence: 1,
      reason: '売買マイソクではない',
      verified_allowed: false,
      verifier_blocking_texts: [],
    }
  }

  const decision = await decideAdPolicyWithAI(evidence)
  let verifier: AdVerifierResult = {
    verified_allowed: false,
    has_blocking_text: false,
    blocking_texts: [],
    confidence: 1,
    reason: 'ALLOWED以外のため検証不要',
  }

  if (decision.status === 'ALLOWED' && decision.can_publish) {
    verifier = await verifyAllowedDecisionWithAI(pageBuffer, evidence, decision)
  }

  const canPublish =
    decision.status === 'ALLOWED' &&
    decision.can_publish &&
    decision.confidence >= MIN_ALLOWED_CONFIDENCE &&
    verifier.verified_allowed &&
    !verifier.has_blocking_text &&
    verifier.confidence >= MIN_ALLOWED_CONFIDENCE

  return {
    document_type: evidence.document_type,
    is_sale_property: evidence.is_sale_property,
    ad_mentions: evidence.ad_mentions,
    status: canPublish ? 'ALLOWED' : decision.status,
    can_publish: canPublish,
    positive_evidence: decision.positive_evidence,
    blocking_evidence: [
      ...decision.blocking_evidence,
      ...verifier.blocking_texts,
    ],
    confidence: Math.min(decision.confidence, verifier.confidence),
    reason: canPublish ? decision.reason : `${decision.reason} / ${verifier.reason}`,
    verified_allowed: verifier.verified_allowed,
    verifier_blocking_texts: verifier.blocking_texts,
  }
}

export async function detectCompanyBannerWithAI(pageBuffer: Buffer): Promise<BannerCropAnalysis> {
  const metadata = await sharp(pageBuffer).metadata()
  const originalHeight = metadata.height || 1

  const visionBuffer = await sharp(pageBuffer)
    .rotate()
    .resize({ width: BANNER_VISION_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: 92 })
    .toBuffer()
  const visionMeta = await sharp(visionBuffer).metadata()
  const visionHeight = visionMeta.height || originalHeight

  const response = await openai.chat.completions.create({
    model: BANNER_MODEL,
    messages: [
      {
        role: 'system',
        content: `あなたは不動産販売図面の画像トリミングAIです。
目的は、ページ下部の管理会社・仲介会社の帯だけを綺麗に切り落とすことです。

管理会社帯の特徴:
- ページ最下部付近の横長ブロック
- 会社名、電話番号、FAX、住所、免許番号、担当者、ロゴ、QR等を含む
- 物件本文・価格・概要・間取り・地図・写真は残す

出力:
- has_company_banner: 管理会社帯が明確にあるか
- banner_top_y: この送信画像内で、帯の上端Y座標。帯がなければ画像高さ ${visionHeight}
- confidence: 0から1

境界が曖昧な場合は、本文を削りすぎない位置を選んでください。`,
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: `画像サイズは横 ${visionMeta.width || BANNER_VISION_WIDTH}px、縦 ${visionHeight}pxです。管理会社帯の上端Y座標を返してください。` },
          toImagePart(visionBuffer),
        ],
      },
    ],
    response_format: asChatJsonSchema(bannerCropSchema),
    max_tokens: 400,
    temperature: 0,
  })

  const parsed = JSON.parse(response.choices[0]?.message?.content || '{}') as BannerCropAnalysis
  const scaleY = originalHeight / visionHeight

  return {
    ...parsed,
    banner_top_y: Math.round(parsed.banner_top_y * scaleY),
  }
}

export async function removeCompanyBannerWithAI(pageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(pageBuffer).metadata()
  const width = metadata.width || 1
  const height = metadata.height || 1
  const analysis = await detectCompanyBannerWithAI(pageBuffer)

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
