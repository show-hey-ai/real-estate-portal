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
