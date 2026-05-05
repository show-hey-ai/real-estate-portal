import { type Locale, defaultLocale, locales } from '@/i18n/config'
import { formatPublicAddress } from '@/lib/address'
import { formatPrice } from '@/lib/format'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import {
  formatTransitAccessLabel,
  translateAddress,
  translatePropertyType,
} from '@/lib/translate-fields'

type SeoStation = {
  line?: string | null
  line_en?: string | null
  name?: string | null
  name_en?: string | null
  walk_minutes?: number | null
}

type SeoListingLike = {
  id?: string
  propertyType?: string | null
  price?: bigint | number | string | null
  addressPublic?: string | null
  prefecture?: string | null
  city?: string | null
  stations?: SeoStation[] | null
  buildingArea?: number | string | null
  builtYear?: number | null
  yieldGross?: number | string | null
  descriptionJa?: string | null
  descriptionEn?: string | null
  descriptionZhTw?: string | null
  descriptionZhCn?: string | null
  publishedAt?: string | Date | null
  updatedAt?: string | Date | null
  media?: { url: string; category?: string | null }[] | null
}

const DEFAULT_SITE_URL = 'https://portal.ziyou-fudosan.com'
const VERCEL_PREVIEW_HOST_SUFFIX = '.vercel.app'

const siteCopy: Record<
  Locale,
  {
    title: string
    description: string
    listingsTitle: string
    listingsDescription: string
  }
> = {
  ja: {
    title: '日本宿泊業物件専門ポータル',
    description:
      '外国人投資家向け 宿泊事業用不動産の物件探し・紹介・購入支援。自由不動産が、東京の旅館業・民泊・ホテル向け物件の紹介から売買仲介、許認可準備、開業PMまでを支援します。',
    listingsTitle: '宿泊業向け物件一覧',
    listingsDescription:
      '東京23区の旅館業・民泊・ホテル向け物件、宿泊事業化が可能な戸建・一棟物件を、路線・駅・価格・利回りで検索できます。',
  },
  en: {
    title: 'Japan Hospitality Property Portal for Foreign Investors',
    description:
      'We help foreign investors find, acquire, and open hotel, ryokan, and minpaku-ready property in Japan — public listings, off-market introductions, brokerage, licensing preparation, and opening PM.',
    listingsTitle: 'Japan Hospitality Property Listings',
    listingsDescription:
      'Browse Tokyo properties suitable for hotels, ryokan, simple lodging, and minpaku — searchable by ward, train line, station, price, and yield.',
  },
  'zh-TW': {
    title: '日本住宿業物件專門平台｜自由不動產',
    description:
      '面向外國投資者的日本住宿業不動產物件搜尋、介紹與取得支援。自由不動產協助您完成東京旅館、民宿、飯店的候選介紹、仲介與開業準備。',
    listingsTitle: '日本住宿業物件列表',
    listingsDescription:
      '可依區域、路線、車站、價格與投報率，搜尋東京23區的旅館、民宿、飯店向物件，及可改造為住宿事業的戸建與整棟物件。',
  },
  'zh-CN': {
    title: '日本住宿业物件专业平台｜自由不动产',
    description:
      '面向外国投资者的日本住宿业不动产物件搜索、介绍与取得支持。自由不动产协助您完成东京旅馆、民宿、酒店的候选介绍、仲介与开业准备。',
    listingsTitle: '日本住宿业物件列表',
    listingsDescription:
      '可按区域、线路、车站、价格和收益率搜索东京23区的旅馆、民宿、酒店向物件，及可改造为住宿事业的戸建与整栋物件。',
  },
}

function normalizeLocale(locale: string | null | undefined): Locale {
  if (locale && locales.includes(locale as Locale)) {
    return locale as Locale
  }

  return defaultLocale
}

function toNumber(value: bigint | number | string | null | undefined): number | null {
  if (value == null) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'bigint') return Number(value)

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getLocalizedListingDescription(listing: SeoListingLike, locale: Locale): string | null {
  switch (locale) {
    case 'en':
      return listing.descriptionEn || listing.descriptionJa || null
    case 'zh-TW':
      return listing.descriptionZhTw || listing.descriptionJa || null
    case 'zh-CN':
      return listing.descriptionZhCn || listing.descriptionJa || null
    default:
      return listing.descriptionJa || null
  }
}

export function getSiteUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL

  if (!configuredUrl) {
    return DEFAULT_SITE_URL
  }

  try {
    const url = new URL(configuredUrl)
    if (url.hostname.endsWith(VERCEL_PREVIEW_HOST_SUFFIX)) {
      return DEFAULT_SITE_URL
    }

    return url.origin.replace(/\/+$/, '')
  } catch {
    return DEFAULT_SITE_URL
  }
}

