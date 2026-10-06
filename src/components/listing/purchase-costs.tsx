import Link from 'next/link'
import { Receipt } from 'lucide-react'
import { estimatePurchaseCosts } from '@/lib/purchase-costs'
import { formatYenWords } from '@/lib/yen-words'

const copy = {
  ja: { title: '購入時の諸費用の目安', price: '物件価格', brokerage: '仲介手数料（上限・税込）', stamp: '売買契約書の印紙税', other: 'その他（登記・不動産取得税・司法書士・火災保険・ローン費用など）', total: '物件価格＋諸費用', range: (low: string, high: string) => `${low}〜${high}`, note: '仲介手数料は法定上限、印紙税は国税庁の税額表（軽減措置は2027年3月31日まで）、その他は物件価格の3〜5%で計算した目安です。税額は固定資産税評価額などで変わり、現金購入なら低くなります。', lowPrice: '800万円以下の物件は、空き家等の特例で仲介手数料の上限が異なる場合があります。', guide: '費用の詳しい説明' },
  en: { title: 'Estimated purchase costs', price: 'Price', brokerage: 'Brokerage fee (maximum, incl. tax)', stamp: 'Stamp duty on the contract', other: 'Other (registration, acquisition tax, scrivener, insurance, loan fees)', total: 'Price + costs', range: (low: string, high: string) => `${low} – ${high}`, note: 'Brokerage is the legal maximum, stamp duty follows the National Tax Agency table (reduced rates until 31 March 2027) and other costs are 3–5% of the price. Taxes depend on assessed values; cash purchases cost less.', lowPrice: 'For properties at ¥8 million or less, a special rule for vacant homes can allow a different brokerage maximum.', guide: 'How purchase costs work' },
  'zh-TW': { title: '購屋雜費試算', price: '物件價格', brokerage: '仲介費（上限・含稅）', stamp: '買賣契約印花稅', other: '其他（登記、不動產取得稅、代書、火災保險、貸款費用等）', total: '物件價格＋雜費', range: (low: string, high: string) => `${low}〜${high}`, note: '仲介費為法定上限，印花稅依國稅廳稅額表（減稅措施至2027年3月31日），其他費用以物件價格的3〜5%估算。稅額依評定價值而異，現金購買會較低。', lowPrice: '800萬日圓以下的物件，可能適用空屋特例，仲介費上限不同。', guide: '費用詳細說明' },
  'zh-CN': { title: '购房杂费估算', price: '房产价格', brokerage: '中介费（上限・含税）', stamp: '买卖合同印花税', other: '其他（登记、不动产取得税、司法书士、火灾保险、贷款费用等）', total: '房产价格＋杂费', range: (low: string, high: string) => `${low}〜${high}`, note: '中介费为法定上限，印花税依国税厅税额表（减税措施至2027年3月31日），其他费用按房产价格的3〜5%估算。税额因评估价值而异，全款购买会更低。', lowPrice: '800万日元以下的房产，可能适用空置房特例，中介费上限不同。', guide: '费用详细说明' },
} as const

interface PurchaseCostsProps {
  price: number
  locale: string
  /** Overrides the heading, e.g. for a worked example on the buying guide. */
  title?: string
  showGuideLink?: boolean
}

export function PurchaseCosts({ price, locale, title, showGuideLink = true }: PurchaseCostsProps) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const costs = estimatePurchaseCosts(price)
  const yen = (value: number) => formatYenWords(Math.round(value / 10_000) * 10_000, locale)
  const otherMid = (costs.otherLow + costs.otherHigh) / 2
  const fees = costs.brokerage + costs.stamp + otherMid
  const segments = [
    { label: text.brokerage, value: costs.brokerage, display: yen(costs.brokerage), tone: 'bg-[#274d7d]' },
    { label: text.stamp, value: costs.stamp, display: formatYenWords(costs.stamp, locale), tone: 'bg-[#e0a34a]' },
    { label: text.other, value: otherMid, display: text.range(yen(costs.otherLow), yen(costs.otherHigh)), tone: 'bg-[#8fb0d6]' },
  ]
  return <section className="mt-6 rounded-xl border border-[#dbe2e9] bg-white p-4 md:p-6" aria-labelledby="purchase-costs-title" data-testid="purchase-costs">
    <h2 id="purchase-costs-title" className="flex items-center gap-2 text-lg font-semibold"><Receipt aria-hidden="true" className="h-5 w-5 text-primary" />{title ?? text.title}</h2>
    <div className="mt-4 rounded-lg bg-[#f4f7fb] p-4">
      <p className="text-xs font-semibold text-[#4a6789]">{text.total}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#1b293a]">{text.range(yen(price + costs.totalLow), yen(price + costs.totalHigh))}</p>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-[#e6edf4]" aria-hidden="true">
        {segments.map((segment) => <div key={segment.label} className={segment.tone} style={{ width: `${fees ? (segment.value / fees) * 100 : 0}%` }} />)}
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-3 border-b border-[#dbe2e9] pb-1.5"><dt className="text-[#536274]">{text.price}</dt><dd className="font-semibold tabular-nums">{yen(price)}</dd></div>
        {segments.map((segment) => <div key={segment.label} className="flex items-start justify-between gap-3"><dt className="flex items-start gap-2 text-[#536274]"><span aria-hidden="true" className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-sm ${segment.tone}`} />{segment.label}</dt><dd className="shrink-0 font-semibold tabular-nums">{segment.display}</dd></div>)}
      </dl>
    </div>
    <p className="mt-4 text-xs leading-5 text-[#536274]">{text.note}{costs.lowPriceRule && ` ${text.lowPrice}`}</p>
    {showGuideLink && <Link href="/buying-guide" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[#274d7d] hover:underline">{text.guide} →</Link>}
  </section>
}
