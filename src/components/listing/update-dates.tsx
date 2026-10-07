import { CalendarClock } from 'lucide-react'
import type { ListingUpdateDates as Dates } from '@/lib/freshness'

const copy: Record<string, { updated: string; next: string; dateLocale: string }> = {
  ja: { updated: '情報更新日', next: '次回更新予定日', dateLocale: 'ja-JP' },
  en: { updated: 'Information updated', next: 'Next update by', dateLocale: 'en-GB' },
  'zh-TW': { updated: '資訊更新日', next: '下次更新預定日', dateLocale: 'zh-TW' },
  'zh-CN': { updated: '信息更新日', next: '下次更新预定日', dateLocale: 'zh-CN' },
}

interface ListingUpdateDatesProps {
  dates: Dates
  locale: string
}

/** 情報更新日・次回更新予定日 (shown on every listing; dates in Tokyo time). */
export function ListingUpdateDates({ dates, locale }: ListingUpdateDatesProps) {
  const text = copy[locale] ?? copy.en
  const format = (date: Date) => date.toLocaleDateString(text.dateLocale, { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'short', day: 'numeric' })
  return <p className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#536274]" data-testid="listing-update-dates">
    <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
    <span>{text.updated} <time dateTime={dates.updatedOn.toISOString()}>{format(dates.updatedOn)}</time></span>
    {dates.nextUpdateOn && <span>{text.next} <time dateTime={dates.nextUpdateOn.toISOString()}>{format(dates.nextUpdateOn)}</time></span>}
  </p>
}
