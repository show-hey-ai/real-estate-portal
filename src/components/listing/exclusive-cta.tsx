'use client'

import { useTranslations } from 'next-intl'
import { Camera, Lock, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ExclusiveCtaProps {
  listingId: string
  userId: string | null
}

export function ExclusiveCta({ listingId, userId }: ExclusiveCtaProps) {
  const t = useTranslations('listing')

  const handleRequestPhotos = () => {
    const msgEl = document.querySelector('textarea')
    if (msgEl) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype, 'value'
      )?.set
      if (nativeSetter) {
        nativeSetter.call(msgEl, t('morePhotosMessage'))
        msgEl.dispatchEvent(new Event('input', { bubbles: true }))
      }
      msgEl.focus()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardContent className="pt-5 pb-4 space-y-3">
        <div className="flex items-center gap-2">
          <Camera className="h-5 w-5 text-primary" />
          <p className="font-semibold text-sm">{t('morePhotosTitle')}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('morePhotosDesc')}
        </p>
        <div className="border-t pt-3 mt-2">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <p className="font-semibold text-sm">{t('exclusiveTitle')}</p>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {t('exclusiveDesc')}
          </p>
        </div>
        {!userId ? (
          <Link href={`/register?redirect=/listings/${listingId}`}>
            <Button variant="outline" size="sm" className="w-full mt-2 group">
              {t('registerForMore')}
              <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={handleRequestPhotos}
          >
            <Camera className="mr-1 h-3 w-3" />
            {t('requestPhotos')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
