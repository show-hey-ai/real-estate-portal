'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface FavoriteIconButtonProps {
  listingId: string
  initialFavorite: boolean
  userId: string | null
  className?: string
}

export function FavoriteIconButton({
  listingId,
  initialFavorite,
  userId,
  className,
}: FavoriteIconButtonProps) {
  const t = useTranslations('listing')
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!userId) {
      router.push(`/login?redirect=/listings/${listingId}`)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })

      if (!res.ok) throw new Error()

      setIsFavorite(!isFavorite)
      router.refresh()
    } catch {
      toast.error(t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={isLoading}
      className={className}
    >
      <Heart
        className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
      />
    </Button>
  )
}
