import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Search, Globe, Shield, ArrowRight, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listing/listing-card'

export default async function HomePage() {
  const t = await getTranslations()
  const locale = await getLocale()
  const supabase = await createClient()

  const { data: { user: authUser } } = await supabase.auth.getUser()

  let userId: string | null = null
  let favoriteIds: Set<string> = new Set()

  if (authUser) {
    const { data: dbUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email!)
      .single()

    if (dbUser) {
      userId = dbUser.id
      const { data: favorites } = await supabase
        .from('favorites')
        .select('listingId')
        .eq('userId', dbUser.id)

      if (favorites) {
        favoriteIds = new Set(favorites.map(f => f.listingId))
      }
    }
  }

  // 新着物件を取得（公開中のもののみ、最新6件）
  const { data: listings, error: listingsError } = await supabase
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
    .order('publishedAt', { ascending: false })
    .limit(6)

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

  const isLoggedIn = !!authUser

  return (
    <div>
      {/* Hero Section - コンパクト版（ログイン時） */}
      {isLoggedIn ? (
        <section className="py-4 md:py-6 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            {/* Quick Search Bar */}
            <div className="bg-background rounded-lg shadow-md border p-3 md:p-4">
              <form action="/listings" method="get" className="space-y-2">
                {/* 1行目: キーワード + 種別 + 価格 */}
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    name="q"
                    placeholder={t('search.keywordPlaceholder')}
                    className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                  />
                  <select
                    name="type"
                    className="md:w-32 h-10 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.allTypes')}</option>
                    <option value="区分マンション">{t('listing.types.mansion')}</option>
                    <option value="一棟アパート">{t('listing.types.apartment')}</option>
                    <option value="一棟マンション">{t('listing.types.building')}</option>
                    <option value="戸建">{t('listing.types.house')}</option>
                    <option value="土地">{t('listing.types.land')}</option>
                  </select>
                  <select
                    name="priceMax"
                    className="md:w-28 h-10 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.priceRange')}</option>
                    <option value="30000000">{locale === 'en' ? '~¥30M' : '~3,000万'}</option>
                    <option value="50000000">{locale === 'en' ? '~¥50M' : '~5,000万'}</option>
                    <option value="100000000">{locale === 'en' ? '~¥100M' : '~1億'}</option>
                    <option value="300000000">{locale === 'en' ? '~¥300M' : '~3億'}</option>
                  </select>
                </div>
                {/* 2行目: エリア + 徒歩 + 面積 + 検索ボタン */}
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    name="prefecture"
                    className="md:w-28 h-10 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.allPrefectures')}</option>
                    <option value="東京都">東京都</option>
                    <option value="神奈川県">神奈川県</option>
                    <option value="埼玉県">埼玉県</option>
                    <option value="千葉県">千葉県</option>
                    <option value="大阪府">大阪府</option>
                  </select>
                  <select
                    name="walkMax"
                    className="md:w-28 h-10 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.walkMinutesAll')}</option>
                    <option value="5">{t('search.walkMinutes5')}</option>
                    <option value="10">{t('search.walkMinutes10')}</option>
                    <option value="15">{t('search.walkMinutes15')}</option>
                  </select>
                  <select
                    name="areaMin"
                    className="md:w-28 h-10 px-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.buildingAreaAll')}</option>
                    <option value="20">20㎡+</option>
                    <option value="50">50㎡+</option>
                    <option value="100">100㎡+</option>
                    <option value="200">200㎡+</option>
                  </select>
                  <Button type="submit" className="h-10 md:ml-auto">
                    <Search className="mr-2 h-4 w-4" />
                    {t('search.search')}
                  </Button>
                </div>
              </form>
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
              <form action="/listings" method="get" className="space-y-3">
                {/* 1行目: キーワード + 種別 + 価格 */}
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    type="text"
                    name="q"
                    placeholder={t('search.keywordPlaceholder')}
                    className="flex-1 h-11 px-4 rounded-md border border-input bg-background"
                  />
                  <select
                    name="type"
                    className="md:w-36 h-11 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.allTypes')}</option>
                    <option value="区分マンション">{t('listing.types.mansion')}</option>
                    <option value="一棟アパート">{t('listing.types.apartment')}</option>
                    <option value="一棟マンション">{t('listing.types.building')}</option>
                    <option value="戸建">{t('listing.types.house')}</option>
                    <option value="土地">{t('listing.types.land')}</option>
                  </select>
                  <select
                    name="priceMax"
                    className="md:w-32 h-11 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.priceRange')}</option>
                    <option value="30000000">{locale === 'en' ? '~¥30M' : '~3,000万'}</option>
                    <option value="50000000">{locale === 'en' ? '~¥50M' : '~5,000万'}</option>
                    <option value="100000000">{locale === 'en' ? '~¥100M' : '~1億'}</option>
                    <option value="300000000">{locale === 'en' ? '~¥300M' : '~3億'}</option>
                  </select>
                </div>
                {/* 2行目: エリア + 徒歩 + 面積 + 検索ボタン */}
                <div className="flex flex-col md:flex-row gap-2">
                  <select
                    name="prefecture"
                    className="md:w-32 h-11 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.allPrefectures')}</option>
                    <option value="東京都">東京都</option>
                    <option value="神奈川県">神奈川県</option>
                    <option value="埼玉県">埼玉県</option>
                    <option value="千葉県">千葉県</option>
                    <option value="大阪府">大阪府</option>
                  </select>
                  <select
                    name="walkMax"
                    className="md:w-32 h-11 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.walkMinutesAll')}</option>
                    <option value="5">{t('search.walkMinutes5')}</option>
                    <option value="10">{t('search.walkMinutes10')}</option>
                    <option value="15">{t('search.walkMinutes15')}</option>
                  </select>
                  <select
                    name="areaMin"
                    className="md:w-28 h-11 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="">{t('search.buildingAreaAll')}</option>
                    <option value="20">20㎡+</option>
                    <option value="50">50㎡+</option>
                    <option value="100">100㎡+</option>
                    <option value="200">200㎡+</option>
                  </select>
                  <Button type="submit" size="lg" className="h-11 md:ml-auto">
                    <Search className="mr-2 h-4 w-4" />
                    {t('search.search')}
                  </Button>
                </div>
              </form>
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
