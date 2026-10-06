import { BadgeCheck, Calculator, ExternalLink } from 'lucide-react'
import type { GuideExample, GuideSource, GuideTable } from '@/content/guides'

const copy = {
  ja: { sources: '出典・参考資料', reviewer: 'この記事について', supervisor: '監修：藤田翔平（宅地建物取引士）', reviewerBody: '東京都知事免許の不動産会社、自由不動産合同会社（宅地建物取引業 東京都知事（1）第108831号）が、実際の売買の手続きにもとづいて作成しています。制度や税率は変わることがあるため、契約前に最新の情報をご確認ください。個別の税務・法律の助言ではありません。', example: '計算例' },
  en: { sources: 'Sources', reviewer: 'About this guide', supervisor: 'Reviewed by Shohei Fujita, licensed real estate transaction specialist (宅地建物取引士)', reviewerBody: 'Written by Ziyou Real Estate LLC, a Tokyo-licensed real estate brokerage (Tokyo Governor (1) No. 108831), based on how purchases actually proceed. Rules and rates change, so confirm the latest details before you sign. This is not tax or legal advice for your situation.', example: 'Worked example' },
  'zh-TW': { sources: '出處與參考資料', reviewer: '關於本文', supervisor: '監修：藤田翔平（宅地建物交易士）', reviewerBody: '由東京都知事許可的不動產公司自由不動產合同會社（宅地建物交易業 東京都知事（1）第108831號）依實際買賣流程撰寫。制度與稅率可能變動，簽約前請確認最新資訊。本文並非針對個別情況的稅務或法律建議。', example: '計算範例' },
  'zh-CN': { sources: '出处与参考资料', reviewer: '关于本文', supervisor: '审校：藤田翔平（宅地建物交易士）', reviewerBody: '由东京都知事许可的房产公司自由不动产合同会社（宅地建物交易业 东京都知事（1）第108831号）依据实际买卖流程撰写。制度与税率可能变化，签约前请确认最新信息。本文并非针对个别情况的税务或法律建议。', example: '计算示例' },
} as const

function textFor(locale: string) {
  return copy[locale as keyof typeof copy] ?? copy.en
}

export function GuideTableView({ table }: { table: GuideTable }) {
  return <div className="overflow-x-auto rounded-2xl border">
    <table className="w-full min-w-[480px] border-collapse text-sm">
      {table.caption && <caption className="px-4 pt-3 text-left text-xs font-semibold text-muted-foreground">{table.caption}</caption>}
      <thead><tr className="bg-muted/30">{table.headers.map((header) => <th key={header} scope="col" className="border-b px-4 py-3 text-left font-semibold">{header}</th>)}</tr></thead>
      <tbody>{table.rows.map((row, index) => <tr key={index} className="border-b last:border-0">{row.map((cell, cellIndex) => cellIndex === 0
        ? <th key={cellIndex} scope="row" className="px-4 py-3 text-left font-medium">{cell}</th>
        : <td key={cellIndex} className="px-4 py-3 text-muted-foreground">{cell}</td>)}</tr>)}</tbody>
    </table>
  </div>
}

export function GuideExampleView({ example, locale }: { example: GuideExample; locale: string }) {
  return <div className="rounded-2xl border border-[#e0a34a]/40 bg-[#fff8ec] p-5">
    <p className="flex items-center gap-2 text-xs font-semibold text-[#8a4b00]"><Calculator aria-hidden="true" className="h-4 w-4" />{textFor(locale).example}</p>
    <p className="mt-1 font-semibold text-[#1b293a]">{example.title}</p>
    <ul className="mt-3 space-y-1.5 text-sm leading-6 text-[#3d4a5a]">{example.lines.map((line) => <li key={line} className="tabular-nums">{line}</li>)}</ul>
    {example.note && <p className="mt-3 text-xs leading-5 text-muted-foreground">{example.note}</p>}
  </div>
}

export function GuideSources({ sources, locale }: { sources: GuideSource[]; locale: string }) {
  if (!sources.length) return null
  return <section className="mt-12" aria-labelledby="guide-sources-title">
    <h2 id="guide-sources-title" className="text-lg font-semibold">{textFor(locale).sources}</h2>
    <ul className="mt-3 space-y-2 text-sm">{sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#274d7d] underline underline-offset-2">{source.label}<ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /></a></li>)}</ul>
  </section>
}

/** Who wrote the guide and on what basis (E-E-A-T): the licensed operator. */
/** The supervising licensed agent; the registration number is deliberately not published. */
export const GUIDE_SUPERVISOR = { ja: '藤田翔平', en: 'Shohei Fujita' } as const

export function GuideReviewer({ locale }: { locale: string }) {
  const text = textFor(locale)
  return <aside className="mt-8 flex gap-3 rounded-2xl border bg-muted/20 p-5" aria-label={text.reviewer}>
    <BadgeCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#274d7d]" />
    <div><p className="text-sm font-semibold">{text.reviewer}</p><p className="mt-1 text-sm font-semibold text-[#274d7d]">{text.supervisor}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{text.reviewerBody}</p></div>
  </aside>
}
