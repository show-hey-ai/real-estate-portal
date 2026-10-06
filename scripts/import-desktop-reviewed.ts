/** Import source-backed desktop reviews without paid AI or bypassing publication audits. */
import { readFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { basename, dirname, resolve } from 'node:path'
import { config } from 'dotenv'
import { z } from 'zod'
import { PDFDocument } from 'pdf-lib'
import { hasAddressDisclosureRestriction, makeImportReceipt, publicationIssues, sourcePrices } from '../src/lib/autonomy/publication'
import { hasExplicitPortalPermission } from '../src/lib/ad-publication-policy'
import { formatPublicAddress } from '../src/lib/address'
import { PORTAL_VENTURE_ID } from '../src/lib/autonomy/policy'

const itemSchema = z.object({
  sourcePropertyId: z.string().regex(/^\d{12}$/), page: z.number().int().positive(),
  price: z.number().int().positive(), city: z.string(), addressPublic: z.string(), addressPrivate: z.string(),
  buildingArea: z.number().positive(), builtYear: z.number().int(), builtMonth: z.number().int().min(1).max(12),
  floorCount: z.number().int().positive(), structure: z.string(), landRights: z.string(), currentStatus: z.string(),
  stations: z.array(z.object({ name: z.string(), name_en: z.string(), line: z.string(), walk_minutes: z.number().int().nonnegative() }).strict()),
  descriptionJa: z.string().min(1), descriptionEn: z.string().min(1), descriptionZhTw: z.string().min(1), descriptionZhCn: z.string().min(1),
  features: z.array(z.string()), featuresEn: z.array(z.string()), featuresZhTw: z.array(z.string()), featuresZhCn: z.array(z.string()),
  documentPermission: z.string(), materialNotes: z.array(z.string()),
}).strict()
const batchSchema = z.object({
  capturedAt: z.string().datetime(), pdf: z.string(),
  reviewMethod: z.literal('desktop-source-and-full-page-review'),
  items: z.array(itemSchema).min(1).max(50),
}).strict()
const normalize = (value: string) => value.normalize('NFKC').replace(/\s+/g, '')
const hash = (value: Buffer | string) => createHash('sha256').update(value).digest('hex')
const documentNotes = (item: z.infer<typeof itemSchema>) => item.documentPermission

async function main() {
  const fileArg = process.argv[2]
  if (!fileArg) throw new Error('Pass a private desktop review JSON file; --save persists drafts and audit jobs.')
  const file = resolve(fileArg)
  const batch = batchSchema.parse(JSON.parse(await readFile(file, 'utf8')))
  const capturedAt = new Date(batch.capturedAt)
  if (capturedAt.getTime() > Date.now() || Date.now() - capturedAt.getTime() > 24 * 3600_000) throw new Error('Source review is stale or future-dated.')
  if (new Set(batch.items.map((item) => item.sourcePropertyId)).size !== batch.items.length) throw new Error('Duplicate source identity in batch.')
  const directory = dirname(file)
  const pdfBytes = await readFile(resolve(directory, batch.pdf))
  const pdf = await PDFDocument.load(pdfBytes)
  config({ path: process.env.AUTONOMY_ENV_FILE || resolve(process.cwd(), '.env'), quiet: true })
  const { prisma } = await import('../src/lib/db')
  const { json } = await import('../src/lib/autonomy/store')
  try {
    for (const item of batch.items) {
      if (item.page > pdf.getPageCount()) throw new Error(`Missing PDF page for ${item.sourcePropertyId}`)
      const snapshot = await readFile(resolve(directory, `${item.sourcePropertyId}.snapshot.txt`), 'utf8')
      // The desktop review covers the whole original page, including its small footer.
      const pageTextFile = `${basename(batch.pdf, '.pdf').replace(/-originals$/, '')}-page-${String(item.page).padStart(2, '0')}.txt`
      const pageText = await readFile(resolve(directory, pageTextFile), 'utf8').catch(() => '')
      const sourceText = [snapshot, pageText, documentNotes(item)].join('\n')
      const normal = normalize(snapshot)
      const sourceAd = snapshot.match(/- generic: 広告転載区分\n- generic: (.+)/)?.[1]
      if (!sourceAd || !hasExplicitPortalPermission(`広告転載区分：${sourceAd}`)) throw new Error(`Source permission missing or conditional: ${item.sourcePropertyId}`)
      if (item.documentPermission && !hasExplicitPortalPermission(item.documentPermission)) throw new Error(`Document permission unresolved: ${item.sourcePropertyId}`)
      const sourcePriceFields = [...snapshot.matchAll(/- generic: 価格\n- generic: ([^\n]+)/g)]
      const sourcePriceText = sourcePriceFields[0]?.[1] || ''
      if (sourcePriceFields.length !== 1 || !/^(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?)(?:億円|万円|円)$/.test(normalize(sourcePriceText))) throw new Error(`Source price is not a single confirmed amount: ${item.sourcePropertyId}`)
      const sourceAmounts = sourcePrices(sourcePriceText)
      if (sourceAmounts.length !== 1 || sourceAmounts[0] !== item.price) throw new Error(`Source price mismatch: ${item.sourcePropertyId}`)
      for (const expected of [item.sourcePropertyId, `${item.buildingArea.toFixed(2)}㎡`, item.city, item.addressPublic.replace(/^東京都.*?区/, '')]) {
        if (!normal.includes(normalize(expected))) throw new Error(`Source field mismatch: ${item.sourcePropertyId}`)
      }
      const { page, documentPermission, materialNotes, ...sourceFacts } = item
      const facts = {
        ...sourceFacts, propertyType: '区分マンション', prefecture: '東京都',
        addressPublic: formatPublicAddress(item.addressPrivate, { adAllowed: !!pageText.trim() && !hasAddressDisclosureRestriction(sourceText) }).publicAddress,
        landArea: null, yieldGross: null, yieldNet: null, zoning: null, hospitalityCategory: null,
        sourcePdfUrl: null, conditionsExpiry: null, warnings: [], adAllowed: true, adConsentRequired: false,
      }
      const receipt = makeImportReceipt(facts, {
        sourceHash: hash(pdfBytes),
        ad: { status: 'ALLOWED', can_publish: true, confidence: 0.99, verified_allowed: true,
          positive_evidence: [`広告転載区分：${sourceAd}`, ...(documentPermission ? [documentPermission] : [])], blocking_evidence: [], verifier_blocking_texts: [] },
        confidence: { overall: 0.99, price: 0.99, address: 0.99 },
        evidence: [
          { field_name: 'price', raw_text: `価格${item.price / 10000}万円`, confidence: 0.99 },
          { field_name: 'address_full', raw_text: item.addressPrivate, confidence: 0.99 },
          { field_name: 'reins_property_id', raw_text: `REINS物件番号${item.sourcePropertyId}`, confidence: 1 },
          { field_name: 'building_area', raw_text: `専有面積${item.buildingArea.toFixed(2)}㎡`, confidence: 0.99 },
          ...(pageText.trim() ? [{ field_name: 'source_text', raw_text: sourceText, confidence: 0.99 }] : []),
        ],
      }, capturedAt)
      const issues = publicationIssues(facts, receipt)
      if (issues.length) throw new Error(`${item.sourcePropertyId}: ${issues.join(' ')}`)
      if (!process.argv.includes('--save')) { console.log(JSON.stringify({ sourcePropertyId: item.sourcePropertyId, result: 'checks_passed' })); continue }
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
        const policy = await tx.autonomyPolicy.findUniqueOrThrow({ where: { id: PORTAL_VENTURE_ID } })
        if (!policy.enabled || !policy.allowReinsIntake || !policy.allowPublication) throw new Error('Operating policy changed.')
        const override = await tx.autonomyRecord.findUnique({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `source-override:${item.sourcePropertyId}` } } })
        if (override) return { sourcePropertyId: item.sourcePropertyId, result: 'operator_override_preserved' }
        const existing = await tx.listing.findUnique({ where: { sourcePropertyId: item.sourcePropertyId } })
        if (existing) return { sourcePropertyId: item.sourcePropertyId, listingId: existing.id, result: 'existing_preserved' }
        const listing = await tx.listing.create({ data: {
          ...facts, id: randomUUID(), price: BigInt(facts.price), stations: json(facts.stations),
          status: 'DRAFT', fetchedAt: capturedAt, extractionConfidence: 0.99, sourcePdfPages: 1,
          autonomyValidUntil: new Date(0),
          adminNotes: JSON.stringify({ method: batch.reviewMethod, reviewFile: file, sourcePdfHash: receipt.sourceHash, snapshotHash: hash(snapshot), page, materialNotes, capturedAt: batch.capturedAt }),
          evidences: { create: receipt.evidence.map((evidence) => ({ fieldName: evidence.field_name, rawText: evidence.raw_text, confidence: evidence.confidence, pageNumber: page })) },
        } })
        await tx.autonomyJob.create({ data: {
          ventureId: PORTAL_VENTURE_ID, kind: 'publication_audit', priority: 80,
          dedupeKey: `desktop:${listing.id}:${receipt.sourceHash}`, payload: json({ listingId: listing.id, receipt }),
        } })
        return { sourcePropertyId: item.sourcePropertyId, listingId: listing.id, result: 'draft_saved_audit_queued' }
      })
      console.log(JSON.stringify(result))
    }
  } finally { await prisma.$disconnect() }
}
main().catch((error) => { console.error(error instanceof Error ? error.message : 'Desktop import failed.'); process.exitCode = 1 })
