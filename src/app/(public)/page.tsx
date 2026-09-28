import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { HomeSearchForm } from '@/components/listing/home-search-form'
import { ListingCard } from '@/components/listing/listing-card'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { getPortalHomeCopy } from '@/lib/portal-copy'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl, getSchemaLanguage, getSiteCopy } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

async function getLatestListings() {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('id, propertyType, price, addressPublic, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, viewCount, publishedAt, media (url, category)')
    .eq('status', 'PUBLISHED').eq('adAllowed', true)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .order('publishedAt', { ascending: false }).limit(6)
  if (error) { console.error('Failed to load homes:', error); return [] }
  return data || []
}

export async function generateMetadata(): Promise<Metadata> {
  const copy = getSiteCopy(await getLocale())
  return { title: { absolute: copy.title }, description: copy.description,
    alternates: { canonical: absoluteUrl('/') },
    openGraph: { title: copy.title, description: copy.description, url: absoluteUrl('/') } }
}

export default async function HomePage() {
  const locale = await getLocale()
  const copy = getPortalHomeCopy(locale)
  const [homes, viewer, locationIndex] = await Promise.all([
    getLatestListings(), getOptionalPublicViewer(), getPublicSearchLocationIndex(),
  ])
  const listings = homes.map((home) => ({ ...home,
    price: home.price ? BigInt(home.price) : null,
    buildingArea: home.buildingArea ? Number(home.buildingArea) : null,
    landArea: home.landArea ? Number(home.landArea) : null,
    yieldGross: home.yieldGross ? Number(home.yieldGross) : null,
    media: home.media || [],
  }))
  const favorites = viewer
    ? await getFavoriteIdsForViewer(viewer.id, listings.map((home) => home.id))
    : new Set<string>()

  return <main className="bg-white text-[#1b293a]">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage',
      name: getSiteCopy(locale).title, description: getSiteCopy(locale).description,
      url: absoluteUrl('/'), inLanguage: getSchemaLanguage(locale) }} />
    <section className="container grid gap-10 pb-10 pt-12 md:gap-12 md:pb-16 md:pt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
      <div className="relative z-10 max-w-[620px]">
        <p className="flex items-center gap-3 text-xs font-bold tracking-[0.2em] text-[#3f638d] uppercase"><span className="h-px w-7 bg-current" />{copy.eyebrow}</p>
        <h1 className={`mt-8 font-medium leading-[1.18] tracking-[-0.055em] text-[#142337] ${locale === 'en' ? 'text-[clamp(2.8rem,5vw,5.4rem)]' : 'text-[clamp(2.6rem,3.5vw,4rem)]'}`}>{copy.heroTitle}</h1>
        <p className="mt-7 max-w-[540px] text-base leading-8 text-[#536274] md:text-lg">{copy.heroDescription}</p>
        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
          <Link href="/listings" className="inline-flex min-h-12 items-center gap-3 rounded-[4px] bg-[#274d7d] px-6 font-semibold text-white transition-colors hover:bg-[#18375f]">{copy.browse}<ArrowUpRight className="h-4 w-4" /></Link>
          <Link href="/match" className="inline-flex min-h-12 items-center gap-2 border-b border-[#8998a8] font-semibold text-[#274d7d] transition-colors hover:border-[#274d7d]">{copy.consult}<ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
      <div className="relative min-h-[330px] overflow-hidden bg-[#e8eef3] sm:min-h-[440px] lg:min-h-[590px]">
        <Image src="/tokyo-homes-editorial.webp" alt="" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover object-center" />
        <div className="absolute bottom-0 left-0 flex w-full items-end justify-between gap-3 bg-gradient-to-t from-[#10233d]/80 via-[#10233d]/25 to-transparent px-6 pb-6 pt-24 text-white md:px-8 md:pb-8">
          <span className="text-xs font-semibold tracking-[0.16em] uppercase">TOKYO / PROPERTY</span>
          <span className="text-xs font-medium">{copy.imageNote}</span>
        </div>
      </div>
    </section>
    <div className="border-y border-[#e1e6ec] bg-[#f7f9fb]"><div className="container grid gap-4 py-6 md:grid-cols-3 md:gap-0">{copy.trust.map((item, index) => <div key={item} className={`flex items-center gap-4 text-sm font-medium text-[#40546a] ${index > 0 ? 'md:border-l md:border-[#d8e0e8] md:pl-8' : ''}`}><span className="text-xs font-bold tracking-[0.14em] text-[#6382a6]">0{index + 1}</span>{item}</div>)}</div></div>
    <section className="container py-16 md:py-20"><p className="text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">CATEGORIES</p><h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{copy.categoryTitle}</h2><div className="mt-8 grid border-t border-[#cbd5df] md:grid-cols-3">{copy.categories.map(([value, title, description], index) => <Link key={value} href={`/listings?category=${value}`} className={`group flex min-h-52 flex-col border-b border-[#cbd5df] py-7 transition-colors hover:bg-[#f5f7f9] md:border-b-0 md:border-r md:px-7 md:first:pl-0 md:last:border-r-0 ${index === 2 ? 'md:border-r-0' : ''}`}><span className="text-xs font-semibold text-[#5a7da3]">0{index + 1}</span><span className="mt-7 flex items-center justify-between text-2xl font-medium text-[#142337]">{title}<ArrowUpRight className="h-5 w-5 text-[#57769b] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></span><span className="mt-3 text-sm leading-7 text-[#657487]">{description}</span></Link>)}</div></section>
    <section data-testid="home-search-panel" className="container py-16 md:py-20">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">SEARCH</p><h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{copy.searchTitle}</h2></div><p className="max-w-md text-sm leading-7 text-[#657487]">{copy.searchDescription}</p></div>
      <div className="border-t-2 border-[#274d7d] pt-6"><HomeSearchForm locationIndex={locationIndex} /></div>
    </section>
    <section className="bg-[#f5f7f9] py-16 md:py-20"><div className="container">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">PROPERTIES</p><h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{copy.availableTitle}</h2><p className="mt-4 max-w-2xl leading-7 text-[#657487]">{copy.availableDescription}</p></div><Link href="/listings" className="inline-flex items-center gap-2 border-b border-[#274d7d] pb-1 font-semibold text-[#274d7d]">{copy.browse}<ArrowUpRight className="h-4 w-4" /></Link></div>
      {listings.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{listings.map((listing, index) => <ListingCard key={listing.id} listing={listing} isFavorite={favorites.has(listing.id)} userId={viewer?.id ?? null} imagePriority={index === 0} />)}</div> :
        <div className="grid gap-6 border-y border-[#dbe2e9] py-10 md:grid-cols-[1fr_auto] md:items-center md:py-14"><div><h3 className="text-2xl font-medium tracking-tight">{copy.emptyTitle}</h3><p className="mt-3 max-w-2xl leading-7 text-[#657487]">{copy.emptyDescription}</p></div><Link href="/match" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[4px] bg-[#274d7d] px-6 font-semibold text-white hover:bg-[#18375f]">{copy.consult}<ArrowRight className="h-4 w-4" /></Link></div>}
    </div></section>
    <section className="container py-16 md:py-24"><p className="text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">YOUR JOURNEY</p><h2 className="mt-3 text-3xl font-medium tracking-tight md:text-4xl">{copy.stepsTitle}</h2><div className="mt-10 grid gap-0 border-t border-[#cbd5df] md:grid-cols-3">{copy.steps.map(([number, title, description]) => <div key={number} className="border-b border-[#cbd5df] py-7 md:min-h-52 md:border-b-0 md:border-r md:px-8 md:first:pl-0 md:last:border-r-0"><span className="text-sm font-semibold text-[#5a7da3]">{number} / 03</span><h3 className="mt-6 text-xl font-medium">{title}</h3><p className="mt-3 leading-7 text-[#657487]">{description}</p></div>)}</div></section>
    <section className="bg-[#e9f0f7] py-16 md:py-20"><div className="container grid gap-12 md:grid-cols-2 md:gap-20"><div><p className="text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">PERSONAL SEARCH</p><h2 className="mt-4 text-3xl font-medium leading-snug tracking-tight">{copy.matchTitle}</h2><p className="mt-5 leading-7 text-[#536274]">{copy.matchDescription}</p><Link href="/match" className="mt-8 inline-flex items-center gap-2 border-b border-[#274d7d] pb-1 font-semibold text-[#274d7d]">{copy.matchCta}<ArrowUpRight className="h-4 w-4" /></Link></div><div className="border-t border-[#cbd7e3] pt-8 md:border-l md:border-t-0 md:pl-16 md:pt-0"><p className="text-xs font-bold tracking-[0.18em] text-[#57769b] uppercase">BUYER GUIDE</p><h2 className="mt-4 text-3xl font-medium leading-snug tracking-tight">{copy.guideTitle}</h2><p className="mt-5 leading-7 text-[#536274]">{copy.guideDescription}</p><Link href="/buying-guide" className="mt-8 inline-flex items-center gap-2 border-b border-[#274d7d] pb-1 font-semibold text-[#274d7d]">{copy.guideCta}<ArrowUpRight className="h-4 w-4" /></Link></div></div></section>
  </main>
}
