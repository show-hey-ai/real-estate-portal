'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface Media {
  id: string
  url: string
  category: string
}

interface ListingGalleryProps {
  media: Media[]
}

export function ListingGallery({ media }: ListingGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const t = useTranslations('listing')

  if (media.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        {t('noImage')}
      </div>
    )
  }

  return (
    <div>
      <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
        <Image
          src={media[selectedIndex].url}
          alt={`${t('property')} ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority
        />
      </div>

      {media.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative w-20 h-20 rounded-md overflow-hidden shrink-0 ring-2 ring-offset-2',
                selectedIndex === index
                  ? 'ring-primary'
                  : 'ring-transparent hover:ring-muted-foreground'
              )}
            >
              <Image
                src={item.url}
                alt={`${t('property')} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
