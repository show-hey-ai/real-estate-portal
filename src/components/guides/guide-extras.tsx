import Image from 'next/image'
import { AlertTriangle, BadgeCheck, Calculator, ExternalLink } from 'lucide-react'
import type { GuideCase, GuideExample, GuideSource, GuideTable } from '@/content/guides'

const copy = {
  ja: { cases: 'よくあるケースと防ぎ方', casesNote: '実際の取引ではなく、海外のお客様によくある状況をもとにした想定例です。', lesson: '防ぐには：', sources: '出典・参考資料', reviewer: 'この記事について', supervisor: '監修：藤田翔平（宅地建物取引士）', reviewerBody: '東京都知事免許の不動産会社、自由不動産合同会社（宅地建物取引業 東京都知事（1）第108831号）が、実際の売買の手続きにもとづいて作成しています。制度や税率は変わることがあるため、契約前に最新の情報をご確認ください。個別の税務・法律の助言ではありません。', example: '計算例' },
  en: { cases: 'Common situations and how to avoid them', casesNote: 'Illustrative cases based on situations international buyers often face, not specific deals.', lesson: 'How to avoid it: ', sources: 'Sources', reviewer: 'About this guide', supervisor: 'Reviewed by Shohei Fujita, licensed real estate transaction specialist (宅地建物取引士)', reviewerBody: 'Written by Ziyou Real Estate LLC, a Tokyo-licensed real estate brokerage (Tokyo Governor (1) No. 108831), based on how purchases actually proceed. Rules and rates change, so confirm the latest details before you sign. This is not tax or legal advice for your situation.', example: 'Worked example' },
  'zh-TW': { cases: '常見情況與預防方法', casesNote: '並非實際交易，而是依海外買家常見情況撰寫的假設案例。', lesson: '預防方法：', sources: '出處與參考資料', reviewer: '關於本文', supervisor: '監修：藤田翔平（宅地建物交易士）', reviewerBody: '由東京都知事許可的不動產公司自由不動產合同會社（宅地建物交易業 東京都知事（1）第108831號）依實際買賣流程撰寫。制度與稅率可能變動，簽約前請確認最新資訊。本文並非針對個別情況的稅務或法律建議。', example: '計算範例' },
  'zh-CN': { cases: '常见情况与预防方法', casesNote: '并非实际交易，而是根据海外买家常见情况撰写的假设案例。', lesson: '预防方法：', sources: '出处与参考资料', reviewer: '关于本文', supervisor: '审校：藤田翔平（宅地建物交易士）', reviewerBody: '由东京都知事许可的房产公司自由不动产合同会社（宅地建物交易业 东京都知事（1）第108831号）依据实际买卖流程撰写。制度与税率可能变化，签约前请确认最新信息。本文并非针对个别情况的税务或法律建议。', example: '计算示例' },
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
export const GUIDE_SUPERVISOR_PHOTO = '/images/team/shohei-fujita.jpg'

export function GuideReviewer({ locale }: { locale: string }) {
  const text = textFor(locale)
  return <aside className="mt-8 flex gap-4 rounded-2xl border bg-muted/20 p-5" aria-label={text.reviewer}>
    <Image src={GUIDE_SUPERVISOR_PHOTO} alt={text.supervisor} width={64} height={64} className="h-16 w-16 shrink-0 rounded-full object-cover" />
    <div><p className="flex items-center gap-1.5 text-sm font-semibold"><BadgeCheck aria-hidden="true" className="h-4 w-4 text-[#274d7d]" />{text.reviewer}</p><p className="mt-1 text-sm font-semibold text-[#274d7d]">{text.supervisor}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{text.reviewerBody}</p></div>
  </aside>
}

export function GuideCases({ cases, locale }: { cases: GuideCase[]; locale: string }) {
  if (!cases.length) return null
  const text = textFor(locale)
  return <section className="mt-12" aria-labelledby="guide-cases-title">
    <h2 id="guide-cases-title" className="text-2xl font-semibold tracking-tight">{text.cases}</h2>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">{text.casesNote}</p>
    <div className="mt-5 space-y-4">{cases.map((item) => <div key={item.title} className="rounded-2xl border p-5">
      <p className="flex items-center gap-2 font-semibold"><AlertTriangle aria-hidden="true" className="h-4 w-4 text-[#8a4b00]" />{item.title}</p>
      <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.situation}</p>
      <p className="mt-3 rounded-lg bg-[#edf3e7] px-3 py-2 text-sm leading-6 text-[#2f4a2a]"><span className="font-semibold">{text.lesson}</span>{item.lesson}</p>
    </div>)}</div>
  </section>
}
