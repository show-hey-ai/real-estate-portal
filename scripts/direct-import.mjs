/**
 * PDFを直接Supabaseにインポートするスクリプト
 * Usage: node scripts/direct-import.mjs <pdf1> <pdf2> ...
 */
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { readFileSync } from 'fs'
import { basename } from 'path'
import { randomUUID } from 'crypto'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const ADMIN_USER_ID = process.env.IMPORT_ADMIN_USER_ID

// --- extraction schema (same as openai.ts) ---
const extractionSchema = {
  name: 'property_extraction',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      property_type: { type: ['string', 'null'], enum: ['区分マンション','一棟マンション','一棟アパート','一棟ビル','戸建','土地','店舗・事務所','その他', null] },
      price: { type: ['integer', 'null'], description: '価格（円）' },
      address_full: { type: ['string', 'null'] },
      prefecture: { type: ['string', 'null'] },
      city: { type: ['string', 'null'] },
      stations: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, line: { type: ['string', 'null'] }, walk_minutes: { type: ['integer', 'null'] } }, required: ['name','line','walk_minutes'], additionalProperties: false } },
      land_area: { type: ['number', 'null'] },
      building_area: { type: ['number', 'null'] },
      floor_count: { type: ['integer', 'null'] },
      built_year: { type: ['integer', 'null'] },
      built_month: { type: ['integer', 'null'] },
      structure: { type: ['string', 'null'], enum: ['RC','SRC','S','木造','軽量鉄骨','その他', null] },
      zoning: { type: ['string', 'null'] },
      current_status: { type: ['string', 'null'] },
      info_registered_at: { type: ['string', 'null'] },
      info_updated_at: { type: ['string', 'null'] },
      conditions_expiry: { type: ['string', 'null'] },
      delivery_date: { type: ['string', 'null'] },
      ad_allowed: { type: 'boolean' },
      yield_gross: { type: ['number', 'null'] },
      yield_net: { type: ['number', 'null'] },
      description_ja: { type: ['string', 'null'] },
      appeal_points: { type: 'array', items: { type: 'string' } },
      confidence: { type: 'object', properties: { overall: { type: 'number' }, price: { type: 'number' }, address: { type: 'number' }, area: { type: 'number' } }, required: ['overall','price','address','area'], additionalProperties: false },
      warnings: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'object', properties: { field: { type: 'string' }, raw_text: { type: 'string' }, confidence: { type: 'number' }, page_number: { type: ['integer', 'null'] } }, required: ['field','raw_text','confidence','page_number'], additionalProperties: false } },
    },
    required: ['property_type','price','address_full','prefecture','city','stations','land_area','building_area','floor_count','built_year','built_month','structure','zoning','current_status','info_registered_at','info_updated_at','conditions_expiry','delivery_date','ad_allowed','yield_gross','yield_net','description_ja','appeal_points','confidence','warnings','evidence'],
    additionalProperties: false,
  },
}

const extractionPrompt = `あなたは不動産情報抽出AIです。以下のマイソク（物件資料）から情報を抽出してください。
【重要ルール】
1. 不明な項目はnullにする。推測で埋めない。
2. 住所は「address_full」に抽出した全文を入れる。
3. 最寄駅は複数ある場合がある。
4. 築年月は西暦と月を分けて出力。
5. 利回りが記載されている場合はwarningsに注意書きを追加。
6. ad_allowed: 「広告可」等の明示があればtrue。記載なし/不可はfalse。
7. evidenceに抽出元テキストと信頼度を記録。
【入力テキスト】`

