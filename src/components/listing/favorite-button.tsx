'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'

interface FavoriteButtonProps {
  listingId: string
  initialFavorite: boolean
  userId: string | null
}

export function FavoriteButton({ listingId, initialFavorite, userId }: FavoriteButtonProps) {
  const t = useTranslations('listing')
  const router = useRouter()
  const [isFavorite, setIsFavorite] = useState(initialFavorite)
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async () => {
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
      toast.success(isFavorite ? t('removeFavorite') : t('addFavorite'))
    } catch {
      toast.error(t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleToggle}
      disabled={isLoading}
      className="gap-2"
    >
      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
      {isFavorite ? t('removeFavorite') : t('addFavorite')}
    </Button>
  )
}
