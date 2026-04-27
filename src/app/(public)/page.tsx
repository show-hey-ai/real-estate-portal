import type { Metadata } from 'next'
import Link from 'next/link'
import { unstable_cache } from 'next/cache'
import { getTranslations, getLocale } from 'next-intl/server'
import { JsonLd } from '@/components/common/json-ld'
import { GuideCard } from '@/components/guides/guide-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Globe, Shield, ArrowRight, Clock, Lock, MapPin, Flame, FileCheck } from 'lucide-react'
import { getGuideArticles } from '@/content/guides'
import { createServiceClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { HomeSearchForm } from '@/components/listing/home-search-form'
import { getGuideUiCopy, normalizeGuideLocale } from '@/lib/guides'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'
import {
  absoluteUrl,
  buildListingDescription,
  buildListingTitle,
  getPrimaryListingImage,
  getSchemaLanguage,
  getSiteCopy,
} from '@/lib/site-config'

const homeSeoContent = {
  ja: {
    heading: '日本で宿泊事業を始めたい外国人投資家へ — 物件購入から開業まで、まとめて支援します',
    intro:
      '自由不動産は、外国人投資家が日本で民泊・旅館・小規模ホテルを始めるための、購入前診断・売買仲介・開業PMまでを一気通貫で提供する宿泊事業特化の不動産事業です。',
    points: [
      '購入前に「この物件で宿泊事業ができるか」を確認（用途地域・消防・建築・保健所）',
      '旅館業・民泊・小規模ホテル向け物件に特化',
      '英語・繁体字・簡体字・日本語で全行程を対応',
    ],
    detail:
      '物件探しから許認可・開業準備まで、行政書士・建築士・消防・施工とのチームを組んで進めます。買う前に詰まるポイントを洗い出すので、買ってから困る投資家を出しません。',
  },
  en: {
    heading: 'For foreign investors who want to open a hotel, ryokan, or Airbnb in Japan — from property purchase to opening day, in one engagement',
    intro:
      'Ziyou Real Estate is a Tokyo-licensed brokerage focused entirely on hospitality property — pre-purchase feasibility, acquisition, licensing, and opening PM, all under one roof.',
    points: [
      'Pre-purchase check: zoning, fire code, building code, and hokenjo feasibility',
      'Specialized in ryokan, minpaku, simple lodging, and boutique hotel properties',
      'End-to-end support in English, Traditional Chinese, Simplified Chinese, and Japanese',
    ],
    detail:
      'From sourcing to licensing and opening, we coordinate with administrative scriveners, architects, fire authorities, and contractors. We find the deal-breakers before you commit, so you never buy a building you cannot operate.',
  },
  'zh-TW': {
    heading: '為想在日本經營住宿事業的外國投資者 — 從購買物件到開業，一次到位',
    intro:
      '自由不動產是專門服務外國投資者的東京持牌不動產業者，提供住宿業物件的購買前診斷、仲介、許可申請與開業PM全流程支援。',
    points: [
      '購買前確認：用途地域、消防、建築、保健所是否能通過',
      '專注旅館、民宿、簡易宿所、精品飯店向物件',
      '提供英文、繁體中文、簡體中文與日文的全程對應',
    ],
    detail:
      '從選址、購買到許可申請與開業準備，我們與行政書士、建築師、消防、施工方組成團隊推進。在您購買前先排查所有可能卡關的點，避免您買到無法經營的物件。',
  },
  'zh-CN': {
    heading: '为想在日本经营住宿业务的外国投资者 — 从买物件到开业，一站式完成',
    intro:
      '自由不动产是专门服务外国投资者的东京持牌不动产业者，提供住宿业物件的购买前诊断、仲介、许可申请与开业PM全流程支持。',
    points: [
      '购买前确认：用途地域、消防、建筑、保健所是否能通过',
      '专注旅馆、民宿、简易住宿所、精品酒店向物件',
      '提供英文、繁体中文、简体中文和日文的全程对应',
    ],
    detail:
      '从选址、购买到许可申请与开业准备，我们与行政书士、建筑师、消防、施工方组成团队推进。在您购买前先排查所有可能卡关的点，避免您买到无法经营的物件。',
  },
} as const

const getLatestPublishedListings = unstable_cache(
  async () => {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        propertyType,
        price,
        addressPublic,
        stations,
        builtYear,
        buildingArea,
        yieldGross,
        viewCount,
        publishedAt,
        media (url, category)
      `)
      .eq('status', 'PUBLISHED')
      .eq('adAllowed', true)
      .order('publishedAt', { ascending: false })
      .limit(6)

    if (error) {
      console.error('Error fetching listings:', error)
      return []
    }

    return data || []
  },
  ['home-latest-published-listings'],
  { revalidate: 300 }
)

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const siteCopy = getSiteCopy(locale)

  return {
    title: siteCopy.title,
    description: siteCopy.description,
    alternates: {
      canonical: absoluteUrl('/'),
    },
    openGraph: {
      title: siteCopy.title,
      description: siteCopy.description,
      url: absoluteUrl('/'),
    },
    twitter: {
      title: siteCopy.title,
      description: siteCopy.description,
    },
  }
}

export default async function HomePage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()])
  const normalizedLocale = normalizeGuideLocale(locale)
  const guideCopy = getGuideUiCopy(normalizedLocale)
  const featuredGuides = getGuideArticles(normalizedLocale).slice(0, 3)
  const viewerPromise = getOptionalPublicViewer()
  const locationIndexPromise = getPublicSearchLocationIndex()
  const listingsPromise = getLatestPublishedListings()

  const [viewer, locationIndex, listings] = await Promise.all([
    viewerPromise,
    locationIndexPromise,
    listingsPromise,
  ])

  // Prisma互換の形式に変換
  const formattedListings = (listings || []).map(listing => ({
    ...listing,
    price: listing.price ? BigInt(listing.price) : null,
    buildingArea: listing.buildingArea ? Number(listing.buildingArea) : null,
    yieldGross: listing.yieldGross ? Number(listing.yieldGross) : null,
  }))

  const userId = viewer?.id ?? null
  const favoriteIds = viewer
    ? await getFavoriteIdsForViewer(
        viewer.id,
        formattedListings.map((listing) => listing.id)
      )
    : new Set<string>()
  const isLoggedIn = !!viewer
  const seoContent = homeSeoContent[locale as keyof typeof homeSeoContent] ?? homeSeoContent.ja
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: getSiteCopy(locale).title,
    description: getSiteCopy(locale).description,
    url: absoluteUrl('/'),
    inLanguage: getSchemaLanguage(locale),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: formattedListings.map((listing, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/listings/${listing.id}`),
        name: buildListingTitle(listing, locale),
        image: getPrimaryListingImage(listing) || undefined,
        description: buildListingDescription(listing, locale),
      })),
    },
  }

  return (
    <div>
      <JsonLd data={collectionJsonLd} />
      {/* Hero Section - コンパクト版（ログイン時） */}
      {isLoggedIn ? (
        <section className="py-4 md:py-6 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            {/* Quick Search Bar */}
            <div className="bg-background rounded-lg shadow-md border p-3 md:p-4">
              <HomeSearchForm compact locationIndex={locationIndex} />
            </div>
          </div>
        </section>
      ) : (
        /* Hero Section - コンパクト版（未ログイン時）- 検索バー付き */
        <section className="relative py-10 md:py-16 bg-gradient-to-b from-primary/5 to-background overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                {t('home.heroTitle')}
                {t('home.heroTitleLine2')}
              </h1>
              <p className="text-muted-foreground">
                {t('home.heroDescription')}
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-5xl mx-auto bg-background rounded-xl shadow-lg border p-4">
              <HomeSearchForm locationIndex={locationIndex} />
            </div>

            {/* Trust Indicators - コンパクト */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-xs text-muted-foreground mt-4">
              <div className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-primary" />
                <span>{t('home.languages4')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-primary" />
                <span>{t('trust.responseTime', { hours: 24 })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-primary" />
                <span>{t('home.freeRegistration')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* New Listings Section */}
      {formattedListings.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold">
                {t('home.newListings')}
              </h2>
              <Link href="/listings">
                <Button variant="ghost" size="sm" className="gap-1 group">
                  {t('home.viewAll')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {formattedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorite={favoriteIds.has(listing.id)}
                  userId={userId}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pre-Purchase Review CTA Banner — links to /hotel-lp.html */}
      <section className="py-10 md:py-14 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">
                  Pre-Purchase Review
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                {t('home.exclusiveBannerTitle')}
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                {t('home.exclusiveBannerDesc')}
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Lock className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t('home.exclusiveBannerStats1')}</p>
                    <p className="text-sm font-semibold">{t('home.exclusiveBannerStats2')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{t('home.exclusiveBannerStats3')}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <a href="/hotel-lp.html#form">
                  <Button
                    size="lg"
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold group"
                  >
                    {t('home.exclusiveBannerButton')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
                <a
                  href="/hotel-lp.html"
                  className="text-sm text-slate-300 hover:text-amber-300 underline-offset-4 hover:underline"
                >
                  {t('home.exclusiveBannerCtaSecondary')} →
                </a>
              </div>
              {locale !== 'en' && (
                <p className="text-xs text-slate-500 mt-3">
                  {t('home.exclusiveBannerLpNote')}
                </p>
              )}
            </div>
            <div className="hidden md:block">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400 mb-4">
                {t('home.exclusiveBannerCheckHeading')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <p className="font-semibold text-sm">
                      {t('home.exclusiveBannerCheck1Label')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('home.exclusiveBannerCheck1Desc')}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="h-4 w-4 text-amber-400" />
                    <p className="font-semibold text-sm">
                      {t('home.exclusiveBannerCheck2Label')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('home.exclusiveBannerCheck2Desc')}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-4 w-4 text-amber-400" />
                    <p className="font-semibold text-sm">
                      {t('home.exclusiveBannerCheck3Label')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('home.exclusiveBannerCheck3Desc')}
                  </p>
                </div>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1">
                    <FileCheck className="h-4 w-4 text-amber-400" />
                    <p className="font-semibold text-sm">
                      {t('home.exclusiveBannerCheck4Label')}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {t('home.exclusiveBannerCheck4Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - 信頼構築 (未ログイン時のみ) */}
      {!isLoggedIn && (
        <section className="py-10 md:py-16 bg-muted/30">
          <div className="container">
            <h2 className="text-xl md:text-2xl font-bold text-center mb-6">
              {t('home.features')}
            </h2>
            <div className="grid md:grid-cols-3 gap-4 md:gap-6">
              <Card className="group hover:shadow-md transition-all duration-200">
                <CardContent className="pt-5 pb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{t('home.feature1Title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('home.feature1Desc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-md transition-all duration-200">
                <CardContent className="pt-5 pb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{t('home.feature2Title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('home.feature2Desc')}
                  </p>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-md transition-all duration-200">
                <CardContent className="pt-5 pb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{t('home.feature3Title')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('home.feature3Desc')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      )}

      <section className="py-10 md:py-14 border-t bg-muted/20">
        <div className="container">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                {guideCopy.navLabel}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                {guideCopy.homeTitle}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                {guideCopy.homeDescription}
              </p>
            </div>
            <Link href="/guides">
              <Button variant="outline" className="group whitespace-nowrap">
                {guideCopy.viewAllGuides}
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {featuredGuides.map((article) => (
              <GuideCard
                key={article.slug}
                article={article}
                locale={normalizedLocale}
                ctaLabel={guideCopy.readArticle}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-14 border-t">
        <div className="container">
          <div className="max-w-4xl space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              {seoContent.heading}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {seoContent.intro}
            </p>
            <div className="flex flex-wrap gap-2">
              {seoContent.points.map((point) => (
                <span
                  key={point}
                  className="rounded-full border bg-background px-3 py-1 text-sm text-muted-foreground"
                >
                  {point}
                </span>
              ))}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {seoContent.detail}
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section - 行動喚起 (未ログイン時のみ表示) */}
      {!isLoggedIn && (
        <section className="py-10 md:py-14 bg-primary text-primary-foreground">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h2 className="text-xl md:text-2xl font-bold">
                  {t('home.ctaTitle')}
                </h2>
                <p className="opacity-90 text-sm mt-1">
                  {t('home.ctaDescription')}
                </p>
              </div>
              <Link href="/register">
                <Button size="lg" variant="secondary" className="group whitespace-nowrap">
                  {t('home.ctaButton')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