// --- Address helpers ---
function formatPublicAddress(fullAddress) {
  if (!fullAddress) return { publicAddress: null, isBlocked: false }
  const chomeMatch = fullAddress.match(/^(.+?[都道府県].+?[市区町村].+?(?:\d+丁目|[一二三四五六七八九十]+丁目))/)
  const publicAddress = chomeMatch ? chomeMatch[1] : fullAddress
  return { publicAddress, isBlocked: /\d+番|\d+-\d+/.test(fullAddress) }
}
function extractPrefecture(addr) {
  if (!addr) return null
  const m = addr.match(/(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)
  return m ? m[1] : null
}
function extractCity(addr) {
  if (!addr) return null
  const w = addr.replace(/(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '')
  const m = w.match(/^(.+?[市区町村])/)
  return m ? m[1] : null
}

// --- OCR via GPT-4o Vision ---
async function ocrPdfPage(buffer, pageNumber) {
  const base64 = buffer.toString('base64')
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: [
      { type: 'text', text: 'この不動産物件資料（マイソク）に書かれているテキストを全て抽出してください。' },
      { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
    ]}],
    max_tokens: 4096,
  })
  return { pageNumber, text: res.choices[0]?.message?.content || '' }
}

// --- Render PDF pages ---
async function renderPdfPages(pdfBuffer) {
  const { pdf } = await import('pdf-to-img')
  const doc = await pdf(pdfBuffer, { scale: 2.0 })
  const pages = []
  let pn = 1
  for await (const image of doc) {
    pages.push({ pageNumber: pn++, buffer: Buffer.from(image) })
  }
  return pages
}

