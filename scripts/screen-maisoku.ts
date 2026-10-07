/**
 * Free first-pass screening of a bulk maisoku download (0 yen: local OCR and keyword rules).
 *
 *   npx tsx scripts/screen-maisoku.ts --pdf <batch.pdf> [--pdf <batch2.pdf>] --out <private dir>
 *   npx tsx scripts/screen-maisoku.ts --ocr <ocr-pages.json> --out <private dir>
 *
 * Renders pages with pdftoppm, reads them with Apple Vision (scripts/maisoku-ocr.swift), and
 * writes screening.json and screening.md (mode 600) listing pages in work order. It never reads
 * or writes the database and never grants permission: the drawing is still read by eye before
 * a listing goes through the normal publication checks.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, resolve } from 'node:path'
import { ocrRows, screenAdvertising, type OcrLine, type ScreeningVerdict } from '../src/lib/ad-screening'
import { comparePages, isWorkable, pagePrice, pageWard } from '../src/lib/acquisition-priority'

interface OcrPage { file: string; lines: OcrLine[] }
interface Input { file: string; sha256: string; fromPdf: boolean; pages: OcrPage[] }

const RENDER_DPI = '200'
const TOOL_PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ''}`
const LABELS: Record<ScreeningVerdict, { name: string; next: string }> = {
  permitted: { name: '掲載可の記載あり', next: '原図面で許可文を目視確認 → REINS詳細へ' },
  unclear: { name: '要確認（一部不可・選択式・矛盾）', next: '原図面を目視して判断' },
  no_mention: { name: '記載なし', next: 'REINS詳細の「広告転載区分」を確認（転載可・広告可なら候補）' },
  consent: { name: '承諾・連絡・申請が必要', next: '保留（連絡は送らない）' },
  denied: { name: '広告不可', next: '除外' },
}

function argumentValues(name: string): string[] {
  return process.argv.flatMap((value, index) => (process.argv[index - 1] === name ? [value] : []))
}

/** Owner-only, also when the file or folder already existed with wider permissions. */
function writePrivate(file: string, content: string): void {
  writeFileSync(file, content, { mode: 0o600 })
  chmodSync(file, 0o600)
}

function privateDir(dir: string): void {
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  chmodSync(dir, 0o700)
}

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function ocrPdf(pdf: string, out: string): Input {
  const base = basename(pdf).replace(/\.pdf$/i, '').replace(/[^\w.-]+/g, '_')
  const pagesDir = resolve(out, `pages-${base}`)
  privateDir(pagesDir)
  const env = { ...process.env, PATH: TOOL_PATH }
  execFileSync('pdftoppm', ['-r', RENDER_DPI, '-png', pdf, resolve(pagesDir, 'page')], { env, stdio: 'inherit' })
  const ocrFile = resolve(out, `ocr-${base}.json`)
  execFileSync('swift', [resolve(__dirname, 'maisoku-ocr.swift'), pagesDir, ocrFile], { env, stdio: 'inherit' })
  return { file: pdf, sha256: sha256(pdf), fromPdf: true, pages: JSON.parse(readFileSync(ocrFile, 'utf8')) as OcrPage[] }
}

function yen(price: number | null): string {
  return price === null ? '—' : `${(price / 10_000).toLocaleString('ja-JP')}万円`
}

function cell(text: string): string {
  return text.replaceAll('|', '／').replace(/\s+/g, ' ')
}

function main() {
  const pdfs = argumentValues('--pdf').map((file) => resolve(file))
  const ocrFiles = argumentValues('--ocr').map((file) => resolve(file))
  const outArgument = argumentValues('--out')[0]
  if (!outArgument || (!pdfs.length && !ocrFiles.length)) {
    console.error('Usage: npx tsx scripts/screen-maisoku.ts (--pdf <file> | --ocr <ocr-pages.json>)... --out <private directory>')
    process.exitCode = 2
    return
  }
  const out = resolve(outArgument)
  privateDir(out)
  const inputs: Input[] = [
    ...pdfs.map((pdf) => ocrPdf(pdf, out)),
    ...ocrFiles.map((file) => ({ file, sha256: sha256(file), fromPdf: false, pages: JSON.parse(readFileSync(file, 'utf8')) as OcrPage[] })),
  ]
  const pages = inputs.flatMap((input) => input.pages.map((page, index) => {
    const rows = ocrRows(page.lines)
    const result = screenAdvertising(rows)
    return { page: input.fromPdf ? `${basename(input.file)} p.${index + 1}` : page.file, image: page.file, ...result, price: pagePrice(rows), ward: pageWard(rows) }
  })).toSorted(comparePages)

  const counts = Object.fromEntries((Object.keys(LABELS) as ScreeningVerdict[]).map((verdict) => [verdict, pages.filter((page) => page.verdict === verdict).length]))
  const createdAt = new Date()
  writePrivate(resolve(out, 'screening.json'), JSON.stringify({ createdAt: createdAt.toISOString(), method: 'Apple Vision OCR + keyword rules (src/lib/ad-screening.ts); 0 yen', inputs: inputs.map(({ file, sha256: hash, pages: list }) => ({ file, sha256: hash, pages: list.length })), counts, pages }, null, 2))

  const jst = new Date(createdAt.getTime() + 9 * 3600_000).toISOString().replace('T', ' ').slice(0, 16)
  const row = (page: typeof pages[number], order: number | string) => `| ${order} | ${cell(page.page)} | ${page.ward ?? '—'} | ${yen(page.price)} | ${LABELS[page.verdict].name} | ${cell(page.evidence.join(' ／ ') || '—')} |`
  const workable = pages.filter((page) => isWorkable(page.verdict))
  const skipped = pages.filter((page) => !isWorkable(page.verdict))
  const report = [
    '# マイソク広告条件の一次判定（0円・キーワード）',
    '',
    `作成：${jst} JST　入力：${inputs.map((input) => `${basename(input.file)}（${input.pages.length}ページ）`).join('、')}`,
    '',
    'この判定は作業の順番を決めるためのものです。掲載してよいかは、これまでどおり原図面の目視とREINS詳細で確認します。',
    '',
    '## 集計',
    '',
    '| 判定 | 件数 | 次の作業 |',
    '| --- | ---: | --- |',
    ...(Object.keys(LABELS) as ScreeningVerdict[]).map((verdict) => `| ${LABELS[verdict].name} | ${counts[verdict]} | ${LABELS[verdict].next} |`),
    '',
    '## 作業順（上から。価格は5,000万〜1億円 → 1億円超 → その他の順）',
    '',
    '| 順 | ページ | 区 | 価格（OCR参考） | 判定 | 根拠 |',
    '| ---: | --- | --- | ---: | --- | --- |',
    ...workable.map((page, index) => row(page, index + 1)),
    '',
    '## 保留・除外（根拠の文字だけ念のため確認）',
    '',
    '| | ページ | 区 | 価格（OCR参考） | 判定 | 根拠 |',
    '| --- | --- | --- | ---: | --- | --- |',
    ...skipped.map((page) => row(page, '—')),
    '',
  ].join('\n')
  writePrivate(resolve(out, 'screening.md'), report)
  console.log(JSON.stringify({ pages: pages.length, counts, report: resolve(out, 'screening.md') }))
}

main()
