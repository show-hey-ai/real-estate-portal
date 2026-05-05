/**
 * Re-check existing published listings with the AI-only ad publication gate.
 *
 * Default mode is dry-run. Use --apply to archive unsafe listings.
 *
 * Usage:
 *   npm run ad:recheck
 *   npm run ad:recheck -- --max=10
 *   npm run ad:recheck -- --apply
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { PDFDocument } from 'pdf-lib'
import { randomUUID } from 'node:crypto'
import { renderPdfPages } from '../src/lib/pdf-image'
import { analyzeMaisokuAdPolicyWithAI, type MaisokuAdAnalysis } from '../src/lib/maisoku-ai'

config({ path: resolve(process.cwd(), '.env') })

const APPLY = process.argv.includes('--apply')
const maxArg = process.argv.find((arg) => arg.startsWith('--max='))
const MAX_LISTINGS = maxArg ? Number(maxArg.replace('--max=', '')) : Infinity
const outDirArg = process.argv.find((arg) => arg.startsWith('--out='))
const OUT_DIR = resolve(outDirArg?.replace('--out=', '') || 'tmp-ad-recheck')
const ARCHIVE_DIR = resolve(process.cwd(), 'archive')
const ADMIN_USER_ID = process.env.IMPORT_ADMIN_USER_ID

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

type ListingRow = {
  id: string
  managementId: string | null
  status: string
  adAllowed: boolean
  sourcePdfUrl: string | null
  sourcePdfPages: number | null
  addressPublic: string | null
}

type RecheckResult = {
  id: string
  managementId: string | null
  addressPublic: string | null
  source: string
  action: 'keep' | 'archive' | 'skip'
  reason: string
  status?: MaisokuAdAnalysis['status']
  confidence?: number
  positiveEvidence?: string[]
  blockingEvidence?: string[]
}

function log(message: string) {
  console.log(`[${new Date().toLocaleTimeString('ja-JP')}] ${message}`)
}

function localArchivePdfPath(listing: ListingRow): string | null {
  if (!listing.managementId) return null
  const exact = resolve(ARCHIVE_DIR, `${listing.managementId}_original.pdf`)
  if (existsSync(exact)) return exact

  return null
}

async function downloadPdf(url: string, listingId: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`PDF download failed: ${response.status} ${response.statusText}`)
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(resolve(OUT_DIR, `${listingId}-${basename(new URL(url).pathname) || 'source.pdf'}`), buffer)
  return buffer
}

async function getPdfBuffer(listing: ListingRow): Promise<{ buffer: Buffer; source: string }> {
  const localPath = localArchivePdfPath(listing)
  if (localPath) {
    return { buffer: await readFile(localPath), source: localPath }
  }

  if (!listing.sourcePdfUrl) {
    throw new Error('No source PDF URL')
  }

  return {
    buffer: await downloadPdf(listing.sourcePdfUrl, listing.id),
    source: listing.sourcePdfUrl,
  }
}

async function analyzePdf(buffer: Buffer): Promise<MaisokuAdAnalysis[]> {
  const pdfDoc = await PDFDocument.load(buffer)
  const pageCount = pdfDoc.getPageCount()
  const analyses: MaisokuAdAnalysis[] = []

  for (let index = 0; index < pageCount; index++) {
    const singlePdf = await PDFDocument.create()
    const [page] = await singlePdf.copyPages(pdfDoc, [index])
    singlePdf.addPage(page)
    const pageBuffer = Buffer.from(await singlePdf.save())
    const [pageImage] = await renderPdfPages(pageBuffer, { scale: 3.0 })

    if (!pageImage) continue
    analyses.push(await analyzeMaisokuAdPolicyWithAI(pageImage.buffer))
  }

  return analyses
}

function decideAction(analyses: MaisokuAdAnalysis[]): Pick<RecheckResult, 'action' | 'reason' | 'status' | 'confidence' | 'positiveEvidence' | 'blockingEvidence'> {
  if (analyses.length === 0) {
    return { action: 'archive', reason: 'PDF画像化またはAI判定ができない' }
  }

  const blocking = analyses.find((analysis) =>
    analysis.status === 'DENIED' ||
    analysis.status === 'APPROVAL_NEEDED' ||
    analysis.status === 'AMBIGUOUS'
  )

  if (blocking) {
    return {
      action: 'archive',
      reason: `安全側で非公開: ${blocking.status} ${blocking.reason}`,
      status: blocking.status,
      confidence: blocking.confidence,
      positiveEvidence: blocking.positive_evidence,
      blockingEvidence: blocking.blocking_evidence,
    }
  }

  const allowed = analyses.find((analysis) => analysis.can_publish)
  if (allowed) {
    return {
      action: 'keep',
      reason: allowed.reason,
      status: allowed.status,
      confidence: allowed.confidence,
      positiveEvidence: allowed.positive_evidence,
      blockingEvidence: allowed.blocking_evidence,
    }
  }

  const first = analyses[0]
  return {
    action: 'archive',
    reason: `明確な広告掲載可がない: ${first.status} ${first.reason}`,
    status: first.status,
    confidence: first.confidence,
    positiveEvidence: first.positive_evidence,
    blockingEvidence: first.blocking_evidence,
  }
}

async function archiveListing(listing: ListingRow, result: RecheckResult) {
  const note = [
    `[AI ad recheck ${new Date().toISOString()}]`,
    `action=${result.action}`,
    `status=${result.status ?? 'unknown'}`,
    `confidence=${result.confidence ?? 'unknown'}`,
    `reason=${result.reason}`,
    result.blockingEvidence?.length ? `blocking=${result.blockingEvidence.join(' / ')}` : null,
  ].filter(Boolean).join('\n')

  const { error } = await supabase
    .from('listings')
    .update({
      status: 'ARCHIVED',
      adAllowed: false,
      adminNotes: note,
      updatedAt: new Date().toISOString(),
    })
    .eq('id', listing.id)

  if (error) throw error

  if (ADMIN_USER_ID) {
    await supabase.from('admin_logs').insert({
      id: randomUUID(),
      action: 'AI_AD_RECHECK_ARCHIVE',
      targetType: 'listing',
      targetId: listing.id,
      detail: result,
      adminId: ADMIN_USER_ID,
    })
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  log(APPLY ? 'APPLY mode: unsafe published listings will be archived' : 'DRY-RUN mode: no DB changes')

  const { data, error } = await supabase
    .from('listings')
    .select('id, managementId, status, adAllowed, sourcePdfUrl, sourcePdfPages, addressPublic')
    .eq('status', 'PUBLISHED')
    .eq('adAllowed', true)
    .order('managementId', { ascending: true })

  if (error) throw error

  const listings = (data || []).slice(0, Number.isFinite(MAX_LISTINGS) ? MAX_LISTINGS : undefined) as ListingRow[]
  const results: RecheckResult[] = []
  let keep = 0
  let archive = 0
  let skip = 0

  for (const [index, listing] of listings.entries()) {
    log(`\n[${index + 1}/${listings.length}] ${listing.managementId || listing.id} ${listing.addressPublic || ''}`)

    try {
      const { buffer, source } = await getPdfBuffer(listing)
      const analyses = await analyzePdf(buffer)
      const decision = decideAction(analyses)
      const result: RecheckResult = {
        id: listing.id,
        managementId: listing.managementId,
        addressPublic: listing.addressPublic,
        source,
        ...decision,
      }

      if (result.action === 'keep') {
        keep++
        log(`  KEEP: ${result.status} confidence=${result.confidence?.toFixed(2) ?? '-'}`)
      } else {
        archive++
        log(`  ARCHIVE: ${result.reason}`)
        if (APPLY) {
          await archiveListing(listing, result)
          log('  DB updated: ARCHIVED')
        }
      }

      results.push(result)
    } catch (err) {
      skip++
      const result: RecheckResult = {
        id: listing.id,
        managementId: listing.managementId,
        addressPublic: listing.addressPublic,
        source: listing.sourcePdfUrl || localArchivePdfPath(listing) || '',
        action: 'skip',
        reason: err instanceof Error ? err.message : String(err),
      }
      results.push(result)
      log(`  SKIP: ${result.reason}`)
    }
  }

  const reportPath = resolve(OUT_DIR, `ad-recheck-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  await writeFile(reportPath, JSON.stringify({ apply: APPLY, keep, archive, skip, results }, null, 2))

  log(`\nReport: ${reportPath}`)
  log(`Result: keep=${keep} archive=${archive}${APPLY ? ' (applied)' : ' (dry-run)'} skip=${skip}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
