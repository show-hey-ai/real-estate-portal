import { ArrowUpRight, Hotel } from 'lucide-react'
import { conversionCheckUrl } from '@/lib/conversion-check'

const copy = {
  ja: {
    title: 'この物件でホテル・旅館を開業できるか診断する',
    body: '用途地域・道路・避難・消防など7つの関門を、宅地建物取引業者が書類と公開情報で判定します。一次調査9,800円（税別）・3行政営業日。',
  },
  en: {
    title: 'Check whether this property can open as a hotel',
    body: 'A licensed brokerage checks seven gates on paper, including zoning, roads, egress and fire code. Stage 1: JPY 9,800 (excl. tax), 3 administrative business days.',
  },
  'zh-TW': {
    title: '診斷此物件能否開設飯店・旅館',
    body: '由持牌不動產仲介依據文件與公開資訊，檢查用途地域、道路、避難、消防等七道關卡。一次調查9,800日圓（未稅），3個行政工作日。',
  },
  'zh-CN': {
    title: '诊断此物业能否开设酒店·旅馆',
    body: '由持牌不动产中介根据文件与公开信息，检查用途地域、道路、避难、消防等七道关口。一次调查9,800日元（不含税），3个行政工作日。',
  },
} as const

/** 物件ページから宿泊転用・開業診断の申込フォームへ。所在地と物件URLを渡す。 */
export function ConversionCheckLink({ locale, publicAddress, listingUrl }: { locale: string; publicAddress?: string | null; listingUrl: string }) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const href = conversionCheckUrl({ locale, publicAddress, listingUrl })
  return <a href={href} target="_blank" rel="noopener" className="group mt-6 flex items-start gap-3 rounded-xl border border-[#e7c9cf] bg-[#fbf3f4] p-4 transition-shadow hover:shadow-md" data-testid="conversion-check-link">
    <Hotel aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#a3263d]" />
    <span className="min-w-0">
      <span className="flex items-center gap-1 font-semibold text-[#1b293a] group-hover:underline">{text.title}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span>
      <span className="mt-1 block text-sm leading-6 text-[#536274]">{text.body}</span>
    </span>
  </a>
}
