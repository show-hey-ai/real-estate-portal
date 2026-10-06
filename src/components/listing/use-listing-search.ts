'use client'

import { useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { canonicalSearchQuery } from '@/lib/listing-search'

export function useListingSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  function navigate(query: string) {
    const clean = canonicalSearchQuery(new URLSearchParams(query))
    startTransition(() =>
      router.push(clean ? `/listings?${clean}` : '/listings', { scroll: false })
    )
  }
  function update(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    if ('ward' in updates) params.delete('prefecture')
    navigate(params.toString())
  }
  return { searchParams, isPending, navigate, update }
}
