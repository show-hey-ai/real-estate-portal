'use client'

import { useSyncExternalStore, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Globe2, X } from 'lucide-react'

type SiteLocale = 'ja' | 'en' | 'zh-TW' | 'zh-CN'

const LABELS: Record<SiteLocale, { prompt: string; action: string; dismiss: string }> = {
  ja: { prompt: 'このページは日本語でもご覧いただけます。', action: '日本語で見る', dismiss: '閉じる' },
  en: { prompt: 'This page is also available in English.', action: 'View in English', dismiss: 'Close' },
  'zh-TW': { prompt: '本頁面提供繁體中文版。', action: '切換為繁體中文', dismiss: '關閉' },
  'zh-CN': { prompt: '本页面提供简体中文版。', action: '切换为简体中文', dismiss: '关闭' },
}

const DISMISS_KEY = 'language-suggestion-dismissed'

/** Maps the browser's preferred language to a site language; Hong Kong and Macau read Traditional Chinese. */
export function suggestedLocale(languages: readonly string[]): SiteLocale {
  const first = (languages[0] || 'en').toLowerCase()
  if (first.startsWith('ja')) return 'ja'
  if (first.startsWith('zh')) return /zh-(tw|hk|mo|hant)/.test(first) ? 'zh-TW' : 'zh-CN'
  return 'en'
}

function hasChosenLanguage(): boolean {
  if (/(?:^|;\s*)locale=/.test(document.cookie)) return true
  try {
    return localStorage.getItem(DISMISS_KEY) === '1'
  } catch {
    return false
  }
}

const noop = () => () => undefined

/**
 * Offers the visitor's browser language when it differs from the page's. The page itself never
 * changes by browser language, so every URL keeps one language for search engines.
 */
export function LanguageSuggestion() {
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [dismissed, setDismissed] = useState(false)
  // Read browser-only state after hydration; the server always renders nothing.
  const target = useSyncExternalStore(noop, () => (hasChosenLanguage() ? null : suggestedLocale(navigator.languages ?? [navigator.language])), () => null)
  if (dismissed || !target || target === locale || searchParams.has('lang')) return null
  const text = LABELS[target]
  const params = new URLSearchParams(searchParams.toString())
  params.set('lang', target)
  const close = () => {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* private mode */ }
    setDismissed(true)
  }
  return <div className="border-b border-[#dbe2e9] bg-[#f4f7fb]" lang={target} data-testid="language-suggestion">
    <div className="container flex items-center justify-between gap-3 py-2 text-sm">
      <p className="flex items-center gap-2 text-[#3d4a5a]"><Globe2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[#274d7d]" />{text.prompt}</p>
      <div className="flex shrink-0 items-center gap-1">
        <a href={`${pathname}?${params.toString()}`} className="inline-flex min-h-9 items-center rounded-md bg-[#274d7d] px-3 text-sm font-semibold text-white hover:bg-[#18375f]">{text.action}</a>
        <button type="button" onClick={close} aria-label={text.dismiss} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[#536274] hover:bg-white"><X aria-hidden="true" className="h-4 w-4" /></button>
      </div>
    </div>
  </div>
}
