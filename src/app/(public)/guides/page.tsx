import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale } from 'next-intl/server'
import { ArrowRight, Globe2, LineChart, Search } from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { GuideCard } from '@/components/guides/guide-card'
import { Button } from '@/components/ui/button'
import { getGuideArticles } from '@/content/guides'
import { getGuideUiCopy, normalizeGuideLocale } from '@/lib/guides'
import {
  absoluteUrl,
  getOpenGraphLocale,
  getSchemaLanguage,
} from '@/lib/site-config'

const highlightIcons = [Search, LineChart, Globe2] as const

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeGuideLocale(await getLocale())
  const guideCopy = getGuideUiCopy(locale)

  return {
    title: guideCopy.indexTitle,
    description: guideCopy.indexDescription,
    alternates: {
      canonical: absoluteUrl('/guides'),
    },
    openGraph: {
      title: guideCopy.indexTitle,
      description: guideCopy.indexDescription,
      url: absoluteUrl('/guides'),
      type: 'website',
      locale: getOpenGraphLocale(locale),
    },
    twitter: {
      title: guideCopy.indexTitle,
      description: guideCopy.indexDescription,
    },
  }
}

export default async function GuidesPage() {
  const locale = normalizeGuideLocale(await getLocale())
  const guideCopy = getGuideUiCopy(locale)
  const articles = getGuideArticles(locale)

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: guideCopy.indexTitle,
    description: guideCopy.indexDescription,
    url: absoluteUrl('/guides'),
    inLanguage: getSchemaLanguage(locale),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: articles.length,
      itemListElement: articles.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/guides/${article.slug}`),
        name: article.title,
        description: article.seoDescription,
      })),
    },
  }

  return (
    <div className="container py-8 md:py-12">
      <JsonLd data={collectionJsonLd} />

      <section className="rounded-3xl border bg-muted/30 p-6 md:p-10">
        <div className="max-w-3xl space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
              {guideCopy.navLabel}
            </p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {guideCopy.indexTitle}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground md:text-lg">
              {guideCopy.indexDescription}
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {guideCopy.indexLead}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {guideCopy.indexPoints.map((point, index) => {
              const Icon = highlightIcons[index] || Search

              return (
                <div
                  key={point}
                  className="rounded-2xl border bg-background/80 p-4 shadow-sm"
                >
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <p className="text-sm font-medium leading-relaxed">{point}</p>
                </div>
              )
            })}
          </div>

          <Link href="/listings">
            <Button className="group">
              {guideCopy.browseListings}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="mt-10 md:mt-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {articles.map((article) => (
            <GuideCard
              key={article.slug}
              article={article}
              locale={locale}
              ctaLabel={guideCopy.readArticle}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
