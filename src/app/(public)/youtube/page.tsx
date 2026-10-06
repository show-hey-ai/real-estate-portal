import { publicFreshnessFilters } from '@/lib/public-listing-scope'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  FileSearch,
  Flame,
  Hotel,
  MessageCircle,
  PlayCircle,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { ListingCard } from '@/components/listing/listing-card'
import { Button } from '@/components/ui/button'
import { createServiceClient } from '@/lib/supabase/server'
import {
  absoluteUrl,
  buildListingDescription,
  buildListingTitle,
  getPrimaryListingImage,
} from '@/lib/site-config'

const youtubeCampaignQuery = 'utm_source=youtube&utm_medium=video&utm_campaign=portal_entry'
const listingsHref = `/listings?${youtubeCampaignQuery}`
const checklistHref = `/hotel-airbnb-checklist?${youtubeCampaignQuery}`
const whatsappHref = `https://wa.me/818084927068?text=${encodeURIComponent(
  'I watched your YouTube video. I am looking for a hospitality property in Japan. My target area / budget / property type is:'
)}`

export const dynamic = 'force-dynamic'

const entrySteps = [
  {
    title: 'Browse current public candidates',
    desc: 'Start with listed hotels, ryokan, minpaku-ready buildings, conversion candidates, and hospitality land.',
    icon: Search,
  },
  {
    title: 'Send your target criteria',
    desc: 'Tell us your budget, area, preferred asset type, and whether you want operation support after closing.',
    icon: MessageCircle,
  },
  {
    title: 'Check risk before offering',
    desc: 'Use zoning, fire code, building-code, hokenjo, and renovation risk checks before signing.',
    icon: ShieldCheck,
  },
]

const riskChecks = [
  ['Legal route', 'Hotel / ryokan license, simple lodging, minpaku, or another structure.'],
  ['Fire code', 'Equipment, egress, alarms, emergency lighting, and retrofit cost signals.'],
  ['Building code', 'Use change, inspection certificate, stairs, exits, structure, and road access.'],
  ['Operation fit', 'Cleaning, check-in, local response, garbage, linen, guest flow, and remote operation.'],
]

