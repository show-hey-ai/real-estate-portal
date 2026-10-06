import { FunnelText } from '@/components/analytics/buyer-funnel'
import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, ClipboardList, FileSignature, Scale, Search } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { MarketShortcuts } from '@/components/listing/market-shortcuts'
import { WardMap } from '@/components/listing/ward-map'
import { countByWard } from '@/lib/ward-tile-map'
import { getMarketplaceCopy } from '@/lib/marketplace-copy'
import { HomeSearchForm } from '@/components/listing/home-search-form'
import { ListingCard } from '@/components/listing/listing-card'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { getPortalHomeCopy } from '@/lib/portal-copy'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import { createServiceClient } from '@/lib/supabase/server'
import { absoluteUrl, getSchemaLanguage, getSiteCopy } from '@/lib/site-config'

export const dynamic = 'force-dynamic'

const stepVisuals = [
  { Icon: ClipboardList, tone: 'bg-[#e8f1fb] text-[#274d7d]' },
  { Icon: Scale, tone: 'bg-[#edf3e7] text-[#557447]' },
  { Icon: FileSignature, tone: 'bg-[#fcece8] text-[#aa5746]' },
] as const

async function getLatestListings() {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('id, propertyType, price, addressPublic, stations, builtYear, buildingArea, landArea, zoning, currentStatus, yieldGross, viewCount, publishedAt, media (url, category, isAdopted)')
    .eq('status', 'PUBLISHED').eq('adAllowed', true)
    .eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0])
    .or(publicFreshnessFilters()[1])
    .order('publishedAt', { ascending: false }).limit(6)
  if (error) { console.error('Failed to load homes:', error); return [] }
  return data || []
}

