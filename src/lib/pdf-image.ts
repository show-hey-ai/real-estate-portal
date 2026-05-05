/**
 * PDF page-to-image conversion.
 * 1. Renders PDF pages as PNG using pdf-to-img (MuPDF WASM)
 * 2. AI Vision で管理会社の帯（バナー）位置を検出
 * 3. sharp で帯を除去し、マイソク全体をトップ画像として使用
 */
import { removeCompanyBannerWithAI } from '@/lib/maisoku-ai'

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

/**
 * マイソクページ画像から帯を除去し、トップ画像として返す。
 * 1ページ目のみを対象とする。
 */
export async function extractPhotosFromPage(
  pageBuffer: Buffer
): Promise<ExtractedPhoto[]> {
  const cleaned = await removeCompanyBannerWithAI(pageBuffer)

  return [
    {
      buffer: cleaned,
      category: 'EXTERIOR',
      label: 'maisoku_page',
    },
  ]
}
