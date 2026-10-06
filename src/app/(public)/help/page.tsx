import type { Metadata } from 'next'
import { localeAlternates } from '@/lib/locale-url'
import { getLocale } from 'next-intl/server'
import { HelpCenter } from '@/components/help/help-center'
import { getHelpCopy } from '@/content/help'
import { shareMetadata } from '@/lib/site-config'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const copy = getHelpCopy(locale)
  return {
    title: copy.nav,
    description: copy.subtitle,
    alternates: localeAlternates('/help', locale),
    ...shareMetadata({ title: `${copy.nav} | Welcome Home Tokyo`, description: copy.subtitle, url: localeAlternates('/help', locale).canonical, locale }),
  }
}

export default async function HelpPage() {
  const locale = await getLocale()
  return <HelpCenter key={locale} locale={locale} />
}
