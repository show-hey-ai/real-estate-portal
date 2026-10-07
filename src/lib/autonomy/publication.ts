import { createHash, randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { formatPublicAddress, hasDetailedPublicAddress } from '../address'
import { isPublicPropertyType } from '../market-category'
import { PORTAL_VENTURE_ID } from './policy'
import { verifiedSourceId } from './source-identity'
import { hasExplicitPortalPermission } from '../ad-publication-policy'

type Facts = Record<string, unknown>
export type ImportReceipt = {
  sourceHash: string
  factsHash: string
  capturedAt: string
  ad: {
    status: string
    can_publish: boolean
    confidence: number
    verified_allowed: boolean
    positive_evidence: string[]
    blocking_evidence: string[]
    verifier_blocking_texts: string[]
  }
  confidence: { overall: number; price: number; address: number }
  evidence: { field_name: string; raw_text: string; confidence: number }[]
}

const numericFields = new Set(['price', 'landArea', 'buildingArea', 'floorCount', 'builtYear', 'builtMonth', 'yieldGross', 'yieldNet'])
const factFields = ['propertyType', 'price', 'addressPublic', 'addressPrivate', 'prefecture', 'city', 'stations', 'landArea', 'buildingArea', 'floorCount', 'builtYear', 'builtMonth', 'structure', 'zoning', 'currentStatus', 'conditionsExpiry', 'yieldGross', 'yieldNet', 'features', 'featuresEn', 'featuresZhTw', 'featuresZhCn', 'warnings', 'descriptionJa', 'descriptionEn', 'descriptionZhTw', 'descriptionZhCn', 'sourcePdfUrl', 'sourcePropertyId', 'adAllowed', 'adConsentRequired', 'hospitalityCategory']
const wards = new Set(['千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区', '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区', '足立区', '葛飾区', '江戸川区'])

function canonical(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return null
  if (Array.isArray(value)) return value.map(canonical)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]))
  return value
}

export function listingFactsHash(facts: Facts): string {
  const values = Object.fromEntries(factFields.map((key) => {
    const value = facts[key]
    if (numericFields.has(key)) return [key, value == null ? null : Number(value)]
    if (key === 'conditionsExpiry') return [key, value ? new Date(String(value)).toISOString() : null]
    if (key === 'adConsentRequired') return [key, value === true]
    return [key, canonical(value)]
  }))
  return createHash('sha256').update(JSON.stringify(values)).digest('hex')
}

export function makeImportReceipt(facts: Facts, input: Omit<ImportReceipt, 'factsHash' | 'capturedAt'>, now = new Date()): ImportReceipt {
  // Preserve full-page text within the fixed audit payload limits. Overlap keeps
  // address restriction sentences intact across chunk boundaries.
  const evidence = input.evidence.flatMap((item) => {
    if (item.field_name !== 'source_text' || item.raw_text.length <= 4000) return [item]
    const chunks = []
    for (let offset = 0; offset < item.raw_text.length; offset += 3700) chunks.push({ ...item, raw_text: item.raw_text.slice(offset, offset + 4000) })
    return chunks
  })
  if (evidence.length > 100) throw new Error('Source review exceeds the fixed audit evidence limit.')
  return { ...input, evidence, factsHash: listingFactsHash(facts), capturedAt: now.toISOString() }
}

function normalized(text: string) { return text.normalize('NFKC').replace(/\s+/g, '') }

/** Address-specific restrictions override a general advertising permission. */
export function hasAddressDisclosureRestriction(text: string): boolean {
  const value = normalized(text)
  const subject = '(?:所在地|住所|番地|部屋番号|号室|建物名|マンション名|地址|門牌|门牌|房號|房号|address|unitnumber|roomnumber|buildingname)'
  const restriction = '(?:(?:掲載|公開|表示|記載).{0,6}(?:しない|不可|禁止|(?<![a-z])NG(?![a-z])|控え)|非表示|非掲載|非公開|公開不可|掲載不可|掲載禁止|表示禁止|公開禁止|伏せ|秘匿|マスキング|丁目まで|町名まで|承諾|要確認|表示しない|載せない|不公開|不公开|仅显示|僅顯示|禁止|donotdisclose|donotpublish|private|withhold|redact|consentrequired)'
  return new RegExp(`${subject}[^。\\n;；]{0,48}${restriction}|${restriction}[^。\\n;；]{0,48}${subject}`, 'iu').test(value)
}