export function absoluteUrl(pathname: string = '/'): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${getSiteUrl()}${normalizedPathname}`
}

export function getOpenGraphLocale(locale: string): string {
  switch (normalizeLocale(locale)) {
    case 'en':
      return 'en_US'
    case 'zh-TW':
      return 'zh_TW'
    case 'zh-CN':
      return 'zh_CN'
    default:
      return 'ja_JP'
  }
}

export function getSchemaLanguage(locale: string): string {
  switch (normalizeLocale(locale)) {
    case 'en':
      return 'en'
    case 'zh-TW':
      return 'zh-Hant'
    case 'zh-CN':
      return 'zh-Hans'
    default:
      return 'ja'
  }
}

export function getSiteCopy(locale: string) {
  return siteCopy[normalizeLocale(locale)]
}

export function getPrimaryListingImage(listing: SeoListingLike): string | null {
  const mainImage =
    listing.media?.find((image) => image.category === 'EXTERIOR') ||
    listing.media?.[0]

  return mainImage?.url || null
}

export function buildListingTitle(listing: SeoListingLike, locale: string): string {
  const normalizedLocale = normalizeLocale(locale)
  const publicAddress = formatPublicAddress(listing.addressPublic).publicAddress || listing.addressPublic
  const translatedType =
    translatePropertyType(listing.propertyType || null, normalizedLocale) ||
    siteCopy[normalizedLocale].listingsTitle
  const translatedAddress =
    translateAddress(publicAddress || null, normalizedLocale) ||
    publicAddress ||
    ''
  const price = toNumber(listing.price)
  const formattedPrice = price != null ? formatPrice(price, normalizedLocale) : null

  return [translatedType, translatedAddress, formattedPrice].filter(Boolean).join(' | ')
}

export function buildListingDescription(listing: SeoListingLike, locale: string): string {
  const normalizedLocale = normalizeLocale(locale)
  const description = getLocalizedListingDescription(listing, normalizedLocale)
  if (description) {
    return description.slice(0, 160)
  }

  const translatedType =
    translatePropertyType(listing.propertyType || null, normalizedLocale) ||
    siteCopy[normalizedLocale].listingsTitle
  const publicAddress = formatPublicAddress(listing.addressPublic).publicAddress || listing.addressPublic
  const translatedAddress =
    translateAddress(publicAddress || null, normalizedLocale) ||
    publicAddress ||
    ''
  const transitStations = normalizeTransitStations(listing.stations)
  const transit = formatTransitAccessLabel(transitStations[0], normalizedLocale)
  const price = toNumber(listing.price)
  const buildingArea = toNumber(listing.buildingArea)
  const yieldGross = toNumber(listing.yieldGross)

  const fragments =
    normalizedLocale === 'ja'
      ? [
          translatedType,
          translatedAddress,
          price != null ? `${formatPrice(price, normalizedLocale)}` : null,
          transit ? `${transit}` : null,
          buildingArea ? `建物面積 ${buildingArea.toFixed(0)}㎡` : null,
          yieldGross ? `表面利回り ${yieldGross.toFixed(1)}%` : null,
        ]
      : normalizedLocale === 'en'
        ? [
            translatedType,
            translatedAddress,
            price != null ? `${formatPrice(price, normalizedLocale)}` : null,
            transit ? transit : null,
            buildingArea ? `${buildingArea.toFixed(0)} sqm` : null,
            yieldGross ? `gross yield ${yieldGross.toFixed(1)}%` : null,
          ]
        : normalizedLocale === 'zh-TW'
          ? [
              translatedType,
              translatedAddress,
              price != null ? `${formatPrice(price, normalizedLocale)}` : null,
              transit ? transit : null,
              buildingArea ? `建物面積 ${buildingArea.toFixed(0)}㎡` : null,
              yieldGross ? `表面投報率 ${yieldGross.toFixed(1)}%` : null,
            ]
          : [
              translatedType,
              translatedAddress,
              price != null ? `${formatPrice(price, normalizedLocale)}` : null,
              transit ? transit : null,
              buildingArea ? `建筑面积 ${buildingArea.toFixed(0)}㎡` : null,
              yieldGross ? `表面收益率 ${yieldGross.toFixed(1)}%` : null,
            ]

  return fragments.filter(Boolean).join(' | ').slice(0, 160)
}

export function buildOrganizationJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: 'Ziyou Hospitality',
    url: getSiteUrl(),
    email: 'admin@ziyou-fudosan.com',
    telephone: '+81-80-8492-7068',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '柳橋1丁目11番5号 柳橋ビル305号室',
      addressLocality: '台東区',
      addressRegion: '東京都',
      postalCode: '111-0052',
      addressCountry: 'JP',
    },
    areaServed: ['Tokyo', 'Greater Tokyo', 'Japan tourism destinations'],
    availableLanguage: ['ja', 'en', 'zh-Hant', 'zh-Hans'],
    inLanguage: getSchemaLanguage(locale),
  }
}

export function buildWebsiteJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Ziyou Hospitality',
    url: getSiteUrl(),
    inLanguage: getSchemaLanguage(locale),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/listings')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}
