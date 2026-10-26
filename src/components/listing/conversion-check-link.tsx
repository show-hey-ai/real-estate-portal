import { ArrowUpRight, Hotel } from 'lucide-react'
import { conversionCheckUrl } from '@/lib/conversion-check'

const generalTitle = {
  ja: 'ホテル・民泊にできる物件か、買う前に診断する',
  en: 'Thinking of a hotel or minpaku? Check the building before you buy',
  'zh-TW': '想做飯店・民宿？購買前先診斷物件',
  'zh-CN': '想做酒店·民宿？购买前先诊断物业',
} as const

const copy = {
  ja: {
    title: 'この物件でホテル・民泊を開業できるか診断する',
    body: '旅館業の案件を30件以上手がけてきた当社が、用途地域・道路・避難・消防など7つの関門を書類と公開情報で判定します。一次調査9,800円（税別）・3行政営業日。',
  },
  en: {
    title: 'Check whether this property can open as a hotel or minpaku',
    body: 'With 30+ inn projects behind us, we check seven gates on paper, including zoning, roads, egress and fire code. Stage 1: JPY 9,800 (excl. tax), 3 administrative business days.',
  },
  'zh-TW': {
    title: '診斷此物件能否開設飯店、民宿',
    body: '經手旅館業案件30件以上的我們，依據文件與公開資訊，檢查用途地域、道路、避難、消防等七道關卡。一次調查9,800日圓（未稅），3個行政工作日。',
  },
  'zh-CN': {
    title: '诊断此物业能否开设酒店·民宿',
    body: '经手旅馆业项目30件以上的我们，根据文件与公开信息，检查用途地域、道路、避难、消防等七道关口。一次调查9,800日元（不含税），3个行政工作日。',
  },
} as const

/** 物件ページからホテル・民泊 開業診断の申込フォームへ。所在地と物件URLを渡す。 */
/** variant="general" は一覧やトップ用（特定の物件を指さない文言）。 */
export function ConversionCheckLink({ locale, publicAddress, listingUrl, variant = 'listing' }: { locale: string; publicAddress?: string | null; listingUrl?: string; variant?: 'listing' | 'general' }) {
  const base = copy[locale as keyof typeof copy] ?? copy.en
  const text = variant === 'general' ? { ...base, title: generalTitle[locale as keyof typeof generalTitle] ?? generalTitle.en } : base
  const href = conversionCheckUrl({ locale, publicAddress, listingUrl })
  return <a href={href} target="_blank" rel="noopener" className="group mt-6 flex items-start gap-3 rounded-xl border border-[#e7c9cf] bg-[#fbf3f4] p-4 transition-shadow hover:shadow-md" data-testid="conversion-check-link">
    <Hotel aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#a3263d]" />
    <span className="min-w-0">
      <span className="flex items-center gap-1 font-semibold text-[#1b293a] group-hover:underline">{text.title}<ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0" /></span>
      <span className="mt-1 block text-sm leading-6 text-[#536274]">{text.body}</span>
    </span>
  </a>
}
