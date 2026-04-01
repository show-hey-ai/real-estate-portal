import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Globe, Shield, ArrowRight, Clock, Lock, Camera, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'
import { HomeSearchForm } from '@/components/listing/home-search-form'
import { getPublicSearchLocationIndex } from '@/lib/public-search-server'
import { getFavoriteIdsForViewer, getOptionalPublicViewer } from '@/lib/public-viewer'

export default async function HomePage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()])
  const supabase = await createClient()
  const viewerPromise = getOptionalPublicViewer()
  const locationIndexPromise = getPublicSearchLocationIndex()

  // 新着物件を取得（公開中のもののみ、最新6件）
  const listingsPromise = supabase
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

  const [viewer, locationIndex, { data: listings, error: listingsError }] = await Promise.all([
    viewerPromise,
    locationIndexPromise,
    listingsPromise,
  ])

  if (listingsError) {
    console.error('Error fetching listings:', listingsError)
  }

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

  return (
    <div>
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

      {/* Exclusive Properties Banner */}
      <section className="py-8 md:py-12 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-5 w-5 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold tracking-wide uppercase">Exclusive</span>
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
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">
                      {{ ja: '室内写真もご用意', en: 'Interior photos available', 'zh-TW': '提供室內照片', 'zh-CN': '提供室内照片' }[locale] ?? 'Interior photos available'}
                    </p>
                  </div>
                </div>
              </div>
              {isLoggedIn ? (
                <Link href="/listings">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold group">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    {t('home.exclusiveBannerButton')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button size="lg" className="bg-amber-500 hover:bg-amber-600 text-black font-semibold group">
                    {t('home.exclusiveBannerButton')}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="hidden md:grid grid-cols-2 gap-3 opacity-80">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-slate-400 mb-1">{{ ja: '例: 港区タワーマンション', en: 'e.g. Minato Tower Mansion', 'zh-TW': '例: 港區塔式公寓', 'zh-CN': '例: 港区塔式公寓' }[locale] ?? 'e.g. Minato Tower Mansion'}</p>
                <p className="font-semibold">¥1.2{{ ja: '億', en: '00M', 'zh-TW': '億', 'zh-CN': '亿' }[locale] ?? '00M'}</p>
                <p className="text-xs text-slate-400">85㎡ / 2LDK / 2019</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-slate-400 mb-1">{{ ja: '例: 渋谷区一棟マンション', en: 'e.g. Shibuya Apartment Bldg', 'zh-TW': '例: 澀谷區整棟公寓', 'zh-CN': '例: 涩谷区整栋公寓' }[locale] ?? 'e.g. Shibuya Apartment Bldg'}</p>
                <p className="font-semibold">¥3.5{{ ja: '億', en: '00M', 'zh-TW': '億', 'zh-CN': '亿' }[locale] ?? '00M'}</p>
                <p className="text-xs text-slate-400">{{ ja: '利回り', en: 'Yield', 'zh-TW': '報酬率', 'zh-CN': '回报率' }[locale] ?? 'Yield'} 5.2%</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-xs text-slate-400 mb-1">{{ ja: '例: 目黒区戸建', en: 'e.g. Meguro House', 'zh-TW': '例: 目黑區獨棟住宅', 'zh-CN': '例: 目黑区独栋住宅' }[locale] ?? 'e.g. Meguro House'}</p>
                <p className="font-semibold">¥8,900{{ ja: '万', en: 'K', 'zh-TW': '萬', 'zh-CN': '万' }[locale] ?? 'K'}</p>
                <p className="text-xs text-slate-400">120㎡ / 4LDK</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <Lock className="h-6 w-6 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-slate-400">{{ ja: 'ほか多数', en: 'and many more', 'zh-TW': '還有更多', 'zh-CN': '还有更多' }[locale] ?? 'and many more'}</p>
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
