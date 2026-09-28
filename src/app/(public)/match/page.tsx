import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { BuyerBrief } from '@/components/buyer/buyer-brief'
import { getBuyerJourneyCopy } from '@/lib/buyer-journey-copy'
import { absoluteUrl } from '@/lib/site-config'
import { isMarketCategory } from '@/lib/market-category'

export async function generateMetadata(): Promise<Metadata> {
  const copy = getBuyerJourneyCopy(await getLocale())
  return { title: copy.matchTitle, description: copy.matchIntro, alternates: { canonical: absoluteUrl('/match') } }
}

export default async function MatchPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const copy = getBuyerJourneyCopy(await getLocale())
  const { purpose } = await searchParams
  return <main className="min-h-[70vh] bg-white py-16 text-[#1b293a] md:py-20"><div className="container max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]">ZIYOU / PERSONAL SEARCH</p><h1 className="mt-6 text-4xl font-medium tracking-tight md:text-5xl">{copy.matchTitle}</h1><p className="mb-10 mt-5 max-w-2xl leading-8 text-[#657487]">{copy.matchIntro}</p><BuyerBrief initialPurpose={isMarketCategory(purpose) ? purpose : ''} /></div></main>
}
