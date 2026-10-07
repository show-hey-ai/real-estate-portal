import { type Locale, defaultLocale, locales } from '@/i18n/config'
import { formatApprovedPublicAddress } from '@/lib/address'
import { pickCoverImage } from '@/lib/cover-image'
import { buildingNameOf } from '@/lib/building-name'
import { formatPrice } from '@/lib/format'
import { normalizeTransitStations } from '@/lib/transit-normalization'
import {
  formatTransitAccessLabel,
  translateAddress,
  translateCityName,
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
  landArea?: number | string | null
  builtYear?: number | null
  yieldGross?: number | string | null
  descriptionJa?: string | null
  descriptionEn?: string | null
  descriptionZhTw?: string | null
  descriptionZhCn?: string | null
  publishedAt?: string | Date | null
  updatedAt?: string | Date | null
  media?: { url: string; category?: string | null; isAdopted?: boolean }[] | null
}

const DEFAULT_SITE_URL = 'https://portal.ziyou-fudosan.com'

/** Public site name. The licensed operator stays visible in the footer and structured data. */
export const SITE_NAME = 'Welcome Home Tokyo'
export const OPERATOR_NAME = 'Ziyou Real Estate LLC'
export const OPERATOR_NAME_JA = '自由不動産合同会社'
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
    title: '東京の投資用・居住用・土地を探す｜Welcome Home Tokyo',
    description:
      '東京の投資用物件、居住用住宅、土地を探す方へ。Welcome Home Tokyoが日本語・英語・中国語で物件探しから売買までお手伝いします。',
    listingsTitle: '東京の投資用・居住用・土地を探す',
    listingsDescription:
      '東京の収益物件、マンション、戸建て、土地を検索。掲載物件がない場合も希望条件からご相談いただけます。',
  },
  en: {
    title: 'Tokyo Property for Sale | Welcome Home Tokyo',
    description:
      'Find investment property, residential homes, and land in Tokyo with Welcome Home Tokyo. Discuss your purchase in Japanese, English, or Chinese.',
    listingsTitle: 'Tokyo Property for Sale | Welcome Home Tokyo',
    listingsDescription:
      'Browse Tokyo income properties, condominiums, houses, and land. Tell us your criteria if a suitable property is not yet published.',
  },
  'zh-TW': {
    title: '東京投資用、居住用及土地物件｜Welcome Home Tokyo',
    description:
      'Welcome Home Tokyo協助您在東京尋找投資物件、居住用住宅及土地。提供日語、英語與中文溝通。',
    listingsTitle: '東京待售物件｜Welcome Home Tokyo',
    listingsDescription:
      '搜尋東京收益物件、公寓、獨棟住宅與土地。若沒有合適的公開物件，也可以傳送購買條件。',
  },
  'zh-CN': {
    title: '东京投资、居住及土地房产｜Welcome Home Tokyo',
    description:
      'Welcome Home Tokyo协助您在东京寻找投资房产、居住用住宅及土地。提供日语、英语和中文沟通。',
    listingsTitle: '东京待售房产｜Welcome Home Tokyo',
    listingsDescription:
      '搜索东京收益房产、公寓、独栋住宅和土地。如果没有合适的公开房源，也可以发送购买条件。',
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
  const adoptedMedia = listing.media?.filter((image) => image.isAdopted !== false)
  const mainImage = pickCoverImage(adoptedMedia)

  return mainImage?.url || null
}

export function buildListingTitle(listing: SeoListingLike, locale: string): string {
  const normalizedLocale = normalizeLocale(locale)
  const publicAddress = formatApprovedPublicAddress(listing.addressPublic)
  const translatedType =
    translatePropertyType(listing.propertyType || null, normalizedLocale) ||
    siteCopy[normalizedLocale].listingsTitle
  const translatedAddress =
    translateAddress(publicAddress || null, normalizedLocale) ||
    publicAddress ||
    ''
  const price = toNumber(listing.price)
  const formattedPrice = price != null ? formatPrice(price, normalizedLocale) : null

  if (normalizedLocale === 'en') {
    // English searchers look for "condominium in Minato, Tokyo"; a Japanese street address does not help them.
    const ward = listing.city ? translateCityName(listing.city, 'en') || listing.city : null
    const area = toNumber(listing.propertyType === '土地' ? listing.landArea : listing.buildingArea)
    return [`${translatedType} in ${ward ? `${ward}, ` : ''}Tokyo`, area ? `${area} m²` : null, formattedPrice].filter(Boolean).join(' | ')
  }

  // Japanese and Chinese searchers often search by building name, which leads the title when known.
  const buildingName = buildingNameOf(listing)
  return [buildingName, translatedType, translatedAddress, formattedPrice].filter(Boolean).join(' | ')
}

