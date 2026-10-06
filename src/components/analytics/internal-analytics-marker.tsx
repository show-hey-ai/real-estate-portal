'use client'

import { useEffect } from 'react'

export function InternalAnalyticsMarker() {
  useEffect(() => {
    // Only rendered after the server has verified the administrator role.
    void fetch('/api/admin/analytics/exclude', { method: 'POST' }).catch(() => {})
  }, [])
  return null
}
