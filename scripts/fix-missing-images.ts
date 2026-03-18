/**
 * 画像なし物件のPDFからサムネイル画像を生成・アップロード
 */
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import sharp from 'sharp'
import { randomUUID } from 'crypto'

config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function renderFirstPage(buffer: Buffer): Promise<Buffer> {
  const { pdf } = await import('pdf-to-img')
  const document = await pdf(buffer, { scale: 3.0 })
  for await (const image of document) {
    return Buffer.from(image)
  }
  throw new Error('No pages in PDF')
}

async function removeBanner(pageBuffer: Buffer): Promise<Buffer> {
  const metadata = await sharp(pageBuffer).metadata()
  const origWidth = metadata.width || 1
  const origHeight = metadata.height || 1
  const cropHeight = Math.max(100, Math.round(origHeight * 0.85) - 20)

  return await sharp(pageBuffer)
    .extract({ left: 0, top: 0, width: origWidth, height: cropHeight })
    .jpeg({ quality: 92 })
    .toBuffer()
}

async function main() {
  // 画像なし物件を取得
  const { data: listings } = await supabase.from('listings').select('id, sourcePdfUrl').eq('status', 'PUBLISHED')
  const { data: media } = await supabase.from('media').select('listingId').eq('isAdopted', true)
  const mediaSet = new Set(media!.map(m => m.listingId))
  const noImg = listings!.filter(l => !mediaSet.has(l.id) && l.sourcePdfUrl)

  console.log(`画像なし(PDF有): ${noImg.length}件`)

  let fixed = 0
  for (const listing of noImg) {
    try {
      console.log(`処理中: ${listing.id}`)

      // PDFをダウンロード
      const response = await fetch(listing.sourcePdfUrl)
      if (!response.ok) {
        console.log(`  PDF取得失敗: ${response.status}`)
        continue
      }
      const pdfBuffer = Buffer.from(await response.arrayBuffer())

      // 画像生成
      const pageImage = await renderFirstPage(pdfBuffer)
      const imageBuffer = await removeBanner(pageImage)

      // Storageにアップロード
      const imageFileName = `${listing.id}/page-0.jpg`
      const { error: imgUploadError } = await supabase.storage
        .from('media')
        .upload(imageFileName, imageBuffer, { contentType: 'image/jpeg', upsert: true })

      if (imgUploadError) {
        console.log(`  アップロード失敗: ${imgUploadError.message}`)
        continue
      }

      const { data: imgUrlData } = supabase.storage.from('media').getPublicUrl(imageFileName)

      // メディアレコード作成
      await supabase.from('media').insert({
        id: randomUUID(),
        listingId: listing.id,
        url: imgUrlData.publicUrl,
        category: 'EXTERIOR',
        source: 'EXTRACTED',
        sortOrder: 0,
        isAdopted: true,
      })

      console.log(`  完了`)
      fixed++
    } catch (e) {
      console.log(`  エラー: ${e instanceof Error ? e.message : e}`)
    }
  }

  console.log(`\n修正完了: ${fixed}/${noImg.length}件`)
}

main()