/** Visible page heading: building name when known, otherwise type and ward. */
export function buildListingHeading(listing: SeoListingLike, locale: string): string {
  const normalizedLocale = normalizeLocale(locale)
  const type = translatePropertyType(listing.propertyType || null, normalizedLocale) || siteCopy[normalizedLocale].listingsTitle
  const ward = listing.city ? (normalizedLocale === 'en' ? translateCityName(listing.city, 'en') || listing.city : normalizedLocale === 'zh-TW' ? listing.city.replace('区', '區') : listing.city) : null
  const buildingName = buildingNameOf(listing)
  // English pages avoid a Japanese-script heading; the building name stays in the description.
  if (normalizedLocale === 'en') return `${type} in ${ward ? `${ward}, ` : ''}Tokyo`
  if (buildingName) return buildingName
  if (!ward) return type
  return normalizedLocale === 'ja' ? `${ward}の${type}` : `${ward}${type}`
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
  const publicAddress = formatApprovedPublicAddress(listing.addressPublic)
  const translatedAddress =
    translateAddress(publicAddress || null, normalizedLocale) ||
    publicAddress ||
    ''
  const transitStations = normalizeTransitStations(listing.stations)
  const transit = formatTransitAccessLabel(transitStations[0], normalizedLocale)
  const price = toNumber(listing.price)
  const buildingArea = toNumber(listing.buildingArea)
  const landArea = toNumber(listing.landArea)
  const area = listing.propertyType === '土地' ? landArea : buildingArea
  const fragments =
    normalizedLocale === 'ja'
      ? [
          translatedType,
          translatedAddress,
          price != null ? `${formatPrice(price, normalizedLocale)}` : null,
          transit ? `${transit}` : null,
          area ? `${listing.propertyType === '土地' ? '土地面積' : '建物面積'} ${area.toFixed(0)}㎡` : null,
        ]
      : normalizedLocale === 'en'
        ? [
            translatedType,
            translatedAddress,
            price != null ? `${formatPrice(price, normalizedLocale)}` : null,
            transit ? transit : null,
            area ? `${listing.propertyType === '土地' ? 'Land area' : 'Floor area'} ${area.toFixed(0)} sqm` : null,
          ]
        : normalizedLocale === 'zh-TW'
          ? [
              translatedType,
              translatedAddress,
              price != null ? `${formatPrice(price, normalizedLocale)}` : null,
              transit ? transit : null,
              area ? `${listing.propertyType === '土地' ? '土地面積' : '建物面積'} ${area.toFixed(0)}㎡` : null,
            ]
          : [
              translatedType,
              translatedAddress,
              price != null ? `${formatPrice(price, normalizedLocale)}` : null,
              transit ? transit : null,
              area ? `${listing.propertyType === '土地' ? '土地面积' : '建筑面积'} ${area.toFixed(0)}㎡` : null,
            ]

  return fragments.filter(Boolean).join(' | ').slice(0, 160)
}

export function buildOrganizationJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: OPERATOR_NAME,
    alternateName: [OPERATOR_NAME_JA, SITE_NAME],
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
    areaServed: ['Tokyo', 'Greater Tokyo'],
    // The operating company's own site, so search engines connect the portal to the licensed broker.
    sameAs: ['https://ziyou-fudosan.com/'],
    availableLanguage: ['ja', 'en', 'zh-Hant', 'zh-Hans'],
    inLanguage: getSchemaLanguage(locale),
  }
}

export function buildWebsiteJsonLd(locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    publisher: { '@type': 'RealEstateAgent', name: OPERATOR_NAME, alternateName: OPERATOR_NAME_JA },
    url: getSiteUrl(),
    inLanguage: getSchemaLanguage(locale),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${absoluteUrl('/listings')}?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

/** Branded 1200×630 share image for pages without a property photo. */
export function defaultShareImages(alt: string) {
  return [{ url: absoluteUrl('/og-default.jpg'), width: 1200, height: 630, alt }]
}

/** Open Graph and Twitter card fields for a page, using the default share image unless one is given. */
export function shareMetadata({ title, description, url, locale, image }: { title: string; description: string; url: string; locale: string; image?: string | null }) {
  const images = image ? [{ url: image, alt: title }] : defaultShareImages(title)
  return {
    openGraph: { type: 'website' as const, siteName: SITE_NAME, title, description, url, locale: getOpenGraphLocale(locale), images },
    twitter: { card: 'summary_large_image' as const, title, description, images: images.map((item) => item.url) },
  }
}
