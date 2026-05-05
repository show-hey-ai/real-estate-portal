'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const t = useTranslations('listing')

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const goNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % media.length)
  }, [media.length])

  const goPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + media.length) % media.length)
  }, [media.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox, goNext, goPrev])

  if (media.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
        {t('noImage')}
      </div>
    )
  }

  return (
    <div>
      {/* Main image */}
      <div
        className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden cursor-pointer group"
        onClick={() => openLightbox(selectedIndex)}
      >
        <Image
          src={media[selectedIndex].url}
          alt={`${t('property')} ${selectedIndex + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 66vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-3">
            <ZoomIn className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {/* Thumbnails */}
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
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white p-2"
            onClick={closeLightbox}
          >
            <X className="h-8 w-8" />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm">
            {selectedIndex + 1} / {media.length}
          </div>

          {/* Previous */}
          {media.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); goPrev() }}
            >
              <ChevronLeft className="h-10 w-10" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative w-[95vw] h-[90vh] cursor-pointer"
            onClick={closeLightbox}
          >
            <Image
              src={media[selectedIndex].url}
              alt={`${t('property')} ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="95vw"
              quality={85}
            />
          </div>

          {/* Next */}
          {media.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white/60 hover:text-white p-2"
              onClick={(e) => { e.stopPropagation(); goNext() }}
            >
              <ChevronRight className="h-10 w-10" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
