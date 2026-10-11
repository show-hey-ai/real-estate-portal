/**
 * 宿泊転用・開業診断サイト（別サイト）への導線。
 * 物件ページから、所在地と物件URLが入った状態で申込フォームを開く。
 */

export const CONVERSION_CHECK_BASE_URL =
  process.env.NEXT_PUBLIC_HOSPITALITY_SURVEY_URL?.replace(/\/+$/, '') || 'https://hospitality-survey.vercel.app'

const SURVEY_LOCALES = new Set(['ja', 'en', 'zh-CN', 'zh-TW'])

/** ホテル・旅館への転用を考えうる種別。区分マンションと土地は対象外。 */
const CONVERTIBLE_TYPES = new Set(['戸建', '一棟マンション', '一棟アパート', '一棟ビル', '店舗・事務所'])

export function isConversionCandidate(propertyType: string | null | undefined): boolean {
  return !!propertyType && CONVERTIBLE_TYPES.has(propertyType)
}

export function conversionCheckUrl(input: {
  locale: string
  /** 公開してよい所在地だけを渡す（非公開の番地は渡さない） */
  publicAddress?: string | null
  listingUrl?: string | null
  baseUrl?: string
}): string {
  const locale = SURVEY_LOCALES.has(input.locale) ? input.locale : 'en'
  const url = new URL(`${input.baseUrl ?? CONVERSION_CHECK_BASE_URL}/${locale}/apply`)
  if (input.listingUrl) url.searchParams.set('propertyUrl', input.listingUrl)
  if (input.publicAddress) url.searchParams.set('address', input.publicAddress)
  return url.toString()
}
