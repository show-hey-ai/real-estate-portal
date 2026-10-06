import { defaultLocale, locales, type Locale } from '@/i18n/config'
import { absoluteUrl, getSchemaLanguage } from './site-config'

// Search engines do not send the locale cookie, so every language needs its own URL.
// English (the default) keeps the plain path; other languages add ?lang=.
export const LOCALE_QUERY = 'lang'
export const LOCALE_HEADER = 'x-portal-locale'

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}

export function localizedPath(path: string, locale: string): string {
  if (!isLocale(locale) || locale === defaultLocale) return path
  return `${path}${path.includes('?') ? '&' : '?'}${LOCALE_QUERY}=${locale}`
}

export interface LocaleAlternates {
  canonical: string
  languages: Record<string, string>
}

/** Canonical URL for the rendered language plus hreflang links to every language version. */
export function localeAlternates(path: string, locale: string): LocaleAlternates {
  return {
    canonical: absoluteUrl(localizedPath(path, locale)),
    languages: {
      ...Object.fromEntries(locales.map((language) => [getSchemaLanguage(language), absoluteUrl(localizedPath(path, language))])),
      'x-default': absoluteUrl(path),
    },
  }
}

/** Sitemap entries for every language version of one page, each listing its alternates. */
export function localizedSitemapUrls(path: string): { url: string; languages: Record<string, string> }[] {
  const languages = Object.fromEntries(locales.map((language) => [getSchemaLanguage(language), absoluteUrl(localizedPath(path, language))]))
  return locales.map((language) => ({ url: absoluteUrl(localizedPath(path, language)), languages }))
}
