import { ArrowDown, ArrowRight, ClipboardList, Coins, FileCheck2, House, KeyRound, MapPin, WalletCards } from 'lucide-react'

type GuideStep = readonly [title: string, description: string]

const tones = [
  { badge: 'bg-sky-100 text-sky-800', art: 'bg-sky-50 text-sky-700' },
  { badge: 'bg-teal-100 text-teal-800', art: 'bg-teal-50 text-teal-700' },
  { badge: 'bg-amber-100 text-amber-900', art: 'bg-amber-50 text-amber-800' },
  { badge: 'bg-indigo-100 text-indigo-800', art: 'bg-indigo-50 text-indigo-700' },
] as const

function StepDrawing({ step }: { step: number }) {
  const primary = 'h-10 w-10 stroke-[1.5] lg:h-16 lg:w-16'
  const secondary = 'absolute bottom-0 right-0 h-6 w-6 rounded-lg bg-white p-1 shadow-sm stroke-[1.8] lg:bottom-2 lg:right-3 lg:h-9 lg:w-9 lg:rounded-xl lg:p-1.5'

  if (step === 0) return <><ClipboardList className={primary} /><MapPin className={secondary} /></>
  if (step === 1) return <div className="flex items-end gap-1 lg:gap-2"><House className="mb-1 h-7 w-7 stroke-[1.5] lg:h-11 lg:w-11" /><House className={primary} /></div>
  if (step === 2) return <><WalletCards className={primary} /><Coins className={secondary} /></>
  return <><FileCheck2 className={primary} /><KeyRound className={secondary} /></>
}

export function BuyingGuideFlow({ steps, label }: { steps: readonly GuideStep[]; label: string }) {
  return (
    <ol aria-label={label} role="list" className="grid list-none gap-8 lg:grid-cols-4">
      {steps.map(([title, description], index) => {
        const tone = tones[index] || tones[0]
        return (
          <li key={title} className="relative grid grid-cols-[5rem_1fr] items-center gap-x-4 gap-y-2 rounded-2xl border border-[#dce4eb] bg-white px-4 py-5 shadow-sm lg:flex lg:flex-col lg:gap-0 lg:px-5 lg:py-6">
            <span aria-hidden="true" className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold lg:left-4 lg:top-4 lg:h-8 lg:w-8 lg:text-sm ${tone.badge}`}>{index + 1}</span>
            <div aria-hidden="true" className={`relative row-span-2 mx-auto flex h-20 w-20 items-center justify-center rounded-2xl lg:h-28 lg:w-36 lg:rounded-[2rem] ${tone.art}`}><StepDrawing step={index} /></div>
            <h2 className="self-end text-base font-semibold leading-7 text-[#1b293a] lg:mt-6 lg:self-auto lg:text-center lg:text-lg">{title.replace(/^\d+\.\s*/, '')}</h2>
            <p className="self-start text-sm leading-7 text-[#657487] lg:mt-3 lg:self-auto">{description}</p>
            {index < steps.length - 1 && <>
              <ArrowRight aria-hidden="true" className="absolute -right-7 top-16 hidden h-6 w-6 text-[#74889c] lg:block" />
              <ArrowDown aria-hidden="true" className="absolute -bottom-7 left-1/2 h-6 w-6 -translate-x-1/2 text-[#74889c] lg:hidden" />
            </>}
          </li>
        )
      })}
    </ol>
  )
}