async function getWardCounts() {
  const { data, error } = await createServiceClient()
    .from('listings')
    .select('city')
    .eq('status', 'PUBLISHED').eq('adAllowed', true)
    .eq('adConsentRequired', false)
    .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
    .is('hospitalityCategory', null)
    .or(publicFreshnessFilters()[0])
    .or(publicFreshnessFilters()[1])
  if (error) { console.error('Failed to count listings by ward:', error); return {} }
  return countByWard(data || [])
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
  const market = getMarketplaceCopy(locale)
  const [homes, viewer, locationIndex, wardCounts] = await Promise.all([
    getLatestListings(), getOptionalPublicViewer(), getPublicSearchLocationIndex(), getWardCounts(),
  ])
  const listings = homes.map((home) => ({ ...home,
    price: home.price ? BigInt(home.price) : null,
    buildingArea: home.buildingArea ? Number(home.buildingArea) : null,
    landArea: home.landArea ? Number(home.landArea) : null,
    yieldGross: home.yieldGross ? Number(home.yieldGross) : null,
    media: (home.media || []).filter((item) => item.isAdopted),
  }))
  const favorites = viewer
    ? await getFavoriteIdsForViewer(viewer.id, listings.map((home) => home.id))
    : new Set<string>()


  return <div className="bg-white text-[#1b293a]">
    <JsonLd data={{ '@context': 'https://schema.org', '@type': 'WebPage',
      name: getSiteCopy(locale).title, description: getSiteCopy(locale).description,
      url: absoluteUrl('/'), inLanguage: getSchemaLanguage(locale) }} />
    <div className="container pb-14 pt-6 md:pt-8">
      <section className="relative overflow-hidden rounded-2xl bg-[#edf3f9]">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
            <p className="text-xs font-semibold tracking-wider text-[#57769b]">{copy.eyebrow}</p>
            <h1 className="mt-3 max-w-xl text-balance text-2xl font-semibold leading-snug tracking-tight md:text-4xl">{market.personalTitle}</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#536274]">{market.personalDescription}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link href="/match" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#274d7d] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#18375f]"><FunnelText field="matchCta" baseline={copy.matchCta} /><ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
              <Link href="/listings" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#274d7d]">{copy.browse}<ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
            </div>
          </div>
          <div className="relative hidden min-h-[280px] bg-[#e8eef3] md:block">
            <Image src="/tokyo-homes-editorial.webp" alt="" fill priority sizes="(max-width: 768px) 0px, 45vw" className="object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#edf3f9] via-transparent to-transparent" />
            <span className="absolute bottom-4 right-5 rounded-full bg-white/85 px-3 py-1 text-[10px] text-[#647487]">{copy.imageNote}</span>
          </div>
        </div>
      </section>

      <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs text-[#657487]">{copy.trust.map((item) => <span key={item} className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="h-3.5 w-3.5 text-[#57769b]" />{item}</span>)}</div>
      <div className="mt-8 md:mt-10"><MarketShortcuts locale={locale} wards={locationIndex.wards} showAreas={false} /></div>
      <div className="mt-9"><WardMap locale={locale} counts={wardCounts} /></div>

      <section data-testid="home-search-panel" className="mt-8 rounded-xl border border-[#dbe2e9] bg-[#f8fafc] px-4 md:px-5">
        <details className="group">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold [&::-webkit-details-marker]:hidden"><span className="flex items-center gap-2"><Search aria-hidden="true" className="h-4 w-4 text-[#57769b]" />{market.filterDetails}</span><ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" /></summary>
          <div className="pb-5"><HomeSearchForm locationIndex={locationIndex} /></div>
        </details>
      </section>

      <section className="mt-10 md:mt-12">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div><h2 className="text-xl font-semibold md:text-2xl">{copy.availableTitle}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#657487]">{copy.availableDescription}</p></div>
          <Link href="/listings" className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-[#274d7d]">{market.all}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        </div>
        {listings.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((listing) => <ListingCard key={listing.id} listing={listing} isFavorite={favorites.has(listing.id)} userId={viewer?.id ?? null} />)}</div> :
          <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-6 md:p-8"><h3 className="text-lg font-semibold">{copy.emptyTitle}</h3><p className="mt-2 max-w-2xl text-sm leading-7 text-[#657487]">{copy.emptyDescription}</p><Link href="/match" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#274d7d]"><FunnelText field="consult" baseline={copy.consult} /><ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>}
      </section>

      <section className="mt-12 grid gap-4 border-t border-[#e5eaf0] pt-8 md:grid-cols-2">
        <div className="rounded-xl bg-[#edf3f9] p-6"><h2 className="text-lg font-semibold">{copy.matchTitle}</h2><p className="mt-3 text-sm leading-7 text-[#536274]">{copy.matchDescription}</p><Link href="/match" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#274d7d]"><FunnelText field="matchCta" baseline={copy.matchCta} /><ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
        <div className="rounded-xl border border-[#dbe2e9] p-6"><h2 className="text-lg font-semibold">{copy.guideTitle}</h2><p className="mt-3 text-sm leading-7 text-[#536274]">{copy.guideDescription}</p><Link href="/buying-guide" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#274d7d]">{copy.guideCta}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>
      </section>
      <section className="mt-12" aria-labelledby="home-steps-title">
        <h2 id="home-steps-title" className="text-xl font-semibold">{copy.stepsTitle}</h2>
        <ol className="mt-5 grid gap-3 md:grid-cols-3 md:gap-0">
          {copy.steps.map(([number, title, description], index) => {
            const { Icon, tone } = stepVisuals[index % stepVisuals.length]
            return <li key={number} className="relative flex gap-4 rounded-xl border border-[#dbe2e9] bg-white p-5 md:mx-3 md:flex-col md:items-center md:text-center">
              <span className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl md:h-20 md:w-20 ${tone}`}>
                <Icon aria-hidden="true" strokeWidth={1.6} className="h-7 w-7 md:h-9 md:w-9" />
                <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#274d7d] text-[11px] font-bold text-white">{index + 1}</span>
              </span>
              <div><h3 className="font-semibold md:mt-1">{title}</h3><p className="mt-1.5 text-sm leading-6 text-[#657487]">{description}</p></div>
              {index < copy.steps.length - 1 && <ArrowRight aria-hidden="true" className="absolute -right-5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-[#9fb3c8] md:block" />}
            </li>
          })}
        </ol>
      </section>
    </div>
  </div>
}
