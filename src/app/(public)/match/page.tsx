import { FunnelText } from '@/components/analytics/buyer-funnel'
import { shareMetadata } from '@/lib/site-config'
import { localeAlternates } from '@/lib/locale-url'
import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { AskUs } from '@/components/common/ask-us'
import { BuyerSearch } from '@/components/buyer/buyer-search'
import { getBuyerMatchingCopy } from '@/lib/buyer-matching-copy'
import { getBuyerJourneyCopy } from '@/lib/buyer-journey-copy'
import { isMarketCategory } from '@/lib/market-category'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = getBuyerJourneyCopy(locale)
  const matching = getBuyerMatchingCopy(locale)
  const alternates = localeAlternates('/match', locale)
  return { title: copy.matchTitle, description: matching.intro, alternates, ...shareMetadata({ title: copy.matchTitle, description: matching.intro, url: alternates.canonical, locale }) }
}

export default async function MatchPage({ searchParams }: { searchParams: Promise<{ purpose?: string }> }) {
  const copy = getBuyerJourneyCopy(await getLocale())
  const { purpose } = await searchParams
  return <main className="min-h-[70vh] bg-white py-10 text-[#1b293a] md:py-20"><div className="container max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]">WELCOME HOME TOKYO / PERSONAL SEARCH</p><h1 className="mb-8 mt-4 text-3xl font-medium tracking-tight md:text-5xl"><FunnelText field="matchTitle" baseline={copy.matchTitle} /></h1>{/* Tap-only, no sign-up request first; saving the search with an account is the optional second route. */}<AskUs variant="brief" topic={copy.matchTitle} initialPurpose={isMarketCategory(purpose) ? purpose : ''} /><div className="mt-14"><BuyerSearch initialPurpose={isMarketCategory(purpose) ? purpose : ''} /></div></div></main>
}
