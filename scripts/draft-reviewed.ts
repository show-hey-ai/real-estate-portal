/**
 * Drafts the reviewed.json `facts` block (four-language template descriptions included) from saved
 * REINS 売買物件詳細 pages, so the operator reviews instead of retyping. Reads files only (0 yen).
 * Advertising permission is never decided here: adAllowed / adConsentRequired stay null.
 *
 *   npx tsx scripts/draft-reviewed.ts --snapshot <page.snapshot.txt> [--out <reviewed-draft.json>]
 *   npx tsx scripts/draft-reviewed.ts --dir <folder>   (writes <id>.draft.json next to each page)
 *
 * Output files are written with mode 600. Contact details on the page never reach the output.
 */
import { chmodSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { draftReviewedFacts, parseReinsDetailFacts, type ReinsDetailFacts, type ReviewedDraft } from '../src/lib/reins-detail-facts'

const PAGE_FILE = /\.(?:snapshot|detail)\.txt$/u

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index > 0 ? process.argv[index + 1] : undefined
}

function writePrivate(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 })
  chmodSync(path, 0o600)
}

function draftFile(path: string): { facts: ReinsDetailFacts; draft: ReviewedDraft } {
  const facts = parseReinsDetailFacts(readFileSync(path, 'utf8'))
  return { facts, draft: draftReviewedFacts(facts) }
}

function summaryLine(file: string, facts: ReinsDetailFacts, draft: ReviewedDraft): string {
  const price = facts.price === null ? '価格?' : `${(facts.price / 10_000).toLocaleString('ja-JP')}万円`
  const area = draft.facts.buildingArea ?? draft.facts.landArea
  return [
    facts.sourcePropertyId ?? `?(${file})`,
    price,
    area === null ? '面積?' : `${area.toFixed(2)}㎡`,
    facts.layout ?? '—',
    `広告:${facts.adField ?? '?'}`,
    `状況:${facts.dealStatus || '空欄'}`,
    `未読${draft.unread.length}${draft.unread.length ? `(${draft.unread.join(',')})` : ''}`,
  ].join('  ')
}

function main() {
  const snapshot = argumentValue('--snapshot')
  const dir = argumentValue('--dir')
  if (!snapshot && !dir) {
    console.error('Usage: npx tsx scripts/draft-reviewed.ts --snapshot <file> [--out <file.json>] | --dir <folder>')
    process.exitCode = 2
    return
  }
  if (snapshot) {
    const { draft } = draftFile(resolve(snapshot))
    const out = argumentValue('--out')
    if (out) writePrivate(resolve(out), draft)
    console.log(JSON.stringify(draft))
    return
  }
  const folder = resolve(dir!)
  const files = readdirSync(folder).filter((name) => PAGE_FILE.test(name)).toSorted()
  let written = 0
  for (const file of files) {
    const path = resolve(folder, file)
    const { facts, draft } = draftFile(path)
    if (!facts.form) {
      console.log(`${file}  REINS売買物件詳細ではない（スキップ）`)
      continue
    }
    const id = facts.sourcePropertyId ?? basename(file).replace(PAGE_FILE, '')
    writePrivate(resolve(dirname(path), `${id}.draft.json`), draft)
    written++
    console.log(summaryLine(file, facts, draft))
  }
  console.log(JSON.stringify({ pages: files.length, drafts: written }))
}

main()
