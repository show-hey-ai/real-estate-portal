'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ANALYTICS_VISITOR_COOKIE } from '@/lib/site-analytics'

function readCookie(name: string) {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : null
}

function createVisitorId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getOrCreateVisitorId() {
  const existing = readCookie(ANALYTICS_VISITOR_COOKIE)
  if (existing) return existing

  const nextValue = createVisitorId()
  const maxAge = 60 * 60 * 24 * 30
  document.cookie = `${ANALYTICS_VISITOR_COOKIE}=${encodeURIComponent(nextValue)}; path=/; max-age=${maxAge}; samesite=lax`
  return nextValue
}

export function PublicPageviewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastTrackedRef = useRef<string>('')

  useEffect(() => {
    if (!pathname) return

    const queryString = searchParams.toString()
    const signature = `${pathname}?${queryString}`
    if (lastTrackedRef.current === signature) return
    lastTrackedRef.current = signature

    const body = JSON.stringify({
      visitorId: getOrCreateVisitorId(),
      pathname,
      search: queryString ? `?${queryString}` : '',
      locale: document.documentElement.lang || null,
      referrer: document.referrer || null,
    })

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/page-view', blob)
      return
    }

    void fetch('/api/analytics/page-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
      keepalive: true,
    })
  }, [pathname, searchParams])

  return null
}
