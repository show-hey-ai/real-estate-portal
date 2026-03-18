/**
 * PDF page-to-image conversion.
 * 1. Renders PDF pages as PNG using pdf-to-img (MuPDF WASM)
 * 2. GPT-4.1 Vision で管理会社の帯（バナー）位置を検出
 * 3. sharp で帯を除去し、マイソク全体をトップ画像として使用
 */
import sharp from 'sharp'
import { openai } from '@/lib/openai'

interface PdfPageImage {
  pageNumber: number
  buffer: Buffer
}

export interface ExtractedPhoto {
  buffer: Buffer
  category: 'EXTERIOR' | 'INTERIOR' | 'FLOORPLAN' | 'MAP' | 'OTHER'
  label: string
}

export async function renderPdfPages(
  pdfBuffer: Buffer,
  options: { scale?: number } = {}
): Promise<PdfPageImage[]> {
  const { pdf } = await import('pdf-to-img')
  const scale = options.scale ?? 2.0

  const document = await pdf(pdfBuffer, { scale })
  const pages: PdfPageImage[] = []
  let pageNumber = 1

  for await (const image of document) {
    pages.push({
      pageNumber,
      buffer: Buffer.from(image),
    })
    pageNumber++
  }

  return pages
}

// 帯検出用 Structured Output スキーマ
const bannerDetectionSchema = {
  name: 'banner_detection',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      has_banner: {
        type: 'boolean',
        description: '管理会社・仲介会社の帯（バナー）が存在するか',
      },
      banner_top_y: {
        type: 'integer',
        description: '帯の上端Y座標 (px)。帯がない場合は画像の高さを返す',
      },
    },
    required: ['has_banner', 'banner_top_y'],
    additionalProperties: false,
  },
}

const VISION_WIDTH = 1024

/**
 * GPT-4.1 Vision でマイソク画像の下部にある管理会社の帯を検出し、
 * 帯を除去した画像を返す。
 */
export async function removeCompanyBanner(
  pageBuffer: Buffer
): Promise<Buffer> {
  const metadata = await sharp(pageBuffer).metadata()
  const origWidth = metadata.width || 1
  const origHeight = metadata.height || 1

  // Vision API に送る画像をリサイズ
  const resized = await sharp(pageBuffer)
    .resize(VISION_WIDTH, null, { fit: 'inside' })
    .png()
    .toBuffer()

  const resizedMeta = await sharp(resized).metadata()
  const sendWidth = resizedMeta.width || VISION_WIDTH
  const sendHeight = resizedMeta.height || 1

  const base64 = resized.toString('base64')

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: `あなたは不動産販売図面（マイソク）のレイアウト解析AIです。
画像の下部にある不動産管理会社・仲介会社の帯（バナー）を検出してください。

帯の特徴:
- 画像の最下部に横幅いっぱいに配置されている
- 会社名、電話番号、FAX番号、住所、ロゴなどが含まれる
- 背景色が本文と異なることが多い（白、グレー、色付き）
- 「○○不動産」「○○ステップ」「○○リアルティ」等の社名が入っている
- 免許番号や所属団体が記載されていることもある

画像サイズは ${sendWidth}x${sendHeight}px です。
帯の上端のY座標をピクセル単位で返してください。
帯がない場合は has_banner を false にし、banner_top_y に画像の高さ(${sendHeight})を返してください。`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'この販売図面の下部にある管理会社の帯を検出してください。',
            },
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
        json_schema: bannerDetectionSchema as Parameters<typeof openai.chat.completions.create>[0]['response_format'] extends { json_schema?: infer T } ? T : never,
      },
      max_tokens: 200,
      temperature: 0,
    })

    const content = response.choices[0]?.message?.content || '{}'
    console.log('[BannerDetection]', content)

    const parsed = JSON.parse(content)

    if (!parsed.has_banner) {
      // 帯なし → 元画像をそのままJPEG化して返す
      return await sharp(pageBuffer).jpeg({ quality: 92 }).toBuffer()
    }

    // リサイズ画像の座標 → 元画像の座標にスケール変換
    const scaleY = origHeight / sendHeight
    let cropHeight = Math.round(parsed.banner_top_y * scaleY)

    // 安全マージン: 帯との境界から上に余裕を持って切る（帯の境界線・影も除去）
    cropHeight = Math.max(100, cropHeight - 20)

    // 帯を除去して切り出し
    const cropped = await sharp(pageBuffer)
      .extract({ left: 0, top: 0, width: origWidth, height: cropHeight })
      .jpeg({ quality: 92 })
      .toBuffer()

    return cropped
  } catch (error) {
    console.error('[BannerDetection] Error:', error)
    // エラー時は元画像をそのまま返す
    return await sharp(pageBuffer).jpeg({ quality: 92 }).toBuffer()
  }
}

/**
 * マイソクページ画像から帯を除去し、トップ画像として返す。
 * 1ページ目のみを対象とする。
 */
export async function extractPhotosFromPage(
  pageBuffer: Buffer
): Promise<ExtractedPhoto[]> {
  const cleaned = await removeCompanyBanner(pageBuffer)

  return [
    {
      buffer: cleaned,
      category: 'EXTERIOR',
      label: 'maisoku_page',
    },
  ]
}
