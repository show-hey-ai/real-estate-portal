/** Read-only download planning. A plan is neither a download receipt nor publication permission. */
export interface AcquisitionInput { file: string; rows: unknown }
interface Selection { sourceId: string; rowIndex: number; pdfPage: number }
interface DownloadBatch { sourceFile: string; sourceIds: string[]; selection: Selection[] }

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be a JSON array`)
  return value
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object`)
  return value as Record<string, unknown>
}

function sourceId(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{12}$/.test(value)) throw new Error('Source IDs must be 12-digit strings')
  return value
}

/**
 * Exclude the union of queue and seen IDs, then deduplicate incoming pages. Never add planned
 * IDs to either record: a failed download must remain eligible on the next run. Keep batches
 * on one captured result page and retain its row indices for fresh-UI identity verification.
 */
export function buildAcquisitionPlan(inputs: AcquisitionInput[], queue: unknown, seen: unknown) {
  const known = new Set([
    ...array(queue, 'queue').map((row) => sourceId(record(row, 'queue row').sourceId)),
    ...array(seen, 'seen').map(sourceId),
  ])
  const incoming = new Set<string>()
  const batches: DownloadBatch[] = []
  const counts = { inputRows: 0, knownRows: 0, duplicateRows: 0, newSources: 0, batches: 0 }
  for (const input of inputs) {
    const rows = array(input.rows, input.file)
    const positions = new Map<number, string>()
    const selected: Omit<Selection, 'pdfPage'>[] = []
    for (const [index, value] of rows.entries()) {
      const row = record(value, 'result row')
      const id = sourceId(row.id ?? row.sourceId)
      if (row.id !== undefined && row.sourceId !== undefined && row.id !== row.sourceId) throw new Error('Conflicting source IDs in result row')
      const rowIndex = row.i ?? index
      if (typeof rowIndex !== 'number' || !Number.isSafeInteger(rowIndex) || rowIndex < 0) throw new Error('Invalid result row index')
      if (positions.has(rowIndex) && positions.get(rowIndex) !== id) throw new Error('Different sources share a result row index')
      positions.set(rowIndex, id)
      counts.inputRows++
      if (known.has(id)) { counts.knownRows++; continue }
      if (incoming.has(id)) { counts.duplicateRows++; continue }
      incoming.add(id)
      selected.push({ sourceId: id, rowIndex })
    }
    // REINS emits the PDF in displayed-row order, regardless of the order boxes were checked.
    selected.sort((left, right) => left.rowIndex - right.rowIndex)
    for (let at = 0; at < selected.length; at += 10) {
      const selection = selected.slice(at, at + 10).map((row, index) => ({ ...row, pdfPage: index + 1 }))
      batches.push({ sourceFile: input.file, sourceIds: selection.map((row) => row.sourceId), selection })
    }
  }
  counts.newSources = incoming.size
  counts.batches = batches.length
  return { counts, batches }
}
