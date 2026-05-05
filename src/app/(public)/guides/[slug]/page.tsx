import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock3,
} from 'lucide-react'
import { JsonLd } from '@/components/common/json-ld'
import { GuideCard } from '@/components/guides/guide-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  getGuideArticleBySlug,
  getGuideArticles,
  getGuideSlugs,
} from '@/content/guides'
import {
  formatGuideDate,
  formatGuideReadingTime,
  getGuideUiCopy,
  normalizeGuideLocale,
} from '@/lib/guides'
import {
  absoluteUrl,
  getOpenGraphLocale,
  getSchemaLanguage,
} from '@/lib/site-config'

interface GuideDetailPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getGuideSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: GuideDetailPageProps): Promise<Metadata> {
  const [{ slug }, localeValue] = await Promise.all([params, getLocale()])
  const locale = normalizeGuideLocale(localeValue)
  const article = getGuideArticleBySlug(slug, locale)

  if (!article) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const url = absoluteUrl(`/guides/${slug}`)

  return {
    title: article.title,
    description: article.seoDescription,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.seoDescription,
      url,
      locale: getOpenGraphLocale(locale),
    },
    twitter: {
      title: article.title,
      description: article.seoDescription,
    },
  }
}

export default async function GuideDetailPage({
  params,
}: GuideDetailPageProps) {
  const [{ slug }, localeValue] = await Promise.all([params, getLocale()])
  const locale = normalizeGuideLocale(localeValue)
  const guideCopy = getGuideUiCopy(locale)
  const article = getGuideArticleBySlug(slug, locale)

  if (!article) {
    notFound()
  }

  const relatedArticles = getGuideArticles(locale)
    .filter((candidate) => candidate.slug !== slug)
    .slice(0, 2)
  const articleUrl = absoluteUrl(`/guides/${slug}`)

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seoDescription,
    abstract: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: getSchemaLanguage(locale),
    articleSection: article.category,
    keywords: article.tags,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    author: {
      '@type': 'Organization',
      name: 'Ziyou Hospitality',
      url: absoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      name: 'Ziyou Hospitality',
      url: absoluteUrl('/'),
    },
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: getSchemaLanguage(locale),
    mainEntity: article.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: guideCopy.homeCrumb,
        item: absoluteUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: guideCopy.navLabel,
        item: absoluteUrl('/guides'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  }

  return (
    <article className="container py-8 md:py-12">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              {guideCopy.homeCrumb}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/guides" className="hover:text-foreground transition-colors">
              {guideCopy.navLabel}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="line-clamp-1 text-foreground">{article.title}</span>
          </nav>

          <header className="space-y-5">
            <Link
              href="/guides"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              <ArrowLeft className="h-4 w-4" />
              {guideCopy.backToGuides}
            </Link>

            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                {article.category}
              </p>
              <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
                {article.title}
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {article.excerpt}
              </p>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                {article.intro}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {guideCopy.publishedLabel}: {formatGuideDate(article.publishedAt, locale)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {formatGuideReadingTime(article.readMinutes, locale)}
              </span>
              {article.updatedAt !== article.publishedAt && (
                <span>
                  {guideCopy.updatedLabel}: {formatGuideDate(article.updatedAt, locale)}
                </span>
              )}
            </div>
          </header>

          <Card className="mt-8 border-primary/15 bg-primary/5">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold">{guideCopy.keyTakeaways}</h2>
              <ul className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                {article.keyTakeaways.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="mt-10 space-y-10">
            {article.sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
                <div className="space-y-4 text-base leading-8 text-muted-foreground">
                  {section.paragraphs.map((paragraph, index) => (
                    <p key={`${section.id}-paragraph-${index}`}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="space-y-3 rounded-2xl border bg-muted/20 p-5 text-sm leading-7 text-muted-foreground">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <section id="faq" className="mt-12 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-tight">{guideCopy.faq}</h2>
            <div className="mt-5 space-y-4">
              {article.faq.map((item) => (
                <Card key={item.question}>
                  <CardContent className="space-y-3 p-6">
                    <h3 className="text-base font-semibold">{item.question}</h3>
                    <p className="text-sm leading-7 text-muted-foreground">
                      {item.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <Card className="mt-12 border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">{article.ctaTitle}</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {article.ctaDescription}
                </p>
              </div>
              <Link href="/listings">
                <Button className="group whitespace-nowrap">
                  {guideCopy.ctaButton}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {relatedArticles.length > 0 && (
            <section className="mt-12">
              <h2 className="text-2xl font-semibold tracking-tight">
                {guideCopy.relatedGuides}
              </h2>
              <div className="mt-5 grid gap-6 md:grid-cols-2">
                {relatedArticles.map((relatedArticle) => (
                  <GuideCard
                    key={relatedArticle.slug}
                    article={relatedArticle}
                    locale={locale}
                    ctaLabel={guideCopy.readArticle}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-2xl border bg-muted/20 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {guideCopy.tableOfContents}
            </h2>
            <nav className="mt-4 space-y-3 text-sm">
              {article.sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="block leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.heading}
                </a>
              ))}
              <a
                href="#faq"
                className="block leading-relaxed text-muted-foreground transition-colors hover:text-foreground"
              >
                {guideCopy.faq}
              </a>
            </nav>
          </div>
        </aside>
      </div>
    </article>
  )
}
