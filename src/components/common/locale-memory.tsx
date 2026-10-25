'use client'

import { useEffect } from 'react'
import { locales } from '@/i18n/config'

const MAX_AGE = 60 * 60 * 24 * 365

/**
 * Remembers the language of a ?lang= URL for later visits. Set in the browser rather than by the
 * server so the page itself carries no Set-Cookie and can be cached at the CDN.
 */
export function LocaleMemory() {
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('lang')
    if (!requested || !(locales as readonly string[]).includes(requested)) return
    if (document.cookie.split('; ').includes(`locale=${requested}`)) return
    document.cookie = `locale=${requested};path=/;max-age=${MAX_AGE};samesite=lax`
  }, [])
  return null
}
