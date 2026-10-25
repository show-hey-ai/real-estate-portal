import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ArrowRight, MapPin, TrainFront } from 'lucide-react'
import { AskUs } from '@/components/common/ask-us'
import { JsonLd } from '@/components/common/json-ld'
import { ListingCard } from '@/components/listing/listing-card'
import { withCardFacts } from '@/lib/card-facts'
import { pickCoverImage } from '@/lib/cover-image'
import { countedTitle } from '@/lib/home-snippet'
import { localeAlternates, localizedPath } from '@/lib/locale-url'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { absoluteUrl, getSchemaLanguage, shareMetadata } from '@/lib/site-config'
import { STATIONS, lineNeighbours, linesOfStation, listingStations, stationFromSlug } from '@/lib/transit'
import { getTransitPageCopy, stationHeading } from '@/lib/transit/page-copy'
import { getPublicCardRows, toCardListing } from '@/lib/transit/public-listings'
import { lineLabel, stationLabel, stationListingCounts } from '@/lib/transit/search'
import { WARD_LAND_PRICE, WARD_SLUGS, wardLabel } from '@/lib/ward-tile-map'
import { directHubs, stationMarket } from '@/lib/transit/station-facts'
import { StationFaq, StationMarketFacts, stationFaq } from '@/components/transit/station-facts'

export const dynamic = 'force-dynamic'

/** One station: its lines, neighbouring stations and ward, and the listings near it by walking time. */

type Props = { params: Promise<{ slug: string }> }

async function stationListings(name: string) {
  const rows = await getPublicCardRows()
  const walkOf = (row: (typeof rows)[number]) => listingStations(row.stations).find(({ station }) => station === name)
  const near = rows
    .flatMap((row) => {
      const match = walkOf(row)
      return match ? [{ row, walk: match.walkMinutes ?? Number.POSITIVE_INFINITY }] : []
    })
    .sort((left, right) => left.walk - right.walk)
    .map(({ row }) => row)
  return { rows: near, counts: stationListingCounts(rows) }
}

function heading(name: string, locale: string) {
  return stationHeading(name, stationLabel(name, 'en'), locale)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const name = stationFromSlug(slug)
  if (!name) return { robots: { index: false, follow: false } }
  const locale = await getLocale()
  const copy = getTransitPageCopy(locale)
  const station = heading(name, locale)
  const { rows } = await stationListings(name)
  const title = countedTitle(copy.stationTitle(station), rows.length, locale)
  const description = copy.stationDescription(station, wardLabel(STATIONS[name].ward, locale), rows.length)
  const alternates = localeAlternates(`/stations/${slug}`, locale)
  const cover = rows.map((row) => pickCoverImage((row.media || []).filter((item) => item.isAdopted))).find(Boolean)
  // Stations with no listings stay reachable but are not offered to search engines as thin pages.
  return { title, description, alternates, ...shareMetadata({ title, description, url: alternates.canonical, locale, image: cover?.url }), robots: rows.length ? { index: true, follow: true } : { index: false, follow: true } }
}