function removeExactApprovedAddress(text: string, address: string): string {
  if (!address) return text
  const escaped = address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`${escaped}(?![\\dA-Za-z号室番地丁目\\-−ー])`, 'gu'), '')
}

export function sourcePrices(text: string): number[] {
  const matches = normalized(text).replaceAll(',', '').matchAll(/(\d+(?:\.\d+)?)\s*(億円|万円|円)/g)
  return [...new Set(Array.from(matches, (match) => Number(match[1]) * (match[2] === '億円' ? 100_000_000 : match[2] === '万円' ? 10_000 : 1)))]
}

export function translationIssues(facts: Facts): string[] {
  const amounts = (value: unknown) => String(value || '').normalize('NFKC').replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?/g, (match) => match.replaceAll(',', ''))
  const source = amounts([facts.descriptionJa, ...(Array.isArray(facts.features) ? facts.features : [])].join(' '))
  const numbers = new Set(Array.from(source.matchAll(/\d+(?:\.\d+)?/g), (match) => Number(match[0])))
  for (const field of numericFields) {
    if (facts[field] != null) numbers.add(Number(facts[field]))
  }
  const price = Number(facts.price)
  for (const unit of [10_000, 100_000_000, 1_000_000]) numbers.add(price / unit)
  const issues: string[] = []
  for (const field of ['descriptionEn', 'descriptionZhTw', 'descriptionZhCn', 'featuresEn', 'featuresZhTw', 'featuresZhCn']) {
    const text = amounts(facts[field])
    const claims = Array.from(text.matchAll(/\d+(?:\.\d+)?/g), (match) => Number(match[0]))
    if (claims.some((number) => !numbers.has(number))) issues.push(`${field} contains a numeric claim absent from the original facts.`)
    if (/guaranteed\s*(?:return|yield|approval)|保證(?:收益|許可)|保证(?:收益|许可)/i.test(text)) issues.push(`${field} contains an unsupported guarantee.`)
  }
  return issues
}

