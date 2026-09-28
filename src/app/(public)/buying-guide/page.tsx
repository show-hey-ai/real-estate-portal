import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { getBuyerJourneyCopy } from '@/lib/buyer-journey-copy'
import { absoluteUrl } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const copy = getBuyerJourneyCopy(await getLocale())
  return { title: copy.guideTitle, description: copy.guideIntro, alternates: { canonical: absoluteUrl('/buying-guide') } }
}

export default async function BuyingGuidePage() {
  const copy = getBuyerJourneyCopy(await getLocale())
  return <main className="min-h-[70vh] bg-white py-16 text-[#1b293a] md:py-20"><div className="container max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]">ZIYOU / BUYER GUIDE</p><h1 className="mt-6 text-4xl font-medium tracking-tight md:text-5xl">{copy.guideTitle}</h1><p className="mt-5 max-w-3xl leading-8 text-[#657487]">{copy.guideIntro}</p><div className="mt-12 grid border-t border-[#cbd5df] md:grid-cols-2">{copy.guideSteps.map(([title, description], index) => <section key={title} className={`border-b border-[#cbd5df] py-8 md:pr-10 ${index % 2 ? 'md:border-l md:pl-10' : ''}`}><h2 className="text-xl font-medium">{title}</h2><p className="mt-3 leading-7 text-[#657487]">{description}</p></section>)}</div><Link href="/match" className="mt-10 inline-flex items-center gap-2 rounded-[4px] bg-[#274d7d] px-6 py-3 font-semibold text-white hover:bg-[#18375f]">{copy.matchTitle}<ArrowRight className="h-4 w-4" /></Link></div></main>
}
