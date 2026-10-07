/**
 * Close review-queue rows that the free keyword screening already rules out, so the operator
 * does not fetch REINS details or re-read drawings for them. Exclusion is the safe direction:
 * a wrong "denied" only costs one listing, never an unpermitted advert. Evidence is kept.
 *
 *   npm run queue:triage -- --queue <review-queue.json> [--save]
 */
import { copyFile, readFile, writeFile } from 'node:fs/promises'

interface QueueRow {
  sourceId?: string
  stage?: string
  screeningVerdict?: string
  screeningEvidence?: string[]
  triagedAt?: string
  [key: string]: unknown
}

const OPEN_STAGE = 'screened-awaiting-full-review'
const HOLD_STAGE: Record<string, string> = {
  denied: 'held-screening-denied',
  consent: 'held-screening-consent',
}

export function triageRows(rows: QueueRow[], now = new Date()): { rows: QueueRow[]; changed: number } {
  let changed = 0
  const next = rows.map((row) => {
    const stage = row.screeningVerdict ? HOLD_STAGE[row.screeningVerdict] : undefined
    if (row.stage !== OPEN_STAGE || !stage || !row.screeningEvidence?.length) return row
    changed += 1
    return { ...row, stage, triagedAt: now.toISOString() }
  })
  return { rows: next, changed }
}

async function main() {
  const index = process.argv.indexOf('--queue')
  const path = index === -1 ? undefined : process.argv[index + 1]
  if (!path) throw new Error('Pass --queue <review-queue.json>.')
  const rows = JSON.parse(await readFile(path, 'utf8')) as QueueRow[]
  if (!Array.isArray(rows)) throw new Error('The queue must be a JSON array of rows.')
  const { rows: next, changed } = triageRows(rows)
  const open = next.filter((row) => row.stage === OPEN_STAGE)
  const byVerdict = open.reduce<Record<string, number>>((acc, row) => { const key = row.screeningVerdict ?? '-'; acc[key] = (acc[key] ?? 0) + 1; return acc }, {})
  console.log(`rows ${rows.length}; closed by screening ${changed}; still open ${open.length} (${Object.entries(byVerdict).map(([k, n]) => `${k}=${n}`).join(' ')})`)
  if (!process.argv.includes('--save')) { console.log('dry run: add --save to write (a .bak copy is kept)'); return }
  if (changed === 0) return
  await copyFile(path, `${path}.bak-${Date.now()}`)
  await writeFile(path, JSON.stringify(next, null, 2), { mode: 0o600 })
  console.log(`saved ${path}`)
}

if (process.argv[1]?.endsWith('triage-queue.ts')) {
  main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 })
}
