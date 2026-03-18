'use client'

import { useTranslations } from 'next-intl'
import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ListingWarningsProps {
  warnings: string[]
}

export function ListingWarnings({ warnings }: ListingWarningsProps) {
  const t = useTranslations('warnings')

  if (warnings.length === 0) return null

  return (
    <Card className="mt-6 border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
          {warnings.map((warning, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="shrink-0">•</span>
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
