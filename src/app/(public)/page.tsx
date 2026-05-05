import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileCheck,
  Flame,
  Globe,
  Hotel,
  KeyRound,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { GuideCard } from '@/components/guides/guide-card'
import { HomeSearchForm } from '@/components/listing/home-search-form'
import { ListingCard } from '@/components/listing/listing-card'
import { Button } from '@/components/ui/button'
import { getGuideArticles } from '@/content/guides'
import { getGuideUiCopy, normalizeGuideLocale } from '@/lib/guides'
import { getHospitalityHomeCopy } from '@/lib/hospitality-copy'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { createServiceClient } from '@/lib/supabase/server'
import {
  absoluteUrl,
  buildListingDescription,
  buildListingTitle,
  getPrimaryListingImage,
  getSchemaLanguage,
  getSiteCopy,
} from '@/lib/site-config'

const getLatestPublishedListings = unstable_cache(
  async () => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        propertyType,
        hospitalityCategory,
        price,
        addressPublic,
        stations,
        builtYear,
        buildingArea,
        yieldGross,
        viewCount,
        publishedAt,
        media (url, category)
      `)
      .eq('status', 'PUBLISHED')
      .eq('adAllowed', true)
      .order('publishedAt', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }

    return data || []
  },
  ['home-latest-published-listings'],
  { revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const siteCopy = getSiteCopy(locale)

  return {
    title: siteCopy.title,
    description: siteCopy.description,
    alternates: {
      canonical: absoluteUrl('/'),
    },
    openGraph: {
      title: siteCopy.title,
      description: siteCopy.description,
      url: absoluteUrl('/'),
    },
    twitter: {
      title: siteCopy.title,
      description: siteCopy.description,
    },
  }
}

export default async function HomePage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()])
  const normalizedLocale = normalizeGuideLocale(locale)
  const guideCopy = getGuideUiCopy(normalizedLocale)
  const featuredGuides = getGuideArticles(normalizedLocale).slice(0, 3)
  const viewerPromise = getOptionalPublicViewer()
  const locationIndexPromise = getPublicSearchLocationIndex()
  const listingsPromise = getLatestPublishedListings()

  const [viewer, locationIndex, listings] = await Promise.all([
    viewerPromise,
    locationIndexPromise,
    listingsPromise,
  ])

  const formattedListings = (listings || []).map((listing) => ({
    ...listing,
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
  }))

  const userId = viewer?.id ?? null
  const favoriteIds = viewer
    ? await getFavoriteIdsForViewer(
        viewer.id,
        formattedListings.map((listing) => listing.id)
      )
    : new Set<string>()
  const isLoggedIn = !!viewer
  const homeCopy = getHospitalityHomeCopy(locale)
  const proofIcons = [Hotel, ShieldCheck, Globe]
  const assetIcons = [Hotel, BedDouble, Building2, Landmark]
  const checkIcons = [MapPin, Flame, Building2, FileCheck]
  const processIcons = [Compass, ClipboardCheck, KeyRound, Sparkles]
  const heroTitleDelimiter = homeCopy.heroTitle.includes('、')
    ? '、'
    : homeCopy.heroTitle.includes('，')
      ? '，'
      : null
  const heroTitleLines = heroTitleDelimiter
    ? (() => {
        const [first, ...rest] = homeCopy.heroTitle.split(heroTitleDelimiter)
        const secondLine = rest.join(heroTitleDelimiter)
        return secondLine ? [`${first}${heroTitleDelimiter}`, secondLine] : [homeCopy.heroTitle]
      })()
    : [homeCopy.heroTitle]
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: getSiteCopy(locale).title,
    description: getSiteCopy(locale).description,
    url: absoluteUrl('/'),
    inLanguage: getSchemaLanguage(locale),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: formattedListings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/listings/${listing.id}`),
        name: buildListingTitle(listing, locale),
        image: getPrimaryListingImage(listing) || undefined,
        description: buildListingDescription(listing, locale),
      })),
    },
  }

  return (
    <div className="bg-[#f7f5ed] text-[#19231f]">
      <JsonLd data={collectionJsonLd} />

      <section className="relative overflow-hidden bg-[#10231e] text-white">
        <Image
          src="/hotel-lp/img/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(8,24,20,0.94)_0%,rgba(8,24,20,0.78)_48%,rgba(8,24,20,0.38)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(180deg,rgba(247,245,237,0)_0%,#f7f5ed_100%)]" />

        <div className="container relative py-12 md:py-16 lg:py-20">
          <div className="max-w-5xl">
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] tracking-normal md:text-6xl lg:text-7xl">
              {heroTitleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/80 md:text-lg">
              {homeCopy.heroDescription}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/listings">
                <Button
                  size="lg"
                  className="h-12 rounded-[8px] bg-[#d8a64a] px-6 text-sm font-semibold text-[#13201c] hover:bg-[#e6b65c]"
                >
                  {homeCopy.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="/hotel-lp.html#form">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-[8px] border-white/30 bg-white/[0.08] px-6 text-sm font-semibold text-white hover:bg-white/[0.16] hover:text-white"
                >
                  {homeCopy.secondaryCta}
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_0.95fr] lg:items-stretch">
            <div className="grid gap-3 sm:grid-cols-3">
              {homeCopy.proof.map((item, index) => {
                const Icon = proofIcons[index]
                return (
                  <div
                    key={item.label}
                    className="rounded-[8px] border border-white/15 bg-white/10 p-4 backdrop-blur-md"
                  >
                    <Icon className="mb-4 h-5 w-5 text-[#d8a64a]" />
                    <p className="text-sm font-semibold text-white">{item.value}</p>
                    <p className="mt-1 text-xs leading-5 text-white/65">{item.label}</p>
                  </div>
                )
              })}
            </div>

            <div className="rounded-[8px] border border-white/20 bg-[#fffdf8]/95 p-4 text-[#19231f] shadow-2xl shadow-black/30 backdrop-blur-md md:p-5">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">
                    {homeCopy.searchTitle}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-[#5f6b65]">
                    {homeCopy.searchDescription}
                  </p>
                </div>
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#2f6d58]" />
              </div>
              <HomeSearchForm compact={isLoggedIn} locationIndex={locationIndex} />
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-14 md:py-20">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
                {homeCopy.assetTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-[#5d6963]">
                {homeCopy.assetDescription}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['/hotel-lp/img/lobby.jpg', 'Hotel lobby'],
                ['/hotel-lp/img/traditional.jpg', 'Ryokan room'],
                ['/hotel-lp/img/reno-building.jpg', 'Renovation building'],
                ['/hotel-lp/img/skyline.jpg', 'Tokyo skyline'],
              ].map(([src, alt]) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-[8px]">
                  <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 1024px) 50vw, 320px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {homeCopy.assetPaths.map((asset, index) => {
              const Icon = assetIcons[index]
              return (
                <div
                  key={asset.title}
                  className="rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] p-5 shadow-sm"
                >
                  <Icon className="h-5 w-5 text-[#2f6d58]" />
                  <h3 className="mt-5 text-base font-semibold">{asset.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#647069]">{asset.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#112821] py-14 text-white md:py-20">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
                {homeCopy.reviewTitle}
              </h2>
              <p className="mt-5 text-base leading-8 text-white/70">
                {homeCopy.reviewDescription}
              </p>
              <a href="/hotel-lp.html#form" className="mt-8 inline-flex">
                <Button
                  size="lg"
                  className="h-12 rounded-[8px] bg-[#d8a64a] px-6 text-[#11231e] hover:bg-[#e6b65c]"
                >
                  {homeCopy.secondaryCta}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {homeCopy.checks.map((check, index) => {
                const Icon = checkIcons[index]
                return (
                  <div
                    key={check.title}
                    className="rounded-[8px] border border-white/10 bg-white/[0.06] p-5"
                  >
                    <Icon className="h-5 w-5 text-[#d8a64a]" />
                    <h3 className="mt-5 font-semibold">{check.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{check.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">
                {t('home.newListings')}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#647069] md:text-base">
                {t('home.newListingsDesc')}
              </p>
            </div>
            <Link href="/listings">
              <Button
                variant="outline"
                className="rounded-[8px] border-[#b7aa8d] bg-transparent text-[#1a2a24] hover:bg-[#ebe5d6]"
              >
                {t('home.viewAll')}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {formattedListings.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {formattedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.has(listing.id)}
                  userId={userId}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] p-8 text-center text-sm text-[#647069]">
              {t('home.noListings')}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-[#ded6c4] bg-[#fffdf8] py-14 md:py-20">
        <div className="container">
          <div className="mb-9 max-w-3xl">
            <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">
              {homeCopy.processTitle}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {homeCopy.process.map((item, index) => {
              const Icon = processIcons[index]
              return (
                <div key={item.step} className="rounded-[8px] border border-[#d9d2bd] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm font-semibold text-[#a17426]">{item.step}</span>
                    <Icon className="h-5 w-5 text-[#2f6d58]" />
                  </div>
                  <h3 className="mt-8 font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#647069]">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-semibold text-[#a17426]">
                {guideCopy.navLabel}
              </p>
              <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">
                {guideCopy.homeTitle}
              </h2>
              <p className="text-sm leading-relaxed text-[#647069] md:text-base">
                {guideCopy.homeDescription}
              </p>
            </div>
            <Link href="/guides">
              <Button
                variant="outline"
                className="rounded-[8px] border-[#b7aa8d] bg-transparent text-[#1a2a24] hover:bg-[#ebe5d6]"
              >
                {guideCopy.viewAllGuides}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {featuredGuides.map((article) => (
              <GuideCard
                key={article.slug}
                article={article}
                locale={normalizedLocale}
                ctaLabel={guideCopy.readArticle}
              />
            ))}
          </div>
        </div>
      </section>

      {!isLoggedIn && (
        <section className="relative overflow-hidden bg-[#10231e] py-14 text-white md:py-16">
          <Image
            src="/hotel-lp/img/cta-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-[#10231e]/85" />
          <div className="container relative">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-semibold tracking-normal md:text-4xl">
                  {t('home.ctaTitle')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-white/70 md:text-base">
                  {t('home.ctaDescription')}
                </p>
              </div>
              <Link href="/register">
                <Button
                  size="lg"
                  className="h-12 rounded-[8px] bg-[#d8a64a] px-6 text-[#13201c] hover:bg-[#e6b65c]"
                >
                  {t('home.ctaButton')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
