import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { HelpCenter } from '@/components/help/help-center'
import { getHelpCopy } from '@/content/help'
import { absoluteUrl } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const copy = getHelpCopy(await getLocale())
  return {
    title: `${copy.nav} | ZIYOU`,
    description: copy.subtitle,
    alternates: { canonical: absoluteUrl('/help') },
    openGraph: {
      title: `${copy.nav} | ZIYOU`,
      description: copy.subtitle,
      url: absoluteUrl('/help'),
    },
  }
}

export default async function HelpPage() {
  const locale = await getLocale()
  return <HelpCenter key={locale} locale={locale} />
}