export function publicationIssues(facts: Facts, receipt: ImportReceipt, now = new Date()): string[] {
  const issues: string[] = []
  const captured = new Date(receipt.capturedAt).getTime()
  if (!Number.isFinite(captured) || captured > now.getTime() || now.getTime() - captured > 24 * 3600_000) issues.push('Source verification has expired or has an invalid date.')
  if (!/^[a-f0-9]{64}$/.test(receipt.sourceHash)) issues.push('Source file fingerprint is missing.')
  if (listingFactsHash(facts) !== receipt.factsHash) issues.push('Listing facts changed after extraction.')
  if (!verifiedSourceId(facts.sourcePropertyId, receipt.evidence.map((item) => ({ field: item.field_name, raw_text: item.raw_text, confidence: item.confidence })))) issues.push('A verified stable REINS source identity is required for renewable automatic publication.')
  const ad = receipt.ad
  if (ad.status !== 'ALLOWED' || !ad.can_publish || !ad.verified_allowed || !Number.isFinite(ad.confidence) || ad.confidence < 0.96 || !ad.positive_evidence.length || ad.blocking_evidence.length || ad.verifier_blocking_texts.length) issues.push('Advertising permission did not pass independent verification.')
  if (!ad.positive_evidence.some(hasExplicitPortalPermission)) issues.push('An explicit permission statement for the publication channel is missing.')
  if (![receipt.confidence.overall, receipt.confidence.price, receipt.confidence.address].every((confidence) => Number.isFinite(confidence) && confidence >= 0.96 && confidence <= 1)) issues.push('Source fact confidence is insufficient.')
  if (facts.adAllowed !== true || facts.adConsentRequired === true) issues.push('Advertising permission is absent or requires consent.')
  if (!isPublicPropertyType(String(facts.propertyType || '')) || facts.hospitalityCategory) issues.push('Property is outside the public portal scope.')
  if (facts.prefecture !== '東京都' || !wards.has(String(facts.city || ''))) issues.push('Address is outside Tokyo 23 wards.')
  const address = formatPublicAddress(String(facts.addressPublic || ''), { adAllowed: facts.adAllowed === true, adConsentRequired: facts.adConsentRequired === true })
  if (address.isBlocked || !address.publicAddress || normalized(address.publicAddress) !== normalized(String(facts.addressPublic || ''))) issues.push('Public address did not pass the privacy check.')
  const privateAddress = normalized(String(facts.addressPrivate || ''))
  const privateSuffix = privateAddress.replace(/^.*?区/, '')
  const publicAddress = normalized(String(facts.addressPublic || ''))
  const publicSuffix = publicAddress.replace(/^.*?区/, '')
  const detailedAllowed = !address.isBlocked && hasDetailedPublicAddress(publicAddress)
  if (detailedAllowed && publicAddress !== privateAddress) issues.push('Full public address must exactly match the verified source address.')
  if (detailedAllowed && !receipt.evidence.some((item) => item.field_name === 'source_text' && item.raw_text.trim() && item.confidence >= 0.96)) issues.push('Full-page source review text is required for detailed address publication.')
  if (detailedAllowed && [...ad.positive_evidence, ...ad.blocking_evidence, ...ad.verifier_blocking_texts, ...receipt.evidence.map((item) => item.raw_text)].some(hasAddressDisclosureRestriction)) issues.push('Source contains an address disclosure restriction; retain the permitted area-only address.')
  for (const field of ['descriptionJa', 'descriptionEn', 'descriptionZhTw', 'descriptionZhCn', 'features', 'featuresEn', 'featuresZhTw', 'featuresZhCn']) {
    const originalText = normalized(String(facts[field] || ''))
    // Only the source-verified public address is exempt; other lot/unit/contact details remain private.
    const text = detailedAllowed ? removeExactApprovedAddress(removeExactApprovedAddress(originalText, publicAddress), publicSuffix) : originalText
    if (privateAddress && privateAddress !== normalized(String(facts.addressPublic || '')) && (text.includes(privateAddress) || privateSuffix.length > 5 && text.includes(privateSuffix))) issues.push(`${field} contains the private address.`)
    if (/\d{1,3}[-−ー]\d{1,3}[-−ー]\d{1,4}|\d+番(?:地)?(?:\d+号)?|\d+号室/.test(text)) issues.push(`${field} contains a private lot or unit address.`)
    if (/(?:\d{2,4}[-ー]\d{2,4}[-ー]\d{3,4})|[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text)) issues.push(`${field} contains a private contact detail.`)
  }
  const price = Number(facts.price)
  if (!Number.isSafeInteger(price) || price < 500_000 || price > 50_000_000_000) issues.push('Price is invalid.')
  const priceTexts = receipt.evidence.filter((item) => /^(price|価格)$/i.test(item.field_name) && item.confidence >= 0.96).map((item) => item.raw_text).join(' ')
  const prices = sourcePrices(priceTexts)
  if (prices.length !== 1 || prices[0] !== price) issues.push('Price does not match unambiguous source evidence.')
  const addressTexts = receipt.evidence.filter((item) => /^(address_full|address|住所)$/i.test(item.field_name) && item.confidence >= 0.96).map((item) => normalized(item.raw_text))
  if (!addressTexts.some((text) => String(facts.addressPrivate || '').length > 5 && (detailedAllowed
    ? text.replace(/^(?:所在地|住所|address(?:_full)?|location)[:：]?/i, '') === privateAddress
    : text.includes(privateAddress) && text.includes(publicAddress)))) issues.push('Address does not match source evidence.')
  if (facts.conditionsExpiry && new Date(String(facts.conditionsExpiry)).getTime() <= now.getTime()) issues.push('Listing conditions have expired.')
  if (!['descriptionJa', 'descriptionEn', 'descriptionZhTw', 'descriptionZhCn'].every((field) => typeof facts[field] === 'string' && String(facts[field]).trim().length > 0)) issues.push('One or more language descriptions are missing.')
  issues.push(...translationIssues(facts))
  return issues
}

/** A listing re-published after a re-check keeps the date it first went public. */
export function firstPublicationDate(previous: Date | null, releasedAt: Date): Date {
  return previous ?? releasedAt
}

/** Source documents are data. Only this fixed job type can be queued by import. */
export async function enqueueImportAudit(client: SupabaseClient, listingId: string, facts: Facts, input: Omit<ImportReceipt, 'factsHash' | 'capturedAt'>): Promise<boolean> {
  const receipt = makeImportReceipt(facts, input)
  const now = new Date().toISOString()
  const { error } = await client.from('autonomy_jobs').upsert({
    id: randomUUID(), ventureId: PORTAL_VENTURE_ID, kind: 'publication_audit', status: 'pending',
    dedupeKey: `import:${listingId}:${receipt.sourceHash}:${process.env.AUTONOMY_JOB_ID || receipt.capturedAt.slice(0, 10)}`, payload: { listingId, receipt }, priority: 50,
    availableAt: now, createdAt: now, updatedAt: now,
  }, { onConflict: 'ventureId,dedupeKey', ignoreDuplicates: true })
  return !error
}