const getYoutubeLandingListings = unstable_cache(
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
        viewCount,
        publishedAt,
        media (url, category, isAdopted)
      `)
      .eq('status', 'PUBLISHED')
      .eq('adAllowed', true)
    .eq('adConsentRequired', false)
    .or(publicFreshnessFilters()[0])
    .or(publicFreshnessFilters()[1])
      .order('publishedAt', { ascending: false })
      .limit(3)

    if (error) {
      console.error('Error fetching YouTube landing listings:', error)
      return []
    }

    return data || []
  },
  ['youtube-landing-listings'],
  { revalidate: 300 }
)

export const metadata: Metadata = {
  title: 'Japan Hospitality Property Portal for YouTube Viewers',
  description:
    'Start here after watching Ziyou Hospitality on YouTube: browse Japan hospitality property candidates, send target criteria, and request pre-purchase risk checks.',
  alternates: {
    canonical: absoluteUrl('/youtube'),
  },
  openGraph: {
    title: 'Japan Hospitality Property Portal for YouTube Viewers',
    description:
      'Browse Japan hospitality property candidates and check licensing, fire, building, and operation risks before purchase.',
    url: absoluteUrl('/youtube'),
    type: 'website',
  },
}

export default async function YoutubeLandingPage() {
  const listings = await getYoutubeLandingListings()
  const formattedListings = (listings || []).map((listing) => ({
    ...listing,
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    media: (listing.media || []).filter((image) => image.isAdopted === true).map((image) => ({
      url: image.url,
      category: image.category || 'OTHER',
    })),
  }))

  const landingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Japan Hospitality Property Portal for YouTube Viewers',
    description:
      'A YouTube viewer entry point for foreign investors looking for hotel, ryokan, minpaku-ready, and hospitality conversion property in Japan.',
    url: absoluteUrl('/youtube'),
    inLanguage: 'en',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: formattedListings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/listings/${listing.id}`),
        name: buildListingTitle(listing, 'en'),
        image: getPrimaryListingImage(listing) || undefined,
        description: buildListingDescription(listing, 'en'),
      })),
    },
  }

  return (
    <div className="bg-[#f7f5ed] text-[#18231f]">
      <JsonLd data={landingJsonLd} />

      <section className="relative overflow-hidden bg-[#10231e] text-white">
        <Image
          src="/hotel-lp/img/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-42"
        />
        <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(6,22,18,0.96)_0%,rgba(6,22,18,0.82)_52%,rgba(6,22,18,0.42)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,rgba(247,245,237,0)_0%,#f7f5ed_100%)]" />

        <div className="container relative py-12 md:py-16 lg:py-20">
          <div className="max-w-5xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-[#d8a64a] backdrop-blur">
              <PlayCircle className="h-4 w-4" />
              YouTube viewer entry
            </div>
            <h1 className="max-w-5xl text-4xl font-semibold leading-[1.04] tracking-normal md:text-6xl lg:text-7xl">
              Looking for hotel or Airbnb property in Japan?
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-white/80 md:text-lg">
              Start here after watching the video. Browse real hospitality property candidates,
              then send your target criteria so we can check purchase, licensing, fire, building,
              and opening risks before you commit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={listingsHref}>
                <Button
                  size="lg"
                  className="h-12 rounded-[8px] bg-[#d8a64a] px-6 text-sm font-semibold text-[#13201c] hover:bg-[#e6b65c]"
                >
                  Browse hospitality assets
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href={whatsappHref} target="_blank" rel="noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-[8px] border-white/30 bg-white/[0.08] px-6 text-sm font-semibold text-white hover:bg-white/[0.16] hover:text-white"
                >
                  Send target criteria
                </Button>
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-3 md:grid-cols-3">
            {entrySteps.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-[8px] border border-white/15 bg-white/10 p-5 backdrop-blur-md"
                >
                  <Icon className="h-5 w-5 text-[#d8a64a]" />
                  <h2 className="mt-5 text-base font-semibold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/66">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-[#a17426]">Current candidates</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal md:text-4xl">
                Start with live, ad-approved hospitality listings
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#647069] md:text-base">
                These are public candidates. If your budget, area, or asset type is different,
                send the criteria and ask for public plus off-market introductions.
              </p>
            </div>
            <Link href={listingsHref}>
              <Button
                variant="outline"
                className="rounded-[8px] border-[#b7aa8d] bg-transparent text-[#1a2a24] hover:bg-[#ebe5d6]"
              >
                View all listings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {formattedListings.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {formattedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  showFavoriteButton={false}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] p-8 text-center text-sm text-[#647069]">
              Public listings are being updated. Send your target criteria for matching candidates.
            </div>
          )}
        </div>
      </section>

      <section className="bg-[#112821] py-12 text-white md:py-16">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-[8px] bg-white/10 text-[#d8a64a]">
                <FileSearch className="h-6 w-6" />
              </div>
              <h2 className="text-3xl font-semibold leading-tight tracking-normal md:text-5xl">
                The portal is the next step after the video.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/70">
                YouTube explains the risk. This portal shows the actual candidates and gives you a
                practical way to ask for a purchase review before signing.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={whatsappHref} target="_blank" rel="noreferrer">
                  <Button
                    size="lg"
                    className="h-12 rounded-[8px] bg-[#d8a64a] px-6 text-[#11231e] hover:bg-[#e6b65c]"
                  >
                    Send criteria on WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Link href={checklistHref}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-[8px] border-white/30 bg-white/[0.08] px-6 text-sm font-semibold text-white hover:bg-white/[0.16] hover:text-white"
                  >
                    Open risk checklist
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {riskChecks.map(([title, desc], index) => {
                const icons = [Hotel, Flame, Building2, ClipboardCheck]
                const Icon = icons[index]
                return (
                  <div
                    key={title}
                    className="rounded-[8px] border border-white/10 bg-white/[0.06] p-5"
                  >
                    <Icon className="h-5 w-5 text-[#d8a64a]" />
                    <h3 className="mt-5 font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/65">{desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12 md:py-16">
        <div className="container">
          <div className="grid gap-8 rounded-[8px] border border-[#d9d2bd] bg-[#fffdf8] p-6 shadow-sm md:grid-cols-[1fr_auto] md:items-center md:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-[#a17426]">Use this link in every video</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal md:text-4xl">
                portal.ziyou-fudosan.com/youtube
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#647069] md:text-base">
                Put this page in YouTube descriptions, pinned comments, LinkedIn reposts, and
                short-form video captions. UTM-tagged visits are tracked in admin analytics.
              </p>
            </div>
            <Link href={listingsHref}>
              <Button
                size="lg"
                className="h-12 rounded-[8px] bg-[#2f6d58] px-6 text-sm font-semibold text-white hover:bg-[#265746]"
              >
                Go to listings
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
