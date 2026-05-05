import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { openai, extractionSchema, createMultiPagePrompt, extractionPrompt, translateDescription, OCR_MODEL, EXTRACT_MODEL } from '@/lib/openai'
import { formatPublicAddress, extractPrefecture, extractCity } from '@/lib/address'
import { sanitizeListingWarnings } from '@/lib/listing-warnings'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import { analyzeMaisokuAdPolicyWithAI } from '@/lib/maisoku-ai'
import { normalizePropertyType } from '@/lib/property-type'
import { prepareHospitalityCandidate, type HospitalityAssessment } from '@/lib/hospitality-assessment'
import { randomUUID } from 'crypto'
import { renderPdfPages, extractPhotosFromPage } from '@/lib/pdf-image'
import { getAdminUserFromSession } from '@/lib/admin-auth'
import { validateAdminImportFile } from '@/lib/admin-validation'

// pdfjs-dist (pdf-parseが内部使用) のNode.js環境用ポリフィル
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.DOMMatrix = class DOMMatrix { constructor() { return Object.create(DOMMatrix.prototype) } } as any
}

interface PageContent {
  pageNumber: number
  text: string
}

interface PdfParseResult {
  text: string
  numpages: number
}

// pdf-parseはCommonJSモジュールなのでrequireを使用
async function parsePdfWithPages(buffer: Buffer): Promise<{ pages: PageContent[]; totalPages: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse')

    const pages: PageContent[] = []
    let currentPage = 1

    // カスタムレンダラーでページごとにテキスト取得
    const options = {
      pagerender: function (pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) {
        return pageData.getTextContent().then(function (textContent: { items: { str: string }[] }) {
          const text = textContent.items.map(item => item.str).join(' ')
          pages.push({ pageNumber: currentPage, text })
          currentPage++
          return text
        })
      }
    }

    const data: PdfParseResult = await pdfParse(buffer, options)

    // ページごとのテキストが取れなかった場合は全体テキストを1ページとして扱う
    if (pages.length === 0 && data.text) {
      pages.push({ pageNumber: 1, text: data.text })
    }

    return { pages, totalPages: data.numpages || pages.length }
  } catch (e) {
    console.error('PDF parse error:', e)
    return { pages: [], totalPages: 0 }
  }
}

// 画像（PDF含む）からOCRでテキスト抽出
async function extractTextWithVision(buffer: Buffer, mimeType: string, pageNumber?: number): Promise<PageContent> {
  const base64 = buffer.toString('base64')

  const visionResponse = await openai.chat.completions.create({
    model: OCR_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'この不動産物件資料（マイソク）に書かれているテキストを全て抽出してください。レイアウトを維持する必要はありません。',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  })

  return {
    pageNumber: pageNumber || 1,
    text: visionResponse.choices[0]?.message?.content || '',
  }
}

interface Station {
  name: string
  name_en?: string | null
  line?: string | null
  line_en?: string | null
  walk_minutes?: number | null
}

interface Evidence {
  field: string
  raw_text: string
  confidence: number
  page_number?: number | null
}

interface ExtractedData {
  property_type?: string | null
  price?: number | null
  address_full?: string | null
  prefecture?: string | null
  city?: string | null
  stations?: Station[]
  land_area?: number | null
  building_area?: number | null
  floor_count?: number | null
  built_year?: number | null
  built_month?: number | null
  structure?: string | null
  zoning?: string | null
  current_status?: string | null
  info_registered_at?: string | null
  info_updated_at?: string | null
  conditions_expiry?: string | null
  delivery_date?: string | null
  ad_allowed?: boolean
  yield_gross?: number | null
  yield_net?: number | null
  description_ja?: string | null
  appeal_points?: string[]
  hospitality_assessment?: HospitalityAssessment | null
  confidence?: {
    overall: number
    price: number
    address: number
    area: number
  }
  warnings?: string[]
  evidence?: Evidence[]
}

// APIキー認証（外部スクリプト用）
async function authenticateWithApiKey(request: NextRequest): Promise<{ userId: string } | null> {
  const apiKey = request.headers.get('x-api-key')
  const configuredKey = process.env.IMPORT_API_KEY
  const adminUserId = process.env.IMPORT_ADMIN_USER_ID

  if (!apiKey || !configuredKey || !adminUserId) return null
  if (apiKey !== configuredKey) return null

  return { userId: adminUserId }
}

