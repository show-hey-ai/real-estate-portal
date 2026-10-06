import type { Metadata } from 'next'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileText,
  Flame,
  Hammer,
  Hotel,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  UserCheck,
  WalletCards,
} from 'lucide-react'
import { PrintButton } from '@/components/common/print-button'
import { Button } from '@/components/ui/button'
import { absoluteUrl } from '@/lib/site-config'

const statusOptions = [
  {
    label: 'Clear',
    tone: 'border-[#c9d9cd] bg-[#f6fbf7] text-[#1f5d3e]',
  },
  {
    label: 'Unknown',
    tone: 'border-[#e7d1a3] bg-[#fffaf0] text-[#8a5a13]',
  },
  {
    label: 'Risk Found',
    tone: 'border-[#e3b2a8] bg-[#fff5f2] text-[#9b3529]',
  },
]

const checklist = [
  {
    question: 'Can this property legally be used for accommodation?',
    checkQuestion: 'Is accommodation use legally allowed for this property and location?',
    icon: Hotel,
    why:
      'A property may be close to a station, cheap, and attractive, but that does not mean it can legally operate as accommodation.',
    risk:
      'If nobody has checked the legal use before purchase, do not assume the property is safe.',
    who: 'Local public health center, local government, licensing specialist, or local advisor',
  },
  {
    question: 'Which legal route applies to this project?',
    checkQuestion:
      'Does this project require a hotel or ryokan business license, minpaku registration, or another legal structure?',
    icon: FileText,
    why:
      '"Airbnb" is not one simple legal category in Japan. The correct legal route depends on the property, location, operation style, and local rules.',
    risk: 'If the legal route is unclear, the business plan may be unreliable.',
    who: 'Public health center, licensing specialist, administrative scrivener, or local advisor',
  },
  {
    question: 'Has the local public health center been consulted?',
    checkQuestion:
      'Has anyone checked the project with the local public health center before purchase?',
    icon: MapPinned,
    why:
      'The public health center may check layout, hygiene, guest capacity, guest management, emergency response, and remote check-in systems.',
    risk:
      'If the public health center has not been consulted, you may discover licensing problems after purchase.',
    who: 'Public health center, licensing specialist, or local project manager',
  },
  {
    question: 'Can the property pass fire safety requirements?',
    checkQuestion: 'What fire safety equipment or construction will be required?',
    icon: Flame,
    why: 'Fire safety requirements can significantly increase the project cost.',
    risk: 'If the required fire safety work is unknown, your total cost estimate may be wrong.',
    who: 'Fire department, fire safety professional, fire equipment company',
  },
  {
    question: 'Are there building-code risks?',
    checkQuestion: 'Can the building legally and physically be used for accommodation?',
    icon: Building2,
    why:
      'A building may be fine as a house, apartment, or office, but that does not mean it is suitable for accommodation use.',
    risk:
      'If there are no building drawings, no inspection certificate, floor-area uncertainty, evacuation issues, or major differences between drawings and the current building, professional review is strongly recommended.',
    who: "Architect, building-code specialist, local government's building department when necessary",
  },
  {
    question: 'Is the required renovation actually possible?',
    checkQuestion: 'Can the required renovation be done within a realistic budget and timeline?',
    icon: Hammer,
    why: 'A project can look good on paper, but renovation may be difficult or expensive.',
    risk:
      'If plumbing, ventilation, bathrooms, electrical capacity, fire-safety work, or structural changes have not been checked, the real cost may be much higher than expected.',
    who: 'Architect, construction company, plumber, electrician, relevant contractors',
  },
  {
    question: 'Does the operation plan fit the building?',
    checkQuestion: 'Can this property actually be operated every day as accommodation?',
    icon: ClipboardCheck,
    why:
      'Even if the property gets permission, the business can fail if daily operation is weak.',
    risk:
      'If there is no clear plan for cleaning, linen, garbage, guest messages, check-in, emergency response, and maintenance, the property may not operate smoothly.',
    who: 'Accommodation operator, property manager, cleaning manager, local operation support',
  },
  {
    question: 'Can remote or unmanned operation work here?',
    checkQuestion:
      'If you want remote operation, can the property support remote check-in, guest verification, cameras, and emergency response?',
    icon: ShieldCheck,
    why:
      'Remote operation is possible in some cases, but not every building or local area is suitable.',
    risk:
      'If remote check-in, camera placement, identity verification, and emergency response have not been discussed before purchase, the operation plan may fail later.',
    who:
      'Public health center, operator, check-in system provider, camera system provider, local emergency response support',
  },
  {
    question: 'What is the total cost before opening?',
    checkQuestion:
      'What is the realistic total cost before the property can open for accommodation business?',
    icon: WalletCards,
    why: 'The purchase price is not the total investment.',
    risk:
      'If the estimate does not include renovation, fire safety, architect fees, licensing support, furniture, linen, smart locks, cameras, Wi-Fi, garbage setup, and operation preparation, the budget may be too optimistic.',
    who:
      'Project manager, architect, contractor, fire safety company, operator, accountant or tax advisor when necessary',
  },
  {
    question: 'Who is responsible for checking each risk before purchase?',
    checkQuestion:
      'Who is responsible for checking licensing, fire safety, building-code risk, renovation feasibility, and operation?',
    icon: UserCheck,
    why: 'If nobody is clearly responsible, important risks may be missed.',
    risk:
      'If the answer is "I thought the real estate agent checked everything," that is a serious warning sign.',
    who: 'Your local project manager, advisor, or coordination partner',
  },
]

