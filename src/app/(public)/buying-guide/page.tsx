import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/locale-url'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { BuyingGuideFlow } from '@/components/buyer/buying-guide-flow'
import { getBuyerJourneyCopy } from '@/lib/buyer-journey-copy'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = getBuyerJourneyCopy(locale)
  return { title: copy.guideTitle, description: copy.guideIntro, alternates: localeAlternates('/buying-guide', locale) }
}

export default async function BuyingGuidePage() {
  const copy = getBuyerJourneyCopy(await getLocale())
  return (
    <main className="min-h-[70vh] bg-white py-12 text-[#1b293a] md:py-16">
      <div className="container max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]">ZIYOU / BUYER GUIDE</p>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">{copy.guideTitle}</h1>
        <p className="mt-5 max-w-3xl leading-8 text-[#657487]">{copy.guideIntro}</p>
        <div className="mt-10 rounded-3xl bg-[#f4f7fa] p-5 sm:p-8">
          <BuyingGuideFlow steps={copy.guideSteps} label={copy.guideTitle} />
        </div>
        <Link href="/match" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#274d7d] px-6 py-3 font-semibold text-white hover:bg-[#18375f] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#274d7d]">{copy.matchTitle}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </main>
  )
}