// --- Remove company banner from page image ---
async function processPageImage(pageBuffer) {
  const sharp = (await import('sharp')).default
  const meta = await sharp(pageBuffer).metadata()
  const origW = meta.width || 1, origH = meta.height || 1

  // Resize for vision API
  const resized = await sharp(pageBuffer).resize(1024, null, { fit: 'inside' }).png().toBuffer()
  const resizedMeta = await sharp(resized).metadata()
  const sendH = resizedMeta.height || 1

  const base64 = resized.toString('base64')
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: `不動産販売図面の下部にある管理会社の帯を検出してください。画像サイズは${resizedMeta.width}x${sendH}px。帯の上端Y座標をpxで返してください。帯がなければhas_banner=false, banner_top_y=${sendH}を返してください。` },
        { role: 'user', content: [
          { type: 'text', text: '帯を検出してください。' },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}`, detail: 'high' } },
        ]},
      ],
      response_format: { type: 'json_schema', json_schema: { name: 'banner_detection', strict: true, schema: { type: 'object', properties: { has_banner: { type: 'boolean' }, banner_top_y: { type: 'integer' } }, required: ['has_banner','banner_top_y'], additionalProperties: false } } },
      max_tokens: 200, temperature: 0,
    })
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}')
    console.log('  [Banner]', parsed)
    if (!parsed.has_banner) return sharp(pageBuffer).jpeg({ quality: 92 }).toBuffer()
    const scaleY = origH / sendH
    const cropH = Math.max(100, Math.round(parsed.banner_top_y * scaleY) - 20)
    return sharp(pageBuffer).extract({ left: 0, top: 0, width: origW, height: cropH }).jpeg({ quality: 92 }).toBuffer()
  } catch (e) {
    console.error('  [Banner] Error:', e.message)
    return sharp(pageBuffer).jpeg({ quality: 92 }).toBuffer()
  }
}

// --- Translation ---
async function translateDescription(descJa, featuresJa) {
  const featuresText = featuresJa?.length ? `\n\nFeatures to translate:\n${featuresJa.map(f => `- ${f}`).join('\n')}` : ''
  const res = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: `Translate this Japanese property description into English, Traditional Chinese, Simplified Chinese. Keep professional tone for investors.\n\n${descJa}${featuresText}` },
      { role: 'user', content: 'Translate.' },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'translation', strict: true, schema: { type: 'object', properties: { description_en: { type: 'string' }, description_zh_tw: { type: 'string' }, description_zh_cn: { type: 'string' }, features_en: { type: 'array', items: { type: 'string' } }, features_zh_tw: { type: 'array', items: { type: 'string' } }, features_zh_cn: { type: 'array', items: { type: 'string' } } }, required: ['description_en','description_zh_tw','description_zh_cn','features_en','features_zh_tw','features_zh_cn'], additionalProperties: false } } },
  })
  return JSON.parse(res.choices[0]?.message?.content || '{}')
}

// --- Main import function ---
async function importPdf(filePath) {
  const fileName = basename(filePath)
  console.log(`\n=== Importing: ${fileName} ===`)

  const buffer = readFileSync(filePath)
  console.log(`  File size: ${(buffer.length / 1024 / 1024).toFixed(1)}MB`)

  // 1. Upload PDF to Supabase Storage
  let pdfUrl = ''
  const safeName = `${Date.now()}-${fileName.replace(/[^\x20-\x7E]/g, '_')}`
  const { error: upErr } = await supabase.storage.from('pdfs').upload(safeName, buffer, { contentType: 'application/pdf' })
  if (upErr) console.error('  PDF upload error:', upErr.message)
  else {
    const { data: urlData } = supabase.storage.from('pdfs').getPublicUrl(safeName)
    pdfUrl = urlData.publicUrl
    console.log('  PDF uploaded:', pdfUrl.substring(0, 80) + '...')
  }

  // 2. Parse PDF text
  let pageContents = []
  let totalPages = 1
  try {
    const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
    const pages = []
    let cp = 1
    const data = await pdfParse(buffer, {
      pagerender: (pageData) => pageData.getTextContent().then(tc => {
        const text = tc.items.map(i => i.str).join(' ')
        pages.push({ pageNumber: cp++, text })
        return text
      })
    })
    pageContents = pages.length > 0 ? pages : [{ pageNumber: 1, text: data.text }]
    totalPages = data.numpages || pages.length
    console.log(`  Parsed ${totalPages} pages, total text: ${pageContents.map(p => p.text).join('').length} chars`)
  } catch (e) {
    console.error('  PDF parse error:', e.message)
  }

  // 3. If text is too short, use OCR
  const totalText = pageContents.map(p => p.text).join(' ').trim()
  if (totalText.length < 100) {
    console.log('  Text too short, using OCR...')
    try {
      const pageImages = await renderPdfPages(buffer)
      const ocrPages = []
      for (const pi of pageImages) {
        const ocr = await ocrPdfPage(pi.buffer, pi.pageNumber)
        ocrPages.push(ocr)
        console.log(`  OCR page ${pi.pageNumber}: ${ocr.text.length} chars`)
      }
      if (ocrPages.length > 0) pageContents = ocrPages
    } catch (e) {
      console.error('  OCR error:', e.message)
    }
  }

  // 4. Extract structured data with GPT-4o
  console.log('  Extracting property data...')
  const pageTexts = pageContents.map(p => `--- ページ ${p.pageNumber} ---\n${p.text}`).join('\n\n')
  const prompt = `${extractionPrompt}\n\n${pageTexts}\n\n複数ページにまたがる情報を統合してください。`

  const extractRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: 'この物件情報を抽出してください。' },
    ],
    response_format: { type: 'json_schema', json_schema: extractionSchema },
  })
  const extracted = JSON.parse(extractRes.choices[0]?.message?.content || '{}')
  console.log(`  Property: ${extracted.property_type} | Price: ${extracted.price} | Address: ${extracted.address_full}`)
  console.log(`  Ad allowed: ${extracted.ad_allowed}`)

  // Skip ad_allowed check (forced import)
  if (!extracted.ad_allowed) {
    console.log('  ⚠️ 広告掲載許可なし → 強制インポート続行')
  }
  // Skip if no price
  if (!extracted.price) {
    console.log('  ⚠️ 価格情報なし → スキップ')
    return { success: false, reason: '価格情報なし' }
  }

  // 5. Translate
  let translations = {}
  if (extracted.description_ja) {
    console.log('  Translating...')
    try {
      translations = await translateDescription(extracted.description_ja, extracted.appeal_points)
    } catch (e) { console.error('  Translation error:', e.message) }
  }

  // 6. Insert listing into Supabase
  const addrResult = formatPublicAddress(extracted.address_full)
  const prefecture = extracted.prefecture || extractPrefecture(extracted.address_full)
  const city = extracted.city || extractCity(extracted.address_full)
  const now = new Date().toISOString()
  const listingId = randomUUID()

  const { data: listing, error: createErr } = await supabase.from('listings').insert({
    id: listingId,
    status: 'DRAFT',
    propertyType: extracted.property_type,
    price: extracted.price,
    addressPublic: addrResult.publicAddress,
    addressPrivate: extracted.address_full,
    addressBlocked: addrResult.isBlocked,
    prefecture, city,
    stations: extracted.stations,
    landArea: extracted.land_area,
    buildingArea: extracted.building_area,
    floorCount: extracted.floor_count,
    builtYear: extracted.built_year,
    builtMonth: extracted.built_month,
    structure: extracted.structure,
    zoning: extracted.zoning,
    currentStatus: extracted.current_status,
    infoRegisteredAt: extracted.info_registered_at ? new Date(extracted.info_registered_at).toISOString() : null,
    infoUpdatedAt: extracted.info_updated_at ? new Date(extracted.info_updated_at).toISOString() : null,
    conditionsExpiry: extracted.conditions_expiry ? new Date(extracted.conditions_expiry).toISOString() : null,
    deliveryDate: extracted.delivery_date || null,
    yieldGross: extracted.yield_gross,
    yieldNet: extracted.yield_net,
    warnings: extracted.warnings,
    features: extracted.appeal_points,
    descriptionJa: extracted.description_ja,
    descriptionEn: translations.description_en || null,
    descriptionZhTw: translations.description_zh_tw || null,
    descriptionZhCn: translations.description_zh_cn || null,
    extractionConfidence: extracted.confidence?.overall || null,
    sourcePdfUrl: pdfUrl,
    sourcePdfPages: totalPages,
    createdById: ADMIN_USER_ID,
    createdAt: now, updatedAt: now,
  }).select().single()

  if (createErr) {
    console.error('  DB insert error:', createErr.message)
    return { success: false, reason: createErr.message }
  }
  console.log(`  ✅ Listing created: ${listing.id}`)

  // 7. Extract and upload page image (page 1 with banner removed)
  try {
    console.log('  Processing page image...')
    const pageImages = await renderPdfPages(buffer)
    if (pageImages.length > 0) {
      const cleaned = await processPageImage(pageImages[0].buffer)
      const imgName = `${listingId}/page-0.jpg`
      const { error: imgErr } = await supabase.storage.from('media').upload(imgName, cleaned, { contentType: 'image/jpeg' })
      if (imgErr) { console.error('  Image upload error:', imgErr.message) }
      else {
        const { data: imgUrl } = supabase.storage.from('media').getPublicUrl(imgName)
        await supabase.from('media').insert({
          id: randomUUID(), listingId, url: imgUrl.publicUrl,
          category: 'EXTERIOR', source: 'EXTRACTED', sortOrder: 0, isAdopted: true,
        })
        console.log('  ✅ Image uploaded')
      }
    }
  } catch (e) { console.error('  Image error:', e.message) }

  // 8. Save evidence
  if (extracted.evidence?.length > 0) {
    await supabase.from('extraction_evidences').insert(
      extracted.evidence.map(e => ({
        id: randomUUID(), fieldName: e.field, rawText: e.raw_text,
        confidence: e.confidence, pageNumber: e.page_number, listingId,
      }))
    )
    console.log(`  ✅ ${extracted.evidence.length} evidences saved`)
  }

  return { success: true, listingId, address: extracted.address_full, price: extracted.price }
}

// --- Entry point ---
const pdfFiles = process.argv.slice(2)
if (pdfFiles.length === 0) {
  console.error('Usage: node scripts/direct-import.mjs <pdf1> [pdf2] ...')
  process.exit(1)
}

console.log(`\nImporting ${pdfFiles.length} PDFs...`)
const results = []
for (const f of pdfFiles) {
  try {
    const r = await importPdf(f)
    results.push({ file: basename(f), ...r })
  } catch (e) {
    console.error(`Error importing ${f}:`, e.message)
    results.push({ file: basename(f), success: false, reason: e.message })
  }
}

console.log('\n=== RESULTS ===')
for (const r of results) {
  console.log(`  ${r.file}: ${r.success ? '✅' : '❌'} ${r.success ? r.listingId : r.reason}`)
}
