'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from 'sonner'
import { useFavorite } from '@/components/member/use-favorite'

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
  const { isFavorite, busy, toggle } = useFavorite(listingId, userId, initialFavorite)

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const result = await toggle()
    if (!result.ok) toast.error(t('error'))
    else if (result.hint) toast.success(result.hint)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={busy}
      aria-label={isFavorite ? t('removeFavorite') : t('addFavorite')}
      aria-pressed={isFavorite}
      className={className}
    >
      <Heart
        aria-hidden="true"
        className={`h-5 w-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
      />
    </Button>
  )
}
