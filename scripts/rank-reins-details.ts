/**
 * Orders saved REINS detail pages for the expensive steps (photos, four languages, publication):
 * still available first, REINS advertising allowed first, then room photos, then the user's
 * price range. Reads files only (0 yen); never touches the database.
 *
 *   npx tsx scripts/rank-reins-details.ts --dir <folder of saved REINS detail pages> [--out <file.md>]
 *
 * A page whose drawing says 「自社HP可」 can still be a candidate when REINS says 不可 (user rule):
 * take those from the screening report, not from this list.
 */
import { chmodSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { compareDetails, detailCandidate, photoTier } from '../src/lib/acquisition-priority'
import { parseReinsDetail, type ReinsDetail } from '../src/lib/reins-detail'

const PHOTO_LABELS = ['室内写真3枚以上', '室内写真あり（少）／名前なし写真', '室内写真なし']

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index > 0 ? process.argv[index + 1] : undefined
}

function main() {
  const dirArgument = argumentValue('--dir')
  if (!dirArgument) {
    console.error('Usage: npx tsx scripts/rank-reins-details.ts --dir <folder> [--out <file.md>]')
    process.exitCode = 2
    return
  }
  const dir = resolve(dirArgument)
  const saved = readdirSync(dir).filter((name) => name.endsWith('.txt')).map((file) => {
    const path = resolve(dir, file)
    return { file, modified: statSync(path).mtimeMs, detail: parseReinsDetail(readFileSync(path, 'utf8')) }
  }).filter((item) => item.detail.sourcePropertyId).toSorted((left, right) => right.modified - left.modified)
  // Several saves of one property: newest value per field, and the fullest photo list.
  const merged = new Map<string, { detail: ReinsDetail; files: string[] }>()
  for (const { file, detail } of saved) {
    const current = merged.get(detail.sourcePropertyId!)
    if (!current) { merged.set(detail.sourcePropertyId!, { detail, files: [file] }); continue }
    const kept = current.detail
    current.detail = {
      sourcePropertyId: kept.sourcePropertyId,
      price: kept.price ?? detail.price,
      adField: kept.adField ?? detail.adField,
      dealStatus: kept.dealStatus ?? detail.dealStatus,
      changedOn: kept.changedOn ?? detail.changedOn,
      imageNames: kept.imageNames.length >= detail.imageNames.length ? kept.imageNames : detail.imageNames,
    }
    current.files.push(file)
  }
  const ranked = [...merged.values()].map(({ detail, files }) => ({ candidate: detailCandidate({ ...detail, sourcePropertyId: detail.sourcePropertyId! }), file: files.join(', ') }))
    .toSorted((left, right) => compareDetails(left.candidate, right.candidate))
  const lines = [
    '| 順 | REINS物件番号 | 価格 | 広告転載区分 | 写真 | 状態 | ファイル |',
    '| ---: | --- | ---: | --- | --- | --- | --- |',
    ...ranked.map(({ candidate, file }, index) => [
      index + 1,
      candidate.sourcePropertyId,
      candidate.price === null ? '—' : `${(candidate.price / 10_000).toLocaleString('ja-JP')}万円`,
      `${candidate.adField ?? '—'}${candidate.adPermits ? '' : '（REINS上は不可・条件付き）'}`,
      `${PHOTO_LABELS[photoTier(candidate)]}（室内${candidate.interior}・名前なし${candidate.unlabeled}）`,
      candidate.blocked ? '申込・停止等（掲載しない）' : '公開中',
      file,
    ].join(' | ')).map((row) => `| ${row} |`),
  ]
  const report = ['# REINS詳細の作業順（写真あり優先）', '', ...lines, ''].join('\n')
  const out = argumentValue('--out')
  if (out) {
    writeFileSync(resolve(out), report, { mode: 0o600 })
    chmodSync(resolve(out), 0o600)
  }
  console.log(report)
}

main()
