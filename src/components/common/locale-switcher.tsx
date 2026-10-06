'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: string) => {
    startTransition(() => {
      document.cookie = `locale=${newLocale};path=/;max-age=31536000`
      // Drop a ?lang= from a search-result URL so the newly chosen language applies.
      const url = new URL(window.location.href)
      url.searchParams.delete('lang')
      window.location.replace(url.toString())
    })
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange} disabled={isPending}>
      <SelectTrigger className="w-[130px]" aria-label="Language / 言語 / 語言">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {localeNames[loc as Locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
