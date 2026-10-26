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

function post(url: string, body: string) {
  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }))
    return
  }

  void fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
    keepalive: true,
  })
}

// Real use of the page. Simple bots open a page and leave without any of these.
const ENGAGEMENT_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'wheel', 'scroll'] as const
// Scrolling the browser does by itself on load (restoring a position, jumping to #anchor) is ignored.
const SCROLL_GRACE_MS = 1000

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

    post('/api/analytics/page-view', JSON.stringify({
      visitorId: getOrCreateVisitorId(),
      pathname,
      search: queryString ? `?${queryString}` : '',
      locale: document.documentElement.lang || null,
      referrer: document.referrer || null,
    }))
  }, [pathname, searchParams])

  useEffect(() => {
    if (!pathname) return
    const startedAt = Date.now()
    const onUse = (event: Event) => {
      if (event.type === 'scroll' && Date.now() - startedAt < SCROLL_GRACE_MS) return
      stop()
      post('/api/analytics/engaged', JSON.stringify({ visitorId: getOrCreateVisitorId(), pathname }))
    }
    const stop = () => ENGAGEMENT_EVENTS.forEach((type) => window.removeEventListener(type, onUse))
    ENGAGEMENT_EVENTS.forEach((type) => window.addEventListener(type, onUse, { passive: true }))
    return stop
  }, [pathname])

  return null
}
