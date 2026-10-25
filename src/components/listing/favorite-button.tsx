'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useFavorite } from '@/components/member/use-favorite'

interface FavoriteButtonProps {
  listingId: string
  initialFavorite: boolean
  userId: string | null
}

export function FavoriteButton({ listingId, initialFavorite, userId }: FavoriteButtonProps) {
  const t = useTranslations('listing')
  const { isFavorite, busy, toggle } = useFavorite(listingId, userId, initialFavorite)

  const handleToggle = async () => {
    const result = await toggle()
    if (!result.ok) toast.error(t('error'))
    else if (result.hint) toast.success(result.hint)
  }

  return (
    <Button
      variant="outline"
      size="lg"
      onClick={handleToggle}
      disabled={busy}
      aria-pressed={isFavorite}
      className="gap-2"
    >
      <Heart className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
      {isFavorite ? t('removeFavorite') : t('addFavorite')}
    </Button>
  )
}
