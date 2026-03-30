import Link from 'next/link'
import { Prisma } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/db'

type SummaryRow = {
  pageviews7d: number
  uniqueVisitors7d: number
  listingViews7d: number
  totalTrackedPageviews: number
}

type TrackedSinceRow = {
  trackedSince: Date | string | null
}

type TrendRow = {
  day: Date | string
  pageviews: number
  uniqueVisitors: number
}

type TopPageRow = {
  pathname: string
  pageType: string
  pageviews: number
  uniqueVisitors: number
}

type TopReferrerRow = {
  referrerHost: string
  pageviews: number
}

type TopListingRow = {
  listingId: string
  managementId: string | null
  addressPublic: string | null
  pageviews: number
}

type CampaignRow = {
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  pageviews: number
}

function toDateValue(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

function formatCompactDate(date: Date | string) {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Tokyo',
  }).format(toDateValue(date))
}

function getMaxValue(values: number[]) {
  return Math.max(...values, 1)
}

export default async function AdminAnalyticsPage() {
  const t = await getTranslations('admin.analytics')
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    summaryRows,
    trackedSinceRows,
    trendRows,
    topPages,
    topReferrers,
    topListings,
    campaignRows,
    leads7d,
  ] = await Promise.all([
    prisma.$queryRaw<SummaryRow[]>(Prisma.sql`
      SELECT
        COUNT(*) FILTER (WHERE "occurredAt" >= ${sevenDaysAgo})::int AS "pageviews7d",
        COUNT(DISTINCT CASE WHEN "occurredAt" >= ${sevenDaysAgo} THEN "visitorId" END)::int AS "uniqueVisitors7d",
        COUNT(*) FILTER (
          WHERE "occurredAt" >= ${sevenDaysAgo}
            AND "pageType" = 'listing_detail'
        )::int AS "listingViews7d",
        COUNT(*)::int AS "totalTrackedPageviews"
      FROM "site_visit_events"
    `),
    prisma.$queryRaw<TrackedSinceRow[]>(Prisma.sql`
      SELECT MIN("occurredAt") AS "trackedSince"
      FROM "site_visit_events"
    `),
    prisma.$queryRaw<TrendRow[]>(Prisma.sql`
      SELECT
        date_trunc('day', timezone('Asia/Tokyo', "occurredAt"))::date AS "day",
        COUNT(*)::int AS "pageviews",
        COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors"
      FROM "site_visit_events"
      WHERE "occurredAt" >= ${fourteenDaysAgo}
      GROUP BY 1
      ORDER BY 1 ASC
    `),
    prisma.$queryRaw<TopPageRow[]>(Prisma.sql`
      SELECT
        "pathname",
        "pageType",
        COUNT(*)::int AS "pageviews",
        COUNT(DISTINCT "visitorId")::int AS "uniqueVisitors"
      FROM "site_visit_events"
      WHERE "occurredAt" >= ${thirtyDaysAgo}
      GROUP BY 1, 2
      ORDER BY "pageviews" DESC, "pathname" ASC
      LIMIT 10
    `),
    prisma.$queryRaw<TopReferrerRow[]>(Prisma.sql`
      SELECT
        COALESCE(NULLIF("referrerHost", ''), 'direct') AS "referrerHost",
        COUNT(*)::int AS "pageviews"
      FROM "site_visit_events"
      WHERE "occurredAt" >= ${thirtyDaysAgo}
      GROUP BY 1
      ORDER BY "pageviews" DESC, "referrerHost" ASC
      LIMIT 10
    `),
    prisma.$queryRaw<TopListingRow[]>(Prisma.sql`
      SELECT
        s."listingId",
        l."managementId",
        l."addressPublic",
        COUNT(*)::int AS "pageviews"
      FROM "site_visit_events" s
      LEFT JOIN "listings" l
        ON l."id" = s."listingId"
      WHERE s."occurredAt" >= ${thirtyDaysAgo}
        AND s."listingId" IS NOT NULL
      GROUP BY 1, 2, 3
      ORDER BY "pageviews" DESC, l."managementId" ASC NULLS LAST
      LIMIT 10
    `),
    prisma.$queryRaw<CampaignRow[]>(Prisma.sql`
      SELECT
        "utmSource",
        "utmMedium",
        "utmCampaign",
        COUNT(*)::int AS "pageviews"
      FROM "site_visit_events"
      WHERE "occurredAt" >= ${thirtyDaysAgo}
        AND (
          "utmSource" IS NOT NULL
          OR "utmMedium" IS NOT NULL
          OR "utmCampaign" IS NOT NULL
        )
      GROUP BY 1, 2, 3
      ORDER BY "pageviews" DESC
      LIMIT 10
    `),
    prisma.lead.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    }),
  ])

  const summary = summaryRows[0] ?? {
    pageviews7d: 0,
    uniqueVisitors7d: 0,
    listingViews7d: 0,
    totalTrackedPageviews: 0,
  }
  const trackedSince = trackedSinceRows[0]?.trackedSince ?? null
  const hasAnalyticsData = summary.totalTrackedPageviews > 0

  const topPageMax = getMaxValue(topPages.map((row) => row.pageviews))
  const topReferrerMax = getMaxValue(topReferrers.map((row) => row.pageviews))
  const topListingMax = getMaxValue(topListings.map((row) => row.pageviews))
  const campaignMax = getMaxValue(campaignRows.map((row) => row.pageviews))
  const trendMax = getMaxValue(trendRows.map((row) => row.pageviews))

  const metricCards = [
    { title: t('cards.pageviews7d'), value: summary.pageviews7d.toLocaleString() },
    { title: t('cards.uniqueVisitors7d'), value: summary.uniqueVisitors7d.toLocaleString() },
    { title: t('cards.listingViews7d'), value: summary.listingViews7d.toLocaleString() },
    { title: t('cards.leads7d'), value: leads7d.toLocaleString() },
  ]

  const getPageTypeLabel = (pageType: string) => {
    switch (pageType) {
      case 'home':
        return t('pageTypes.home')
      case 'listing_index':
        return t('pageTypes.listingIndex')
      case 'listing_detail':
        return t('pageTypes.listingDetail')
      case 'favorites':
        return t('pageTypes.favorites')
      default:
        return t('pageTypes.other')
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {trackedSince
              ? t('trackedSince', {
                  date: toDateValue(trackedSince).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
                })
              : t('empty')}
          </p>
        </div>
        <Badge variant="secondary">
          {t('totalTrackedPageviews', { count: summary.totalTrackedPageviews.toLocaleString() })}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardDescription>{card.title}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.dailyTrend')}</CardTitle>
            <CardDescription>{t('sections.dailyTrendDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnalyticsData && trendRows.length > 0 ? (
              <div className="space-y-3">
                {trendRows.map((row) => (
                  <div key={toDateValue(row.day).toISOString()} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{formatCompactDate(row.day)}</span>
                      <span className="text-muted-foreground">
                        {t('pageviewsAndVisitors', {
                          pageviews: row.pageviews.toLocaleString(),
                          visitors: row.uniqueVisitors.toLocaleString(),
                        })}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max((row.pageviews / trendMax) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('sections.topReferrers')}</CardTitle>
            <CardDescription>{t('sections.topReferrersDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnalyticsData && topReferrers.length > 0 ? (
              <div className="space-y-3">
                {topReferrers.map((row) => (
                  <div key={row.referrerHost} className="space-y-1">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium">
                        {row.referrerHost === 'direct' ? t('direct') : row.referrerHost}
                      </span>
                      <span className="text-muted-foreground">{row.pageviews.toLocaleString()}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-emerald-500"
                        style={{ width: `${Math.max((row.pageviews / topReferrerMax) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('sections.topPages')}</CardTitle>
            <CardDescription>{t('sections.topPagesDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnalyticsData && topPages.length > 0 ? (
              <div className="space-y-4">
                {topPages.map((row) => (
                  <div key={`${row.pageType}:${row.pathname}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{getPageTypeLabel(row.pageType)}</span>
                          <Badge variant="outline">{row.pageviews.toLocaleString()} PV</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 break-all">{row.pathname}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {t('visitors', { count: row.uniqueVisitors.toLocaleString() })}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-sky-500"
                        style={{ width: `${Math.max((row.pageviews / topPageMax) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('sections.topListings')}</CardTitle>
            <CardDescription>{t('sections.topListingsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {hasAnalyticsData && topListings.length > 0 ? (
              <div className="space-y-4">
                {topListings.map((row) => (
                  <div key={row.listingId} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/preview/listings/${row.listingId}`}
                            className="font-medium hover:underline"
                          >
                            {row.managementId || row.listingId}
                          </Link>
                          <Badge variant="outline">{row.pageviews.toLocaleString()} PV</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {row.addressPublic || t('unknownListing')}
                        </p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-amber-500"
                        style={{ width: `${Math.max((row.pageviews / topListingMax) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('sections.campaigns')}</CardTitle>
          <CardDescription>{t('sections.campaignsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {hasAnalyticsData && campaignRows.length > 0 ? (
            <div className="space-y-4">
              {campaignRows.map((row, index) => {
                const source = row.utmSource || '(none)'
                const medium = row.utmMedium || '(none)'
                const campaign = row.utmCampaign || '(none)'
                return (
                  <div key={`${source}:${medium}:${campaign}:${index}`} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="font-medium">{campaign}</div>
                        <p className="text-xs text-muted-foreground">
                          {source} / {medium}
                        </p>
                      </div>
                      <Badge variant="outline">{row.pageviews.toLocaleString()} PV</Badge>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-fuchsia-500"
                        style={{ width: `${Math.max((row.pageviews / campaignMax) * 100, 6)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('noCampaigns')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
