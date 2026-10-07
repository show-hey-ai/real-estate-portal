import Link from 'next/link'
import { ArrowRight, Globe2 } from 'lucide-react'

const copy = {
  ja: { title: '海外から購入する方へ', body: 'お金の流れ（送金・決済・登記）と、契約前から引渡し後までのチェックリスト。' },
  en: { title: 'Buying from overseas?', body: 'How the money moves (transfer, settlement, registration), with a checklist from contract to handover.' },
  'zh-TW': { title: '從海外購買的您', body: '資金流向（匯款、交割、登記），以及從簽約前到交屋後的檢查清單。' },
  'zh-CN': { title: '从海外购买的您', body: '资金流向（汇款、交割、登记），以及从签约前到交房后的检查清单。' },
} as const

/** A link card to /buy-from-overseas, shown on listing pages and the international buyer page. */
export function OverseasBuyingLink({ locale }: { locale: string }) {
  const text = copy[locale as keyof typeof copy] ?? copy.en
  return <Link href="/buy-from-overseas" className="group flex items-start gap-3 rounded-xl border border-[#dbe2e9] bg-white p-4 transition-shadow hover:shadow-md" data-testid="overseas-buying-link">
    <Globe2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#274d7d]" />
    <span className="min-w-0">
      <span className="flex items-center gap-1 font-semibold text-[#1b293a] group-hover:underline">{text.title}<ArrowRight aria-hidden="true" className="h-4 w-4" /></span>
      <span className="mt-1 block text-sm leading-6 text-[#536274]">{text.body}</span>
    </span>
  </Link>
}
