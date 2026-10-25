/**
 * Weekly listing quality check (Mondays, LaunchAgent com.ziyou.portal-quality). Writes the open
 * issues to HANDOFF.md for the operator, and mails the owner only when a required issue has been
 * open for two weeks (2026-10-25 owner decision: "判断が要る時だけ報告").
 *
 *   npm run quality:report [-- --dry-run]
 */
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { prisma } from '../src/lib/db'
import { getPublicListingScope } from '../src/lib/public-listing-scope'
import { getPublicArticles } from '../src/lib/portal-articles'
import { ISSUE_FIX, escalations, listingQualityIssues, mergeIssueHistory, type IssueType } from '../src/lib/listing-quality'
import { sendOperatorMail } from '../src/lib/autonomy/notifications'

const HANDOFF = process.env.QUALITY_HANDOFF_FILE ?? join(homedir(), 'Documents/ChatGPT/ポータル/HANDOFF.md')
const STATE = process.env.QUALITY_STATE_FILE ?? join(homedir(), 'Library/Application Support/Ziyou Portal/autonomy/quality-history.json')
const START = '<!-- quality-report:start -->', END = '<!-- quality-report:end -->'
const MAX_ROWS = 15
const dryRun = process.argv.includes('--dry-run')
const jst = (date: Date) => date.toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 16)

type Row = { key: string; id: string; type: IssueType | 'article-hidden'; optional: boolean; detail: string }

async function collect(): Promise<Row[]> {
  const listings = await prisma.listing.findMany({
    where: getPublicListingScope(new Date()),
    select: { sourcePropertyId: true, id: true, descriptionJa: true, descriptionEn: true, addressPublic: true, stations: true, media: { where: { isAdopted: true }, select: { url: true, category: true, sortOrder: true } } },
  })
  const rows: Row[] = listings.flatMap((listing) => listingQualityIssues(listing).map((issue) => {
    const id = listing.sourcePropertyId ?? listing.id
    return { key: `${id}:${issue.type}`, id, type: issue.type, optional: issue.optional, detail: issue.detail }
  }))
  const published = await prisma.portalArticle.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true } })
  const visible = new Set((await getPublicArticles()).map((article) => article.slug))
  for (const { slug } of published) if (!visible.has(slug)) rows.push({ key: `${slug}:article-hidden`, id: slug, type: 'article-hidden', optional: false, detail: '自動で作り直し待ち' })
  return rows
}

function section(rows: Row[], history: Record<string, string>, decisions: string[], now: Date): string {
  const label = (type: Row['type']) => type === 'article-hidden' ? '記事が非表示（worker が自動で作り直す。対応不要）' : ISSUE_FIX[type]
  const counts = Object.entries(rows.reduce<Record<string, number>>((acc, row) => ({ ...acc, [row.type]: (acc[row.type] ?? 0) + 1 }), {}))
  const required = rows.filter((row) => !row.optional && row.type !== 'article-hidden' && row.type !== 'station-untranslated')
  const line = (row: Row) => `| ${row.id} | ${row.type} | ${row.detail.replace(/\|/g, '/')} | ${history[row.key]?.slice(0, 10) ?? '-'} |`
  return [
    START,
    `## 掲載品質（Claude が毎週月曜に自動点検、${jst(now)} JST 時点）`,
    '- Codex：下の「直す物件」を次回の実行で直す（公開審査と同じ手順で descriptionEn 等を更新）。直したら次の点検で自動で消える。任意の項目は原資料に材料がある場合だけ。',
    `- 件数：${counts.map(([type, n]) => `${type}=${n}`).join(' ') || 'なし'}。オーナーへの連絡は 14 日以上直らない必須項目があるときだけ（今回 ${decisions.length} 件）。`,
    ...Object.entries(ISSUE_FIX).map(([type, fix]) => `- ${type}：${fix}`),
    '',
    '### 直す物件（必須）',
    required.length ? ['| 物件番号 | 問題 | 内容 | 初回検出 |', '|---|---|---|---|', ...required.slice(0, MAX_ROWS).map(line), ...(required.length > MAX_ROWS ? [`- ほか ${required.length - MAX_ROWS} 件`] : [])].join('\n') : '- なし',
    '',
    `### 任意（原資料に材料があれば）：${rows.filter((row) => row.optional).length} 件`,
    rows.filter((row) => row.optional).slice(0, 15).map((row) => `${row.id}(${row.type})`).join(' ') || '- なし',
    '',
    `- 参考：${label('article-hidden')} ${rows.filter((row) => row.type === 'article-hidden').length} 件、駅名辞書の不足 ${rows.filter((row) => row.type === 'station-untranslated').length} 件（Claude 対応）。`,
    END,
  ].join('\n')
}

async function writeHandoff(block: string) {
  const text = await readFile(HANDOFF, 'utf8')
  const start = text.indexOf(START), end = text.indexOf(END)
  const next = start !== -1 && end > start ? `${text.slice(0, start)}${block}${text.slice(end + END.length)}`
    : text.includes('## Claude側の担当') ? text.replace('## Claude側の担当', `${block}\n\n## Claude側の担当`) : `${text.trimEnd()}\n\n${block}\n`
  await writeFile(HANDOFF, next)
}

async function main() {
  const now = new Date()
  const rows = await collect()
  const previous = JSON.parse(await readFile(STATE, 'utf8').catch(() => '{}')) as Record<string, string>
  const history = mergeIssueHistory(previous, rows.map((row) => row.key), now)
  const decisions = escalations(history, now)
  const block = section(rows, history, decisions, now)
  if (dryRun) { console.log(block); return }
  await writeFile(STATE, JSON.stringify(history, null, 1), { mode: 0o600 })
  await writeHandoff(block)
  if (decisions.length) {
    const text = ['掲載品質の点検で、2週間以上直っていない項目があります。掲載を続けるか、やめるかの判断をお願いします。', '', ...decisions.map((key) => `- ${key.replace(':', '：')}`), '', `詳細：${HANDOFF} の「掲載品質」`].join('\n')
    const sent = await sendOperatorMail('【判断のお願い】掲載品質で2週間直っていない物件があります', text, `quality-escalation:${now.toISOString().slice(0, 10)}`)
    console.log('mail', sent.state)
  }
  console.log(`quality ${jst(now)}: ${rows.length} issues, ${decisions.length} need a decision`)
}

main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
