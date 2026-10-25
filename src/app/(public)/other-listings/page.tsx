import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Info, Search } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { OtherListingForm } from '@/components/contact/other-listing-form'
import { getOtherListingsCopy } from '@/content/other-listings'
import { localeAlternates } from '@/lib/locale-url'
import { getSchemaLanguage, shareMetadata } from '@/lib/site-config'

/** Ask about a property found on SUUMO, HOME'S or any other site: send us the link by chat or email. */

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = getOtherListingsCopy(locale)
  const alternates = localeAlternates('/other-listings', locale)
  return { title: { absolute: copy.metaTitle }, description: copy.metaDescription, alternates, ...shareMetadata({ title: copy.metaTitle, description: copy.metaDescription, url: alternates.canonical, locale }) }
}

export default async function OtherListingsPage() {
  const locale = await getLocale()
  const copy = getOtherListingsCopy(locale)
  const structured = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: copy.title,
    description: copy.metaDescription,
    url: localeAlternates('/other-listings', locale).canonical,
    inLanguage: getSchemaLanguage(locale),
  }
  return <div className="container max-w-3xl py-8 text-[#1b293a] md:py-12" data-testid="other-listings-page">
    <JsonLd data={structured} />
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#57769b]"><Search aria-hidden="true" className="h-4 w-4" />{copy.eyebrow}</p>
    <h1 className="mt-3 text-2xl font-semibold leading-tight md:text-4xl">{copy.title}</h1>
    <p className="mt-4 text-sm leading-7 text-[#3d4a5a] md:text-base">{copy.lead}</p>

    <section className="mt-8" aria-labelledby="other-listings-steps">
      <h2 id="other-listings-steps" className="text-lg font-semibold">{copy.stepsTitle}</h2>
      <ol className="mt-3 grid gap-3 md:grid-cols-3">
        {copy.steps.map(([title, body], index) => <li key={title} className="rounded-xl border border-[#dbe2e9] bg-white p-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#274d7d] text-sm font-bold text-white">{index + 1}</span>
          <h3 className="mt-2 text-sm font-semibold">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-[#536274]">{body}</p>
        </li>)}
      </ol>
    </section>

    <div className="mt-8"><OtherListingForm locale={locale} /></div>

    <section className="mt-8 rounded-xl border border-[#e6dcc8] bg-[#fdfaf3] p-5" aria-labelledby="other-listings-notes">
      <h2 id="other-listings-notes" className="flex items-center gap-2 text-sm font-semibold text-[#6b4f1d]"><Info aria-hidden="true" className="h-4 w-4" />{copy.notesTitle}</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-xs leading-5 text-[#5c4a2c]">{copy.notes.map((note) => <li key={note}>{note}</li>)}</ul>
    </section>
  </div>
}
