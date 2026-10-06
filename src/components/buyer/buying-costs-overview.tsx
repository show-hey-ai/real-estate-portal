import { Banknote, Building2, CalendarRange, FileSignature, IdCard, KeyRound, Landmark, MailOpen, Repeat, type LucideIcon } from 'lucide-react'
import { getBuyingCostsCopy, type CostStage, type FinancingKey } from '@/content/buying-costs'

const FINANCING: { key: FinancingKey; Icon: LucideIcon; tone: string }[] = [
  { key: 'visa', Icon: IdCard, tone: 'bg-[#e8f1fb] text-[#274d7d]' },
  { key: 'company', Icon: Building2, tone: 'bg-[#edf3e7] text-[#557447]' },
  { key: 'cash', Icon: Banknote, tone: 'bg-[#fff4e5] text-[#9a4d00]' },
]

const STAGES: { key: CostStage; Icon: LucideIcon; tone: string }[] = [
  { key: 'contract', Icon: FileSignature, tone: 'bg-[#e8f1fb] text-[#274d7d]' },
  { key: 'settlement', Icon: KeyRound, tone: 'bg-[#edf3e7] text-[#557447]' },
  { key: 'after', Icon: MailOpen, tone: 'bg-[#fcece8] text-[#aa5746]' },
  { key: 'holding', Icon: Repeat, tone: 'bg-[#f1ecfb] text-[#5b44a0]' },
]

/** Financing routes for foreign buyers and the usual costs, grouped by when they are paid. */
export function BuyingCostsOverview({ locale }: { locale: string }) {
  const text = getBuyingCostsCopy(locale)
  return <>
    <section className="mt-12" aria-labelledby="guide-financing-title" data-testid="guide-financing">
      <h2 id="guide-financing-title" className="flex items-center gap-2 text-2xl font-semibold"><Landmark aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.financingTitle}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-[#536274]">{text.financingIntro}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {FINANCING.map(({ key, Icon, tone }) => <div key={key} className="rounded-xl border border-[#dbe2e9] bg-white p-5">
          <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
          <h3 className="mt-4 font-semibold">{text.financing[key].title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#536274]">{text.financing[key].body}</p>
        </div>)}
      </div>
      <p className="mt-3 text-xs leading-5 text-[#536274]">{text.financingNote}</p>
    </section>

    <section className="mt-12" aria-labelledby="guide-costs-title" data-testid="guide-costs">
      <h2 id="guide-costs-title" className="flex items-center gap-2 text-2xl font-semibold"><CalendarRange aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.costsTitle}</h2>
      <p className="mt-3 max-w-3xl leading-7 text-[#536274]">{text.costsIntro}</p>
      <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map(({ key, Icon, tone }, index) => <li key={key} className="rounded-xl border border-[#dbe2e9] bg-white">
          <div className="flex items-center gap-3 border-b border-[#e5eaf0] p-4">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon aria-hidden="true" className="h-5 w-5" /></span>
            <h3 className="font-semibold"><span className="mr-1 text-[#4a6789]">{index + 1}.</span>{text.stages[key].title}</h3>
          </div>
          <dl className="divide-y divide-[#eef2f6]">
            {text.stages[key].items.map((item) => <div key={item.name} className="p-4">
              <dt className="text-sm font-semibold text-[#1b293a]">{item.name}</dt>
              <dd className="mt-1 text-sm font-semibold text-[#274d7d]">{item.amount}</dd>
              <dd className="mt-1 text-xs leading-5 text-[#536274]">{item.note}</dd>
            </div>)}
          </dl>
        </li>)}
      </ol>
      <p className="mt-3 text-xs leading-5 text-[#536274]">{text.costsNote}</p>
    </section>
  </>
}