export const metadata: Metadata = {
  title: 'Can This Property Become Accommodation in Japan?',
  description:
    'A pre-purchase risk checklist for foreign investors considering hotels, ryokan, Airbnb, or short-term rental projects in Japan.',
  alternates: {
    canonical: absoluteUrl('/hotel-airbnb-checklist'),
  },
  openGraph: {
    title: 'Can This Property Become Accommodation in Japan?',
    description:
      'A pre-purchase risk checklist for foreign investors considering accommodation projects in Japan.',
    url: absoluteUrl('/hotel-airbnb-checklist'),
  },
}

export default function HotelAirbnbChecklistPage() {
  return (
    <div className="lead-magnet-page bg-[#fbfaf6] text-[#111916]">
      <section className="relative overflow-hidden border-b border-[#e2ded2] bg-[linear-gradient(180deg,#ffffff_0%,#fbfaf6_100%)]">
        <div className="container py-12 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center">
            <div className="max-w-4xl">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-[8px] bg-[#10231e] text-[#d8a64a] shadow-sm">
                <ClipboardCheck className="h-6 w-6" />
              </div>
              <h1 className="max-w-4xl text-3xl font-semibold leading-[1.08] tracking-normal sm:text-4xl md:text-5xl lg:text-6xl">
                Can This Property Become Accommodation in Japan?
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-[#52605a] md:text-lg">
                A Pre-Purchase Risk Checklist for Foreign Investors Considering Hotels, Ryokan,
                Airbnb, or Short-Term Rental Projects in Japan
              </p>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-[#52605a] md:text-base">
                Before buying property in Japan for an accommodation business, do not judge only by
                price, location, or expected revenue. A property can look like a good real estate
                deal, but still become a bad accommodation project. Use this checklist before
                signing any contract.
              </p>
            </div>

            <aside className="rounded-[8px] border border-[#d9d2bd] bg-white p-5 shadow-[0_18px_45px_rgba(30,36,30,0.08)]">
              <div className="rounded-[8px] bg-[#10231e] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#d8a64a]">
                  Risk snapshot
                </p>
                <h2 className="mt-4 text-2xl font-semibold leading-tight">
                  Do not buy first and check later.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Mark each question, count Unknown and Risk Found answers, then decide whether the
                  property should be reviewed before signing.
                </p>
              </div>

              <div className="mt-4 grid gap-2">
                <div className="rounded-[8px] border border-[#e7d1a3] bg-[#fffaf0] p-4">
                  <p className="text-sm font-semibold text-[#8a5a13]">3+ Unknown</p>
                  <p className="mt-1 text-sm leading-6 text-[#5d5140]">
                    Stop and review before moving forward.
                  </p>
                </div>
                <div className="rounded-[8px] border border-[#e3b2a8] bg-[#fff5f2] p-4">
                  <p className="text-sm font-semibold text-[#9b3529]">Any Risk Found</p>
                  <p className="mt-1 text-sm leading-6 text-[#5d5140]">
                    Professional review is strongly recommended.
                  </p>
                </div>
              </div>

              <div className="no-print mt-5 flex flex-col gap-3">
                <PrintButton />
                <Link href="/checklists/japan-hospitality-property-checklist.md">
                  <Button
                    variant="outline"
                    className="h-11 w-full rounded-[8px] border-[#b7aa8d] bg-transparent text-sm font-semibold text-[#1a2a24] hover:bg-[#ebe5d6]"
                  >
                    Markdown version
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="border-b border-[#e2ded2] bg-[#fbfaf6] py-8">
        <div className="container">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
            <div className="rounded-[8px] border border-[#d9d2bd] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Important Note</h2>
              <p className="mt-3 text-sm leading-7 text-[#52605a]">
                This checklist is for general information only. It is not legal, architectural,
                fire-safety, tax, or investment advice. Final decisions should be made with
                qualified professionals and the relevant local authorities.
              </p>
            </div>
            <div className="rounded-[8px] border border-[#d9d2bd] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Status options</h2>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {statusOptions.map((status) => (
                  <div
                    key={status.label}
                    className={`flex items-center gap-2 rounded-[8px] border px-3 py-2 text-sm font-semibold ${status.tone}`}
                  >
                    <span className="h-4 w-4 rounded-[4px] border border-[#9f957d] bg-white" />
                    {status.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-10 md:py-12">
        <div className="container">
          <div className="mx-auto grid max-w-6xl gap-5">
            {checklist.map((item, index) => {
              const Icon = item.icon
              return (
                <article
                  key={item.question}
                  className="break-inside-avoid rounded-[8px] border border-[#d9d2bd] bg-white p-5 shadow-[0_12px_30px_rgba(25,35,31,0.05)] md:p-7"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="flex items-center gap-3 md:w-[72px] md:flex-col md:items-start">
                      <span className="flex h-10 min-w-10 items-center justify-center rounded-[8px] bg-[#10231e] text-sm font-semibold text-[#d8a64a]">
                        {index + 1}
                      </span>
                      <span className="flex h-10 min-w-10 items-center justify-center rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] text-[#2f6d58]">
                        <Icon className="h-5 w-5" />
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold leading-snug tracking-normal md:text-2xl">
                        {item.question}
                      </h2>

                      <div className="mt-4 rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] p-4">
                        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a17426]">
                          Question
                        </h3>
                        <p className="mt-2 text-base font-medium leading-7 text-[#17221e] md:text-lg">
                          {item.checkQuestion}
                        </p>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.82fr]">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a17426]">
                              Why this matters
                            </h3>
                            <p className="mt-2 text-[15px] leading-7 text-[#3f4c46] md:text-base">
                              {item.why}
                            </p>
                          </div>

                          <div>
                            <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#a17426]">
                              Who should check
                            </h3>
                            <p className="mt-2 text-[15px] leading-7 text-[#3f4c46]">{item.who}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex gap-3 rounded-[8px] border border-[#e7c98e] bg-[#fff8e8] p-4">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#a17426]" />
                            <p className="text-[15px] leading-7 text-[#4f422f]">
                              <span className="font-semibold text-[#1f1912]">Risk Signal: </span>
                              {item.risk}
                            </p>
                          </div>

                          <div className="rounded-[8px] border border-[#d9d2bd] bg-white p-4">
                            <h3 className="text-sm font-semibold">Your status</h3>
                            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                            {statusOptions.map((status) => (
                                <label
                                  key={status.label}
                                  className={`flex min-h-10 items-center gap-3 rounded-[8px] border px-3 text-sm font-semibold ${status.tone}`}
                                >
                                  <span className="h-4 w-4 shrink-0 rounded-[4px] border border-[#9f957d] bg-white" />
                                  {status.label}
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#ded6c4] bg-[#fbfaf6] py-10 md:py-12">
        <div className="container">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">Quick Result</h2>
              <p className="mt-3 text-sm leading-7 text-[#52605a]">Count your answers.</p>
            </div>
            <div className="grid gap-3">
              {[
                ['0-2 Unknown, 0 Risk Found', 'Lower concern, but still verify before purchase.'],
                [
                  '3-5 Unknown',
                  'Professional review is recommended before signing any contract.',
                ],
                [
                  '6 or more Unknown',
                  'Do not move forward yet. Too many important risks are still unchecked.',
                ],
                [
                  'Any Risk Found',
                  'Do not ignore it. Review the property with the right professionals before purchase.',
                ],
              ].map(([result, meaning]) => (
                <div
                  key={result}
                  className="rounded-[8px] border border-[#d9d2bd] bg-white p-5 shadow-sm"
                >
                  <p className="text-sm font-semibold">{result}</p>
                  <p className="mt-1 text-sm leading-6 text-[#52605a]">{meaning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#10231e] py-10 text-white md:py-12">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-[1fr_380px] md:items-start">
            <div>
              <h2 className="text-2xl font-semibold tracking-normal md:text-4xl">
                The most expensive property is the one you cannot operate.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/68 md:text-base">
                In Japan, the most expensive property is not always the most expensive one on
                paper. Before you buy, check first.
              </p>
              <div className="mt-7 rounded-[8px] border border-white/12 bg-white/[0.06] p-5">
                <h3 className="text-lg font-semibold">Already found a property in Japan?</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  Before signing any contract, send us the listing or property documents. We can
                  help you organize the key risks before purchase and clarify what should be
                  checked with the public health center, fire department, architect, construction
                  company, and operator.
                </p>
                <p className="mt-4 text-base font-semibold text-[#d8a64a]">
                  Do not buy first and check later.
                </p>
              </div>
            </div>
            <div className="rounded-[8px] border border-white/12 bg-white/[0.06] p-5">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/10 text-[#d8a64a]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-white/50">Name</dt>
                  <dd className="font-semibold">Shohei Fujita</dd>
                </div>
                <div>
                  <dt className="text-white/50">Company</dt>
                  <dd className="font-semibold">Ziyou Fudosan LLC</dd>
                </div>
                <div>
                  <dt className="text-white/50">Service</dt>
                  <dd className="leading-6">
                    Japan property search, risk checks, licensing preparation, and accommodation
                    operation setup for foreign investors
                  </dd>
                </div>
                <div>
                  <dt className="text-white/50">Contact</dt>
                  <dd className="font-semibold">
                    admin@ziyou-fudosan.com / WhatsApp +81 80 8492 7068
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
