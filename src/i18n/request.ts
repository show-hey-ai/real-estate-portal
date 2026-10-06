import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'
import { LOCALE_HEADER } from '@/lib/locale-url'

function asLocale(value: string | null | undefined): Locale | null {
  return value && locales.includes(value as Locale) ? (value as Locale) : null
}

export default getRequestConfig(async () => {
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])
  // A ?lang= URL (set by the proxy) wins over the remembered cookie so each language URL is stable.
  const locale = asLocale(headerStore.get(LOCALE_HEADER)) ?? asLocale(cookieStore.get('locale')?.value) ?? defaultLocale

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