// Supabase Cookie認証（ブラウザ用）
async function authenticateWithSession(): Promise<{ userId: string } | null> {
  const adminUser = await getAdminUserFromSession()
  return adminUser ? { userId: adminUser.id } : null
}

export async function POST(request: NextRequest) {
  try {
    // 認証チェック（APIキー or セッション）
    const auth = await authenticateWithApiKey(request) || await authenticateWithSession()

    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUserId = auth.userId

    // ファイル取得
    const formData = await request.formData()
    const fileValue = formData.get('file')
    const file = fileValue instanceof File ? fileValue : null
    const validationError = validateAdminImportFile(file)

    if (validationError || !file) {
      return NextResponse.json(
        { error: validationError || 'No file provided' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let pageContents: PageContent[] = []
    let totalPages = 1
    let pdfUrl = ''
    let pageImages: { pageNumber: number; buffer: Buffer }[] = []
    let adAnalysisForImport: Awaited<ReturnType<typeof analyzeMaisokuAdPolicyWithAI>> | null = null

    // ファイルをSupabase Storageにアップロード（service roleを使用）
    const serviceClient = createServiceClient()
    try {
      // ファイル名をASCIIに正規化（日本語文字はSupabase Storageで不可）
      const safeFileName = `${Date.now()}-${file.name.replace(/[^\x20-\x7E]/g, '_')}`
      const { error: uploadError } = await serviceClient.storage
        .from('pdfs')
        .upload(safeFileName, buffer, {
          contentType: file.type,
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        // ストレージがなくても続行（開発環境用）
      } else {
        const { data: urlData } = serviceClient.storage.from('pdfs').getPublicUrl(safeFileName)
        pdfUrl = urlData.publicUrl
      }
    } catch (storageError) {
      console.error('Storage connection error:', storageError)
      // ストレージ接続エラー時もDB保存は続行
    }

    // PDFからテキスト抽出（ページごと）
    if (file.type === 'application/pdf') {
      const result = await parsePdfWithPages(buffer)
      pageContents = result.pages
      totalPages = result.totalPages
    }

    // テキストが少ない場合はOCR（GPT-4o Vision）を使用
    const totalText = pageContents.map(p => p.text).join(' ').trim()
    if (totalText.length < 100) {
      if (file.type === 'application/pdf') {
        // PDFの場合はページ画像をレンダリングしてVision OCR
        try {
          pageImages = await renderPdfPages(buffer, { scale: 2.0 })
          const ocrPages: PageContent[] = []
          for (const pageImage of pageImages) {
            const ocrResult = await extractTextWithVision(pageImage.buffer, 'image/png', pageImage.pageNumber)
            ocrPages.push(ocrResult)
          }
          if (ocrPages.length > 0) {
            pageContents = ocrPages
          }
        } catch (ocrError) {
          console.error('PDF OCR error:', ocrError)
        }
      } else {
        const ocrResult = await extractTextWithVision(buffer, file.type, 1)
        pageContents = [ocrResult]
      }
    }

    // AI広告判定。人間レビューなし運用のため、ALLOWEDとして検証済みのページだけDB保存する。
    try {
      if (file.type === 'application/pdf') {
        if (pageImages.length === 0) {
          pageImages = await renderPdfPages(buffer, { scale: 3.0 })
        }
      } else {
        pageImages = [{ pageNumber: 1, buffer }]
      }

      const adImage = pageImages[0]?.buffer || buffer
      const adAnalysis = await analyzeMaisokuAdPolicyWithAI(adImage)
      adAnalysisForImport = adAnalysis

      if (!adAnalysis.is_sale_property) {
        return NextResponse.json({
          success: false,
          skipped: true,
          reason: `売買マイソクではないためスキップしました [${adAnalysis.document_type}]`,
          filename: file.name,
          adAnalysis,
        }, { status: 200 })
      }

      if (!adAnalysis.can_publish) {
        return NextResponse.json({
          success: false,
          skipped: true,
          reason: `広告掲載不可または不確実のためスキップしました [${adAnalysis.status}]`,
          filename: file.name,
          adAnalysis,
        }, { status: 200 })
      }
    } catch (adError) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: `広告判定AIに失敗したためスキップしました: ${adError instanceof Error ? adError.message : String(adError)}`,
        filename: file.name,
      }, { status: 200 })
    }

    // LLMで情報抽出
    const prompt = pageContents.length > 1
      ? createMultiPagePrompt(pageContents)
      : `${extractionPrompt}\n\n${pageContents[0]?.text || ''}`

    const extractionResponse = await openai.chat.completions.create({
      model: EXTRACT_MODEL,
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: 'この物件情報を抽出してください。',
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: extractionSchema as Parameters<typeof openai.chat.completions.create>[0]['response_format'] extends { json_schema?: infer T } ? T : never,
      },
    })

    const extractedData: ExtractedData = JSON.parse(
      extractionResponse.choices[0]?.message?.content || '{}'
    )

    // 価格が取れない場合はスキップ（目次・空ページ等）
    if (!extractedData.price) {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: '価格情報が抽出できなかったためスキップしました（目次・空ページ等の可能性）',
        filename: file.name,
      }, { status: 200 })
    }

    // 住所を自動整形
    const addressResult = formatPublicAddress(extractedData.address_full)
    const normalizedStations = normalizeTransitStations(extractedData.stations)
    const sanitizedWarnings = sanitizeListingWarnings(extractedData.warnings)
    const propertyType = normalizePropertyType(extractedData.property_type, {
      descriptionJa: extractedData.description_ja,
      features: extractedData.appeal_points,
      evidence: extractedData.evidence,
      buildingArea: extractedData.building_area,
      landArea: extractedData.land_area,
      floorCount: extractedData.floor_count,
    })

    if (propertyType === '区分マンション') {
      return NextResponse.json({
        success: false,
        skipped: true,
        reason: '区分マンションは原則ポータル掲載対象外のためスキップしました',
        filename: file.name,
      }, { status: 200 })
    }

    const hospitalityCandidate = prepareHospitalityCandidate({
      propertyType,
      zoning: extractedData.zoning,
      currentStatus: extractedData.current_status,
      descriptionJa: extractedData.description_ja,
      features: extractedData.appeal_points,
      warnings: sanitizedWarnings,
      evidence: extractedData.evidence,
      buildingArea: extractedData.building_area,
      landArea: extractedData.land_area,
      floorCount: extractedData.floor_count,
      builtYear: extractedData.built_year,
      structure: extractedData.structure,
      stations: normalizedStations,
      assessment: extractedData.hospitality_assessment,
    })

    // 都道府県・市区町村を抽出（GPTの結果がない場合）
    const prefecture = extractedData.prefecture || extractPrefecture(extractedData.address_full)
    const city = extractedData.city || extractCity(extractedData.address_full)

    // 4言語翻訳（日本語説明文がある場合）
    let descriptionEn = null
    let descriptionZhTw = null
    let descriptionZhCn = null

    if (extractedData.description_ja) {
      try {
        const translations = await translateDescription(extractedData.description_ja, hospitalityCandidate.features)
        descriptionEn = translations.descriptionEn
        descriptionZhTw = translations.descriptionZhTw
        descriptionZhCn = translations.descriptionZhCn
      } catch (translationError) {
        console.error('Translation error:', translationError)
        // 翻訳に失敗しても処理は続行
      }
    }

    // 下書き物件を作成
    const now = new Date().toISOString()
    const listingId = randomUUID()
    const { data: listing, error: createError } = await serviceClient
      .from('listings')
      .insert({
        id: listingId,
        status: 'DRAFT',
        adAllowed: true,
        propertyType,
        hospitalityCategory: hospitalityCandidate.category,
        price: extractedData.price,
        addressPublic: addressResult.publicAddress,
        addressPrivate: extractedData.address_full,
        addressBlocked: addressResult.isBlocked,
        prefecture,
        city,
        stations: normalizedStations,
        landArea: extractedData.land_area,
        buildingArea: extractedData.building_area,
        floorCount: extractedData.floor_count,
        builtYear: extractedData.built_year,
        builtMonth: extractedData.built_month,
        structure: extractedData.structure,
        zoning: extractedData.zoning,
        currentStatus: extractedData.current_status,
        infoRegisteredAt: extractedData.info_registered_at ? new Date(extractedData.info_registered_at).toISOString() : null,
        infoUpdatedAt: extractedData.info_updated_at ? new Date(extractedData.info_updated_at).toISOString() : null,
        conditionsExpiry: extractedData.conditions_expiry ? new Date(extractedData.conditions_expiry).toISOString() : null,
        deliveryDate: extractedData.delivery_date || null,
        yieldGross: extractedData.yield_gross,
        yieldNet: extractedData.yield_net,
        warnings: hospitalityCandidate.warnings,
        features: hospitalityCandidate.features,
        // featuresEn, featuresZhTw, featuresZhCn は DBカラム追加後に有効化
        // featuresEn,
        // featuresZhTw,
        // featuresZhCn,
        descriptionJa: extractedData.description_ja,
        descriptionEn,
        descriptionZhTw,
        descriptionZhCn,
        extractionConfidence: extractedData.confidence?.overall || null,
        adminNotes: hospitalityCandidate.adminNotes,
        sourcePdfUrl: pdfUrl,
        sourcePdfPages: totalPages,
        createdById: adminUserId,
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single()

    if (createError) {
      console.error('Listing creation error:', createError)
      throw createError
    }

    // === PDF 1ページ目をトップ画像として保存（管理会社の帯を除去） ===
    if (file.type === 'application/pdf' && buffer.length > 0) {
      try {
        if (pageImages.length === 0) {
          pageImages = await renderPdfPages(buffer, { scale: 3.0 })
        }

        if (pageImages.length > 0) {
          // 1ページ目のみをトップ画像として使用
          const photos = await extractPhotosFromPage(pageImages[0].buffer)

          for (let i = 0; i < photos.length; i++) {
            const photo = photos[i]
            const imageFileName = `${listingId}/page-${i}.jpg`

            const { error: imgUploadError } = await serviceClient.storage
              .from('media')
              .upload(imageFileName, photo.buffer, {
                contentType: 'image/jpeg',
              })

            if (imgUploadError) {
              console.error(`Image upload error (${photo.label}):`, imgUploadError)
              continue
            }

            const { data: imgUrlData } = serviceClient.storage
              .from('media')
              .getPublicUrl(imageFileName)

            const { error: mediaError } = await serviceClient
              .from('media')
              .insert({
                id: randomUUID(),
                listingId: listingId,
                url: imgUrlData.publicUrl,
                category: photo.category,
                source: 'EXTRACTED',
                sortOrder: i,
                isAdopted: true,
              })

            if (mediaError) {
              console.error(`Media creation error (${photo.label}):`, mediaError)
            }
          }
        }
      } catch (imageError) {
        console.error('PDF image extraction error:', imageError)
        // 画像抽出失敗でもリスティング保存はブロックしない
      }
    }

    // エビデンス保存（ページ番号付き）
    if (extractedData.evidence && extractedData.evidence.length > 0) {
      const { error: evidenceError } = await serviceClient
        .from('extraction_evidences')
        .insert(extractedData.evidence.map((e) => ({
          id: randomUUID(),
          fieldName: e.field,
          rawText: e.raw_text,
          confidence: e.confidence,
          pageNumber: e.page_number,
          listingId: listing.id,
        })))

      if (evidenceError) console.error('Evidence creation error:', evidenceError)
    }

    // 管理者ログ
    const { error: logError } = await serviceClient
      .from('admin_logs')
      .insert({
        id: randomUUID(),
        action: 'IMPORT_PDF',
        targetType: 'listing',
        targetId: listing.id,
        detail: {
          filename: file.name,
          adStatus: adAnalysisForImport?.status,
          adConfidence: adAnalysisForImport?.confidence,
          adEvidence: adAnalysisForImport?.positive_evidence,
        },
        adminId: adminUserId,
      })

    if (logError) console.error('Log creation error:', logError)

    return NextResponse.json({
      success: true,
      listingId: listing.id,
    })
  } catch (error) {
    console.error('Import error:', error)
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === 'object' && error !== null) {
      // Supabase error object
      errorMessage = JSON.stringify(error)
    } else {
      errorMessage = String(error)
    }
    return NextResponse.json(
      { error: 'Import failed', details: errorMessage },
      { status: 500 }
    )
  }
}
