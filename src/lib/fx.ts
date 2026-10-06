/**
 * Approximate foreign-currency prices for international buyers. Rates come from a free daily
 * feed (open.er-api.com, JPY base) cached for 12 hours; without rates nothing is shown.
 */

export type FxCurrency = 'USD' | 'TWD' | 'CNY'
export type JpyRates = Record<FxCurrency, number>

const RATES_URL = 'https://open.er-api.com/v6/latest/JPY'
const CACHE_SECONDS = 60 * 60 * 12
const TIMEOUT_MS = 3000

/** The currency shown next to yen for each site language; Japanese shows none. */
export const LOCALE_CURRENCY: Record<string, FxCurrency | undefined> = { en: 'USD', 'zh-TW': 'TWD', 'zh-CN': 'CNY' }

export function parseRates(body: unknown): JpyRates | null {
  const rates = (body as { result?: string; rates?: Record<string, unknown> })?.rates
  if ((body as { result?: string })?.result !== 'success' || !rates) return null
  const picked = { USD: Number(rates.USD), TWD: Number(rates.TWD), CNY: Number(rates.CNY) }
  return Object.values(picked).every((value) => Number.isFinite(value) && value > 0) ? picked : null
}

export async function getJpyRates(): Promise<JpyRates | null> {
  try {
    const response = await fetch(RATES_URL, { next: { revalidate: CACHE_SECONDS }, signal: AbortSignal.timeout(TIMEOUT_MS) })
    if (!response.ok) return null
    return parseRates(await response.json())
  } catch {
    return null
  }
}

/** "≈ US$150,700" style text, rounded to three significant figures. */
export function formatApproxPrice(yen: number, locale: string, rates: JpyRates | null): string | null {
  const currency = LOCALE_CURRENCY[locale]
  if (!currency || !rates || !(yen > 0)) return null
  const raw = yen * rates[currency]
  const magnitude = 10 ** Math.max(0, Math.floor(Math.log10(raw)) - 2)
  const value = (Math.round(raw / magnitude) * magnitude).toLocaleString('en-US')
  if (currency === 'USD') return `≈ US$${value}`
  if (currency === 'TWD') return `約 NT$${value}`
  return `约 人民币${value}元`
}

/** Short local-currency amount for titles: "US$127k", "US$1.3M", "NT$402萬", "人民币85万". */
export function formatCompactLocal(yen: number, locale: string, rates: JpyRates | null): string | null {
  const currency = LOCALE_CURRENCY[locale]
  if (!currency || !rates || !(yen > 0)) return null
  const value = yen * rates[currency]
  if (currency === 'USD') return value >= 1_000_000 ? `US$${(Math.round(value / 100_000) / 10).toLocaleString('en-US')}M` : `US$${Math.round(value / 1_000).toLocaleString('en-US')}k`
  const wan = Math.round(value / 10_000).toLocaleString('en-US')
  return currency === 'TWD' ? `NT$${wan}萬` : `人民币${wan}万`
}

/** Approximate local-currency range for a yen price band, e.g. "US$127k–253k"; null without rates. */
export function approxBandLabel(band: { min: number; max: number | null }, locale: string, rates: JpyRates | null): string | null {
  const low = band.min > 0 ? formatCompactLocal(band.min, locale, rates) : null
  const high = band.max ? formatCompactLocal(band.max, locale, rates) : null
  if (!low && !high) return null
  const words = { en: { under: 'under', over: '+' }, 'zh-TW': { under: '以下', over: '以上' }, 'zh-CN': { under: '以下', over: '以上' } }[locale as 'en' | 'zh-TW' | 'zh-CN']
  if (!words) return null
  const prefix = locale === 'en' ? 'about ' : locale === 'zh-TW' ? '約' : '约'
  if (!low) return locale === 'en' ? `${words.under} ${high}` : `${prefix}${high}${words.under}`
  if (!high) return locale === 'en' ? `${low}${words.over}` : `${prefix}${low}${words.over}`
  return `${prefix}${low}–${high!.replace(/^(US\$|NT\$|人民币)/, '')}`
}
