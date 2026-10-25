import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { Calculator } from 'lucide-react'
import { PurchaseSimulator } from '@/components/simulator/purchase-simulator'
import { JsonLd } from '@/components/common/json-ld'
import { localeAlternates } from '@/lib/locale-url'
import { getSchemaLanguage, shareMetadata } from '@/lib/site-config'
import { getSimulatorCopy } from '@/lib/simulator-copy'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const text = getSimulatorCopy(locale)
  const alternates = localeAlternates('/simulator', locale)
  return { title: text.title, description: text.description, alternates, ...shareMetadata({ title: text.title, description: text.description, url: alternates.canonical, locale }) }
}

export default async function SimulatorPage() {
  const locale = await getLocale()
  const text = getSimulatorCopy(locale)
  const url = localeAlternates('/simulator', locale).canonical
  const app = { '@context': 'https://schema.org', '@type': 'WebApplication', name: text.title, description: text.description, url, inLanguage: getSchemaLanguage(locale), applicationCategory: 'FinanceApplication', operatingSystem: 'Any', offers: { '@type': 'Offer', price: 0, priceCurrency: 'JPY' } }
  // Bottom padding keeps the results bar on phones from covering the last lines.
  return <div className="container max-w-6xl py-8 pb-24 lg:pb-8">
    <JsonLd data={app} />
    <h1 className="flex items-center gap-2 text-2xl font-semibold md:text-3xl"><Calculator aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.title}</h1>
    <p className="mt-2 max-w-3xl text-sm leading-7 text-[#536274]">{text.intro}</p>
    <PurchaseSimulator />
  </div>
}
