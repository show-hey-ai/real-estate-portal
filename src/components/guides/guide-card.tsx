import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { Locale } from '@/i18n/config'
import { formatGuideDate, formatGuideReadingTime } from '@/lib/guides'
import { cn } from '@/lib/utils'

interface GuideCardArticle {
  slug: string
  publishedAt: string
  readMinutes: number
  category: string
  title: string
  excerpt: string
}

interface GuideCardProps {
  article: GuideCardArticle
  locale: Locale
  ctaLabel: string
  className?: string
}

export function GuideCard({ article, locale, ctaLabel, className }: GuideCardProps) {
  return (
    <Card className={cn('h-full border-border/70 transition-shadow hover:shadow-md', className)}>
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 font-medium">
              {article.category}
            </Badge>
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatGuideDate(article.publishedAt, locale)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" />
              {formatGuideReadingTime(article.readMinutes, locale)}
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold leading-tight tracking-tight">
              <Link href={`/guides/${article.slug}`} className="hover:text-primary transition-colors">
                {article.title}
              </Link>
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>
          </div>
        </div>

        <div className="mt-auto">
          <Link
            href={`/guides/${article.slug}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
