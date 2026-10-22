/**
 * Plan new-source PDF downloads from saved REINS result pages. No browser, DB, network, queue
 * mutations, or permission decisions. Inputs are read once and hashed; output never overwrites.
 * npm run acquisition:plan -- --rows <page.json> [--rows <page2.json>] --queue <queue.json>
 *   --seen <seen-ids.json> [--out <new-private-plan.json>]
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { buildAcquisitionPlan } from '../src/lib/acquisition-plan'

async function main() {
  const args = process.argv.slice(2)
  const values = new Map<string, string[]>()
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]
    const value = args[i + 1]
    if (!['--rows', '--queue', '--seen', '--out'].includes(key) || !value || value.startsWith('--')) throw new Error('Use --rows <page.json> [--rows <page2.json>] --queue <queue.json> --seen <seen.json> [--out <new-plan.json>]')
    if (key !== '--rows' && values.has(key)) throw new Error(`Pass ${key} only once`)
    values.set(key, [...(values.get(key) ?? []), value])
  }
  const rowFiles = values.get('--rows') ?? []
  const queueFile = values.get('--queue')?.[0]
  const seenFile = values.get('--seen')?.[0]
  if (!rowFiles.length || !queueFile || !seenFile) throw new Error('--rows, --queue and --seen are required')
  const files = [...rowFiles, queueFile, seenFile].map((file) => resolve(file))
  const loaded = await Promise.all(files.map(async (file) => {
    const raw = await readFile(file)
    return { file, data: JSON.parse(raw.toString('utf8')) as unknown, sha256: createHash('sha256').update(raw).digest('hex') }
  }))
  const planned = buildAcquisitionPlan(loaded.slice(0, rowFiles.length).map(({ file, data }) => ({ file, rows: data })), loaded[rowFiles.length].data, loaded[rowFiles.length + 1].data)
  const report = {
    createdAt: new Date().toISOString(),
    kind: 'download-plan-only',
    requiresFreshUiSelectionCheck: true,
    inputs: loaded.map(({ file, sha256 }) => ({ file, sha256 })),
    ...planned,
  }
  const out = values.get('--out')?.[0]
  if (out) await writeFile(resolve(out), JSON.stringify(report, null, 2), { mode: 0o600, flag: 'wx' })
  const n = planned.counts
  console.log(`rows ${n.inputRows}; known ${n.knownRows}; repeated ${n.duplicateRows}; new ${n.newSources}; batches ${n.batches}${out ? '; private plan saved' : '; dry run (no files changed)'}`)
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Acquisition planning failed'); process.exitCode = 1 })
