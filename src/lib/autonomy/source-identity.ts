export function verifiedSourceId(value: unknown, evidence: { field: string; raw_text: string; confidence: number }[] = []): string | null {
  const id = String(value || '').normalize('NFKC').replace(/\s/g, '')
  if (!/^\d{12}$/.test(id)) return null
  return evidence.some((item) => item.field === 'reins_property_id' && item.confidence >= 0.96 && item.raw_text.normalize('NFKC').replace(/\s/g, '').includes(id)) ? id : null
}
