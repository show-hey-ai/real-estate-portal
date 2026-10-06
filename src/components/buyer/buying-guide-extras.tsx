import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarClock, Clock } from 'lucide-react'
import type { Locale } from '@/i18n/config'
import { getGuideArticles } from '@/content/guides'
import { PurchaseCosts } from '@/components/listing/purchase-costs'
import { BuyingCostsOverview } from '@/components/buyer/buying-costs-overview'

/** Worked example for the cost breakdown on the guide page. */
const EXAMPLE_PRICE = 50_000_000

const copy = {
  ja: {
    timelineTitle: '購入申込から引渡しまでの目安',
    timelineNote: '住宅ローンを使う場合の一般的な目安です。現金購入や売主の事情で短くも長くもなります。外国籍の方のローンは下の説明をご覧ください。',
    timeline: [
      { label: '購入申込', duration: '1日', detail: '価格や条件を書面で伝えます。' },
      { label: '重要事項説明・売買契約', duration: '申込から約1〜2週間', detail: '物件の権利・法令・管理の説明を受けて契約し、手付金を払います。' },
      { label: 'ローン本審査・決済準備', duration: '契約から約3〜6週間', detail: '金融機関の審査、残代金と諸費用の準備、登記の手配をします。' },
      { label: '決済・引渡し', duration: '1日', detail: '残代金を払い、所有権移転登記をして鍵を受け取ります。' },
    ],
    costsTitle: '諸費用の目安（例：5,000万円の物件）',
    guidesTitle: 'くわしいガイド',
    minutes: (count: number) => `${count}分で読めます`,
  },
  en: {
    timelineTitle: 'From offer to handover: a typical timeline',
    timelineNote: 'A typical schedule with a mortgage. Cash purchases or seller circumstances can make it shorter or longer. Mortgages for foreign nationals are explained below.',
    timeline: [
      { label: 'Purchase application', duration: '1 day', detail: 'You put your price and conditions in writing.' },
      { label: 'Disclosure and contract', duration: 'About 1–2 weeks after', detail: 'You hear the legal and management disclosure, sign, and pay the deposit.' },
      { label: 'Loan approval and preparation', duration: 'About 3–6 weeks after', detail: 'Final loan review, funds and fees, and registration arrangements.' },
      { label: 'Settlement and handover', duration: '1 day', detail: 'You pay the balance, ownership is registered, and you receive the keys.' },
    ],
    costsTitle: 'Purchase costs at a glance (example: ¥50 million property)',
    guidesTitle: 'In-depth guides',
    minutes: (count: number) => `${count} min read`,
  },
  'zh-TW': {
    timelineTitle: '從購買申請到交屋的時程',
    timelineNote: '使用房貸時的一般時程。全額現金或賣方情況可能使時程縮短或延長。外國籍買家的貸款請見下方說明。',
    timeline: [
      { label: '購買申請', duration: '1天', detail: '以書面提出價格與條件。' },
      { label: '重要事項說明・簽約', duration: '申請後約1〜2週', detail: '聽取權利、法規與管理說明後簽約並支付訂金。' },
      { label: '貸款正式審查・交割準備', duration: '簽約後約3〜6週', detail: '金融機構審查、準備尾款與雜費、安排登記。' },
      { label: '交割・交屋', duration: '1天', detail: '支付尾款、辦理所有權移轉登記並領取鑰匙。' },
    ],
    costsTitle: '購屋雜費試算（例：5,000萬日圓物件）',
    guidesTitle: '詳細指南',
    minutes: (count: number) => `約${count}分鐘閱讀`,
  },
  'zh-CN': {
    timelineTitle: '从购买申请到交房的时间表',
    timelineNote: '使用房贷时的一般时间表。全款购买或卖方情况可能使时间缩短或延长。外国籍买家的贷款请见下方说明。',
    timeline: [
      { label: '购买申请', duration: '1天', detail: '以书面提出价格与条件。' },
      { label: '重要事项说明・签约', duration: '申请后约1〜2周', detail: '听取权利、法规与管理说明后签约并支付定金。' },
      { label: '贷款正式审批・交割准备', duration: '签约后约3〜6周', detail: '金融机构审批、准备尾款与杂费、安排登记。' },
      { label: '交割・交房', duration: '1天', detail: '支付尾款、办理所有权转移登记并领取钥匙。' },
    ],
    costsTitle: '购房杂费估算（例：5,000万日元房产）',
    guidesTitle: '详细指南',
    minutes: (count: number) => `约${count}分钟阅读`,
  },
} as const

interface BuyingGuideExtrasProps {
  locale: string
}

export function BuyingGuideExtras({ locale }: BuyingGuideExtrasProps) {
  const lang = (locale in copy ? locale : 'en') as keyof typeof copy
  const text = copy[lang]
  const guides = getGuideArticles(lang as Locale)
  return <>
    <section className="mt-12" aria-labelledby="guide-timeline-title" data-testid="guide-timeline">
      <h2 id="guide-timeline-title" className="flex items-center gap-2 text-2xl font-semibold"><CalendarClock aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.timelineTitle}</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-4">
        {text.timeline.map((step, index) => <li key={step.label} className="relative rounded-xl border border-[#dbe2e9] bg-white p-5">
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-[linear-gradient(90deg,#8fb0d6,#274d7d)]" style={{ opacity: 0.4 + index * 0.2 }} />
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#4a6789]"><Clock aria-hidden="true" className="h-3.5 w-3.5" />{step.duration}</p>
          <h3 className="mt-2 font-semibold">{step.label}</h3>
          <p className="mt-2 text-sm leading-6 text-[#536274]">{step.detail}</p>
        </li>)}
      </ol>
      <p className="mt-3 text-xs leading-5 text-[#536274]">{text.timelineNote}</p>
    </section>

    <BuyingCostsOverview locale={lang} />

    <div className="mt-6 max-w-3xl">
      <PurchaseCosts price={EXAMPLE_PRICE} locale={lang} title={text.costsTitle} showGuideLink={false} />
    </div>

    {guides.length > 0 && <section className="mt-12" aria-labelledby="guide-list-title">
      <h2 id="guide-list-title" className="flex items-center gap-2 text-2xl font-semibold"><BookOpen aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.guidesTitle}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {guides.map((guide) => <Link key={guide.slug} href={`/guides/${guide.slug}`} className="group flex flex-col rounded-xl border border-[#dbe2e9] bg-white p-5 transition-shadow hover:shadow-lg">
          <span className="text-xs font-semibold text-[#4a6789]">{guide.category}</span>
          <h3 className="mt-2 font-semibold leading-6 group-hover:underline">{guide.title}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#536274]">{guide.excerpt}</p>
          <span className="mt-4 flex items-center justify-between text-xs text-[#536274]">{text.minutes(guide.readMinutes)}<ArrowRight aria-hidden="true" className="h-4 w-4 text-[#274d7d]" /></span>
        </Link>)}
      </div>
    </section>}
  </>
}
