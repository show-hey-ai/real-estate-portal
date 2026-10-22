import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { buildAcquisitionPlan } from '../src/lib/acquisition-plan'

const id = (n: number) => String(100_000_000_000 + n)
const page = (file: string, ids: string[]) => ({ file, rows: ids.map((value, i) => ({ id: value, i, text: 'broker phone must not appear in plan' })) })

test('queue and seen IDs both exclude downloads without marking the remaining IDs seen', () => {
  const seen = [id(2)]
  const queue = [{ sourceId: id(1), stage: 'held-current-ad-denied' }]
  const plan = buildAcquisitionPlan([page('page1.json', [id(1), id(2), id(3)])], queue, seen)
  assert.deepEqual(plan.batches[0].sourceIds, [id(3)])
  assert.deepEqual(plan.counts, { inputRows: 3, knownRows: 2, duplicateRows: 0, newSources: 1, batches: 1 })
  assert.deepEqual(seen, [id(2)])
  assert.equal(queue[0].stage, 'held-current-ad-denied')
  assert.ok(!JSON.stringify(plan).includes('broker phone'))
})

test('batches never cross result pages, hold at most ten, and keep source-row and PDF-page correspondence', () => {
  const plan = buildAcquisitionPlan([page('page1.json', Array.from({ length: 23 }, (_, i) => id(i))), page('page2.json', [id(30)])], [], [])
  assert.deepEqual(plan.batches.map((batch) => batch.sourceIds.length), [10, 10, 3, 1])
  assert.equal(plan.batches[1].sourceFile, 'page1.json')
  assert.deepEqual(plan.batches[1].selection[0], { sourceId: id(10), rowIndex: 10, pdfPage: 1 })
  assert.deepEqual(plan.batches[1].selection[9], { sourceId: id(19), rowIndex: 19, pdfPage: 10 })
  assert.equal(plan.batches[3].sourceFile, 'page2.json')
})

test('repeated sources across input pages appear only once, with their first occurrence retained', () => {
  const plan = buildAcquisitionPlan([page('p1', [id(1), id(1)]), page('p2', [id(1), id(2)])], [], [])
  assert.deepEqual(plan.batches.flatMap((batch) => batch.sourceIds), [id(1), id(2)])
  assert.equal(plan.counts.duplicateRows, 2)
  assert.equal(plan.batches[0].selection[0].rowIndex, 0)
})

test('pending sources are still planned until they enter the queue or seen record', () => {
  const plan = buildAcquisitionPlan([{ file: 'pending', rows: [{ id: id(1), i: 45, stage: 'awaiting-source-document' }] }], [], [])
  assert.deepEqual(plan.batches[0].selection, [{ sourceId: id(1), rowIndex: 45, pdfPage: 1 }])
})

test('an unsorted capture is put in displayed-row order before assigning PDF page numbers', () => {
  const plan = buildAcquisitionPlan([{ file: 'p', rows: [{ id: id(2), i: 48 }, { id: id(1), i: 45 }] }], [], [])
  assert.deepEqual(plan.batches[0].selection, [{ sourceId: id(1), rowIndex: 45, pdfPage: 1 }, { sourceId: id(2), rowIndex: 48, pdfPage: 2 }])
})

test('supports sourceId rows and reports a fully known page without empty batches', () => {
  const plan = buildAcquisitionPlan([{ file: 'p', rows: [{ sourceId: id(1) }] }], [], [id(1)])
  assert.deepEqual(plan.batches, [])
  assert.equal(plan.counts.knownRows, 1)
  assert.deepEqual(buildAcquisitionPlan([], [], []).counts, { inputRows: 0, knownRows: 0, duplicateRows: 0, newSources: 0, batches: 0 })
})

test('rejects malformed IDs and collection shapes rather than silently omitting duplicate guards', () => {
  for (const rows of [null, {}, [{ id: 123 }], [{ id: 'bad' }], [{ id: id(1), sourceId: id(2) }], [{ id: id(1), i: -1 }], [null]]) {
    assert.throws(() => buildAcquisitionPlan([{ file: 'p', rows }], [], []))
  }
  for (const queue of [null, {}, [{}], [{ sourceId: 'bad' }], [null]]) {
    assert.throws(() => buildAcquisitionPlan([], queue, []))
  }
  for (const seen of [null, {}, [123], ['bad']]) assert.throws(() => buildAcquisitionPlan([], [], seen))
})

test('rejects two different sources assigned to the same result-row index', () => {
  assert.throws(() => buildAcquisitionPlan([{ file: 'p', rows: [{ id: id(1), i: 2 }, { id: id(2), i: 2 }] }], [], []), /row index/)
})

test('CLI creates an owner-only, non-overwriting plan and leaves input files unchanged', async (t) => {
  const dir = await mkdtemp(join(tmpdir(), 'ziyou-acquisition-plan-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const files = { rows: join(dir, 'rows.json'), queue: join(dir, 'queue.json'), seen: join(dir, 'seen.json'), out: join(dir, 'plan.json') }
  const before = [JSON.stringify(page('p', [id(1), id(2)]).rows), JSON.stringify([{ sourceId: id(1) }]), '[]']
  await Promise.all([writeFile(files.rows, before[0]), writeFile(files.queue, before[1]), writeFile(files.seen, before[2])])
  const args = ['--import', 'tsx', 'scripts/plan-acquisition.ts', '--rows', files.rows, '--queue', files.queue, '--seen', files.seen, '--out', files.out]
  const stdout = execFileSync(process.execPath, args, { encoding: 'utf8' })
  assert.match(stdout, /new 1/)
  const saved = JSON.parse(await readFile(files.out, 'utf8'))
  assert.deepEqual(saved.batches[0].sourceIds, [id(2)])
  assert.equal(saved.inputs.length, 3)
  assert.ok(saved.inputs.every((input: { sha256: string }) => /^[a-f0-9]{64}$/.test(input.sha256)))
  assert.equal((await stat(files.out)).mode & 0o777, 0o600)
  assert.deepEqual(await Promise.all([readFile(files.rows, 'utf8'), readFile(files.queue, 'utf8'), readFile(files.seen, 'utf8')]), before)
  assert.throws(() => execFileSync(process.execPath, args, { stdio: 'pipe' }), /Command failed/)
  assert.deepEqual(JSON.parse(await readFile(files.out, 'utf8')), saved)
  assert.throws(() => execFileSync(process.execPath, ['--import', 'tsx', 'scripts/plan-acquisition.ts', '--rows'], { stdio: 'pipe' }), /Command failed/)
})
