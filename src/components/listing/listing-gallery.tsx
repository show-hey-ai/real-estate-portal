'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react'

interface Media {
  id: string
  url: string
  category: string
}

interface ListingGalleryProps {
  media: Media[]
  /** Building name or heading, used in alt text. */
  title?: string
}

const copy = {
  ja: { prev: '前の写真', next: '次の写真', open: '写真を拡大', close: '閉じる', dialog: '物件写真', categories: { EXTERIOR: '外観', INTERIOR: '室内', FLOORPLAN: '間取り図', MAP: '地図', OTHER: '写真' } },
  en: { prev: 'Previous photo', next: 'Next photo', open: 'Enlarge photo', close: 'Close', dialog: 'Property photos', categories: { EXTERIOR: 'Exterior', INTERIOR: 'Interior', FLOORPLAN: 'Floor plan', MAP: 'Map', OTHER: 'Photo' } },
  'zh-TW': { prev: '上一張', next: '下一張', open: '放大照片', close: '關閉', dialog: '物件照片', categories: { EXTERIOR: '外觀', INTERIOR: '室內', FLOORPLAN: '格局圖', MAP: '地圖', OTHER: '照片' } },
  'zh-CN': { prev: '上一张', next: '下一张', open: '放大照片', close: '关闭', dialog: '房源照片', categories: { EXTERIOR: '外观', INTERIOR: '室内', FLOORPLAN: '户型图', MAP: '地图', OTHER: '照片' } },
} as const

const SWIPE_THRESHOLD_PX = 40

/** Floor plans are drawings: show them whole on white instead of cropping. */
function fitClass(category: string, padded: string) {
  return category === 'FLOORPLAN' ? `bg-white object-contain ${padded}` : 'object-cover'
}

export function ListingGallery({ media, title }: ListingGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStart = useRef<number | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const t = useTranslations('listing')
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const label = (item: Media) => text.categories[item.category as keyof typeof text.categories] ?? text.categories.OTHER
  const altFor = (item: Media, index: number) => `${title || t('property')} ${label(item)} ${index + 1}/${media.length}`

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])
  const goNext = useCallback(() => setSelectedIndex((prev) => (prev + 1) % media.length), [media.length])
  const goPrev = useCallback(() => setSelectedIndex((prev) => (prev - 1 + media.length) % media.length), [media.length])

  const swipeHandlers = {
    onTouchStart: (event: React.TouchEvent) => { touchStart.current = event.touches[0].clientX },
    onTouchEnd: (event: React.TouchEvent) => {
      if (touchStart.current === null || media.length < 2) return
      const delta = event.changedTouches[0].clientX - touchStart.current
      touchStart.current = null
      if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return
      if (delta < 0) goNext()
      else goPrev()
    },
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen, closeLightbox, goNext, goPrev])

  if (media.length === 0) {
    return (
      <div className="aspect-[16/9] bg-muted rounded-lg flex items-center justify-center text-[#536274]">
        {t('noImage')}
      </div>
    )
  }

  const current = media[selectedIndex]
  const arrow = 'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1b293a] shadow-md transition hover:bg-white'

  return (
    <div data-testid="listing-gallery">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted" {...swipeHandlers}>
        <button type="button" className="group absolute inset-0 cursor-zoom-in" onClick={() => setLightboxOpen(true)} aria-label={`${text.open}: ${altFor(current, selectedIndex)}`}>
          <Image src={current.url} alt={altFor(current, selectedIndex)} fill sizes="(max-width: 1024px) 100vw, 66vw" className={fitClass(current.category, 'p-4')} priority />
          <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white opacity-90 group-hover:opacity-100"><Expand aria-hidden="true" className="h-3.5 w-3.5" />{text.open}</span>
        </button>
        <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">{label(current)} · {selectedIndex + 1} / {media.length}</span>
        {media.length > 1 && <>
          <button type="button" className={cn(arrow, 'left-3')} onClick={goPrev} aria-label={text.prev}><ChevronLeft aria-hidden="true" className="h-6 w-6" /></button>
          <button type="button" className={cn(arrow, 'right-3')} onClick={goNext} aria-label={text.next}><ChevronRight aria-hidden="true" className="h-6 w-6" /></button>
        </>}
      </div>

      {media.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {media.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={altFor(item, index)}
              aria-current={selectedIndex === index ? 'true' : undefined}
              className={cn('relative h-20 w-20 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-2', selectedIndex === index ? 'ring-primary' : 'ring-transparent hover:ring-muted-foreground')}
            >
              <Image src={item.url} alt="" fill sizes="80px" className={fitClass(item.category, 'p-1')} />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && (
        <div role="dialog" aria-modal="true" aria-label={text.dialog} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={closeLightbox} {...swipeHandlers}>
          <button ref={closeButton} type="button" className="absolute right-4 top-4 z-10 p-2 text-white/80 hover:text-white" onClick={closeLightbox} aria-label={text.close}>
            <X aria-hidden="true" className="h-8 w-8" />
          </button>
          <div className="absolute left-4 top-4 text-sm text-white/80" aria-live="polite">{label(current)} · {selectedIndex + 1} / {media.length}</div>
          {media.length > 1 && (
            <button type="button" className="absolute left-4 top-1/2 z-10 -translate-y-1/2 p-2 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); goPrev() }} aria-label={text.prev}>
              <ChevronLeft aria-hidden="true" className="h-10 w-10" />
            </button>
          )}
          <div className="relative h-[90vh] w-[95vw]">
            <Image src={current.url} alt={altFor(current, selectedIndex)} fill className={current.category === 'FLOORPLAN' ? 'bg-white object-contain p-4' : 'object-contain'} sizes="95vw" quality={85} />
          </div>
          {media.length > 1 && (
            <button type="button" className="absolute right-4 top-1/2 z-10 -translate-y-1/2 p-2 text-white/70 hover:text-white" onClick={(e) => { e.stopPropagation(); goNext() }} aria-label={text.next}>
              <ChevronRight aria-hidden="true" className="h-10 w-10" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
