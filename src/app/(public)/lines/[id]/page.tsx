import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { ArrowRight, TrainFront } from 'lucide-react'
import { AskUs } from '@/components/common/ask-us'
import { JsonLd } from '@/components/common/json-ld'
import { ListingCard } from '@/components/listing/listing-card'
import { LineStationList } from '@/components/transit/line-station-list'
import { withCardFacts } from '@/lib/card-facts'
import { pickCoverImage } from '@/lib/cover-image'
import { countedTitle } from '@/lib/home-snippet'
import { localeAlternates, localizedPath } from '@/lib/locale-url'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import { absoluteUrl, getSchemaLanguage, shareMetadata } from '@/lib/site-config'
import { STATIONS, lineById, lineStations, listingStations, type TransitLine } from '@/lib/transit'
import { getTransitCopy } from '@/lib/transit/copy'
import { getTransitPageCopy } from '@/lib/transit/page-copy'
import { getPublicCardRows, toCardListing } from '@/lib/transit/public-listings'
import { lineLabel, stationLabel, stationListingCounts } from '@/lib/transit/search'

export const dynamic = 'force-dynamic'

/** One line: its stations with listing counts, and the listings near any of them. */

type Props = { params: Promise<{ id: string }> }

const SHOWN = 24

async function lineListings(line: TransitLine) {
  const rows = await getPublicCardRows()
  const members = new Set(lineStations(line))
  return { rows: rows.filter((row) => listingStations(row.stations).some(({ station }) => members.has(station))), counts: stationListingCounts(rows) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const line = lineById((await params).id)
  if (!line) return { robots: { index: false, follow: false } }
  const locale = await getLocale()
  const copy = getTransitPageCopy(locale)
  const label = lineLabel(line, locale)
  const { rows } = await lineListings(line)
  const title = countedTitle(copy.lineTitle(label), rows.length, locale)
  const description = copy.lineDescription(label, rows.length)
  const alternates = localeAlternates(`/lines/${line.id}`, locale)
  const cover = rows.map((row) => pickCoverImage((row.media || []).filter((item) => item.isAdopted))).find(Boolean)
  // Lines with no listings stay reachable from the picker but are not offered to search engines.
  return { title, description, alternates, ...shareMetadata({ title, description, url: alternates.canonical, locale, image: cover?.url }), robots: rows.length ? { index: true, follow: true } : { index: false, follow: true } }
}

export default async function LinePage({ params }: Props) {
  const line = lineById((await params).id)
  if (!line) notFound()
  const locale = await getLocale()
  const copy = getTransitPageCopy(locale)
  const pickerCopy = getTransitCopy(locale)
  const label = lineLabel(line, locale)
  const [{ rows, counts }, viewer] = await Promise.all([lineListings(line), getOptionalPublicViewer()])
  const listings = rows.slice(0, SHOWN).map(toCardListing)
  const favorites = viewer ? await getFavoriteIdsForViewer(viewer.id, listings.map((home) => home.id)) : new Set<string>()
  const pageUrl = localeAlternates(`/lines/${line.id}`, locale).canonical
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.lineTitle(label),
    url: pageUrl,
    inLanguage: getSchemaLanguage(locale),
    mainEntity: { '@type': 'ItemList', numberOfItems: rows.length, itemListElement: listings.map((home, index) => ({ '@type': 'ListItem', position: index + 1, url: absoluteUrl(localizedPath(`/listings/${home.id}`, locale)) })) },
  }
  const breadcrumb = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: copy.home, item: absoluteUrl(localizedPath('/', locale)) },
    { '@type': 'ListItem', position: 2, name: copy.hub, item: absoluteUrl(localizedPath('/lines', locale)) },
    { '@type': 'ListItem', position: 3, name: label, item: pageUrl },
  ] }

  return <div className="bg-white text-[#1b293a]" data-testid="line-page">
    <JsonLd data={structured} />
    <JsonLd data={breadcrumb} />
    <div className="container pb-14 pt-8">
      <nav aria-label="Breadcrumb" className="text-xs text-[#536274]"><Link href="/" className="hover:underline">{copy.home}</Link> / <Link href="/lines" className="hover:underline">{copy.hub}</Link> / <span>{label}</span></nav>
      <h1 className="mt-4 flex items-center gap-3 text-2xl font-semibold md:text-3xl"><span aria-hidden="true" className="h-8 w-2 shrink-0 rounded-full" style={{ backgroundColor: line.color }} />{copy.lineTitle(label)}</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#536274]">{rows.length ? copy.lineIntro(label, lineStations(line).length, rows.length) : copy.lineEmpty(label)}</p>

      <section className="mt-8 rounded-2xl border border-[#dbe2e9] bg-[#f8fafc] p-4 md:p-6" aria-labelledby="line-stations-title">
        <h2 id="line-stations-title" className="flex items-center gap-2 text-lg font-semibold"><TrainFront aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{copy.stationsTitle}</h2>
        <div className="mt-4">
          <LineStationList line={line} counts={counts} label={(name) => stationLabel(name, locale)} slug={(name) => STATIONS[name].slug} count={pickerCopy.count} branch={pickerCopy.branch} />
        </div>
        <Link href={`/lines?lines=${line.id}`} className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[#274d7d] px-4 text-sm font-semibold text-white hover:bg-[#18375f]">{copy.chooseOnLine}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </section>

      {listings.length > 0 && <section className="mt-10" aria-labelledby="line-listings-title">
        <h2 id="line-listings-title" className="text-xl font-semibold">{copy.lineListings}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{listings.map((home) => <ListingCard key={home.id} listing={withCardFacts(home, locale)} isFavorite={favorites.has(home.id)} userId={viewer?.id ?? null} />)}</div>
        {rows.length > SHOWN && <div className="mt-6 text-center"><Link href={`/listings?lines=${line.id}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#274d7d] hover:underline">{copy.seeAll(rows.length)}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link></div>}
      </section>}

      <AskUs topic={label} pageUrl={pageUrl} variant="unlisted" />

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold">
        <Link href={`/listings?lines=${line.id}`} className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{copy.search}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
        <Link href="/lines" className="inline-flex items-center gap-1 text-[#274d7d] hover:underline">{copy.hub}<ArrowRight aria-hidden="true" className="h-4 w-4" /></Link>
      </div>
    </div>
  </div>
}