export default async function StationPage({ params }: Props) {
  const { slug } = await params
  const name = stationFromSlug(slug)
  if (!name) notFound()
  const locale = await getLocale()
  const copy = getTransitPageCopy(locale)
  const facts = STATIONS[name]
  const station = heading(name, locale)
  const ward = wardLabel(facts.ward, locale)
  const [{ rows, counts }, viewer] = await Promise.all([stationListings(name), getOptionalPublicViewer()])
  const listings = rows.map(toCardListing)
  const favorites = viewer ? await getFavoriteIdsForViewer(viewer.id, listings.map((home) => home.id)) : new Set<string>()
  const lines = linesOfStation(name)
  const nearby = [...new Set(lines.flatMap((line) => lineNeighbours(line, name)))].filter((other) => (counts.get(other) ?? 0) > 0)
  const stationLink = (other: string) => (counts.get(other) ?? 0) > 0
    ? <Link key={other} href={`/stations/${STATIONS[other].slug}`} className="font-semibold text-[#274d7d] hover:underline">{stationLabel(other, locale)}</Link>
    : <span key={other} className="text-[#657487]">{stationLabel(other, locale)}</span>
  const pageUrl = localeAlternates(`/stations/${slug}`, locale).canonical
  const market = stationMarket(rows, name)
  const hubs = directHubs(name)
  const faq = stationFaq({ locale, station, market, hubs })
  const faqJsonLd = { '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: getSchemaLanguage(locale), mainEntity: faq.map((item) => ({ '@type': 'Question', name: item.question, acceptedAnswer: { '@type': 'Answer', text: item.answer } })) }
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.stationTitle(station),
    url: pageUrl,
    inLanguage: getSchemaLanguage(locale),
    about: { '@type': 'TrainStation', name: station, geo: { '@type': 'GeoCoordinates', latitude: facts.lat, longitude: facts.lng }, address: { '@type': 'PostalAddress', addressLocality: facts.ward, addressRegion: '東京都', addressCountry: 'JP' } },
    mainEntity: { '@type': 'ItemList', numberOfItems: listings.length, itemListElement: listings.map((home, index) => ({ '@type': 'ListItem', position: index + 1, url: absoluteUrl(localizedPath(`/listings/${home.id}`, locale)) })) },
  }
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: copy.home, item: absoluteUrl(localizedPath('/', locale)) },
    { '@type': 'ListItem', position: 2, name: copy.hub, item: absoluteUrl(localizedPath('/lines', locale)) },
    { '@type': 'ListItem', position: 3, name: station, item: pageUrl },
  ] }

  return <div className="bg-white text-[#1b293a]" data-testid="station-page">
    <JsonLd data={structured} />
    <JsonLd data={breadcrumb} />
    <JsonLd data={faqJsonLd} />
    <div className="container pb-14 pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#536274]"><Link href="/" className="hover:underline">{copy.home}</Link> / <Link href="/lines" className="hover:underline">{copy.hub}</Link> / <span>{station}</span></nav>
      <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold md:text-3xl"><TrainFront aria-hidden="true" className="h-6 w-6 shrink-0 text-[#274d7d]" />{copy.stationTitle(station)}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536274]">{rows.length ? copy.stationIntro(station, ward, rows.length) : copy.stationEmpty(station)}</p>

      <dl className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4">
          <dt className="text-xs font-semibold text-[#4a6789]">{copy.area}</dt>
          <dd className="mt-1"><Link href={`/areas/${WARD_SLUGS[facts.ward]}`} className="inline-flex items-center gap-1 text-lg font-bold text-[#274d7d] hover:underline"><MapPin aria-hidden="true" className="h-4 w-4" />{ward}</Link>
            {WARD_LAND_PRICE.yenPerSqm[facts.ward] && <p className="mt-1 text-xs text-[#657487]">{copy.landPrice(WARD_LAND_PRICE.yenPerSqm[facts.ward].toLocaleString('en-US'))}</p>}</dd>
        </div>
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4">
          <dt className="text-xs font-semibold text-[#4a6789]">{copy.lines}</dt>
          <dd className="mt-2 flex flex-wrap gap-2">{lines.map((line) => <Link key={line.id} href={`/lines/${line.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold ring-1 ring-[#dbe2e9] hover:bg-[#f3f6f9]"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />{lineLabel(line, locale)}</Link>)}</dd>
        </div>
        <div className="rounded-xl border border-[#dbe2e9] bg-[#f8fafc] p-4">
          <dt className="text-xs font-semibold text-[#4a6789]">{copy.neighbours}</dt>
          <dd className="mt-2 space-y-1.5 text-sm">{lines.map((line) => <p key={line.id} className="flex flex-wrap items-center gap-x-2 gap-y-1"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} /><span className="text-xs text-[#536274]">{lineLabel(line, locale)}</span>{lineNeighbours(line, name).map((other, index) => <span key={other} className="inline-flex items-center gap-2">{index > 0 && <span aria-hidden="true" className="text-[#a9b3bd]">·</span>}{stationLink(other)}</span>)}</p>)}</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href={`/lines?stations=${slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#274d7d] px-4 text-sm font-semibold text-white hover:bg-[#18375f]">{copy.walkFilter}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        <Link href={`/listings?stations=${slug}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[#cfd9e3] px-4 text-sm font-semibold text-[#274d7d] hover:bg-[#f3f6f9]">{copy.search}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>

      {market && <StationMarketFacts locale={locale} station={station} market={market} hubs={hubs} />}

      {listings.length > 0 && <section className="mt-10" aria-labelledby="station-listings-title">
        <h2 id="station-listings-title" className="text-xl font-semibold">{copy.stationListings}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((home) => <ListingCard key={home.id} listing={withCardFacts(home)} isFavorite={favorites.has(home.id)} userId={viewer?.id ?? null} />)}</div>
      </section>}

      {nearby.length > 0 && <section className="mt-10" aria-labelledby="station-nearby-title">
        <h2 id="station-nearby-title" className="text-lg font-semibold">{copy.nearby}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">{nearby.map((other) => <li key={other}><Link href={`/stations/${STATIONS[other].slug}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#cfd9e3] bg-white px-3 text-sm font-semibold text-[#274d7d] hover:bg-[#f3f6f9]">{stationLabel(other, locale)}<span className="text-xs font-normal text-[#657487]">{counts.get(other)}</span></Link></li>)}</ul>
      </section>}

      <StationFaq locale={locale} items={faq} />

      <AskUs topic={station} pageUrl={pageUrl} variant="unlisted" />
    </div>
  </div>
}
