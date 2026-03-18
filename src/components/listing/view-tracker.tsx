'use client'

import { useEffect, useRef } from 'react'

interface ViewTrackerProps {
  listingId: string
}

export function ViewTracker({ listingId }: ViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return
    tracked.current = true

    // Check sessionStorage to avoid counting multiple views in the same session
    const viewedKey = `viewed_${listingId}`
    const alreadyViewed = sessionStorage.getItem(viewedKey)

    if (alreadyViewed) return

    // Record the view
    fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
    }).catch((error) => {
      console.error('Failed to track view:', error)
    })

    // Mark as viewed in this session
    sessionStorage.setItem(viewedKey, 'true')
  }, [listingId])

  return null
}
