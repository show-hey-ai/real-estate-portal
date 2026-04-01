'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ExternalLink, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminListingSourcePreviewTriggerProps {
  sourceUrl: string | null
  thumbnailUrl: string | null
  managementId: string | null
  addressPublic: string | null
  propertyType: string | null
  addressNotSetLabel: string
  typeNotSetLabel: string
}

export function AdminListingSourcePreviewTrigger({
  sourceUrl,
  thumbnailUrl,
  managementId,
  addressPublic,
  propertyType,
  addressNotSetLabel,
  typeNotSetLabel,
}: AdminListingSourcePreviewTriggerProps) {
  const [open, setOpen] = useState(false)
  const closePreview = useCallback(() => {
    setOpen(false)
  }, [])

  const isImageSource = useMemo(() => {
    if (!sourceUrl) return false
    return /\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/i.test(sourceUrl)
  }, [sourceUrl])

  useEffect(() => {
    if (!open) return

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closePreview()
      }
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, closePreview])

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md',
        sourceUrl && 'cursor-zoom-in transition-colors hover:bg-muted/40'
      )}
    >
      <div className="w-16 h-12 bg-muted rounded overflow-hidden shrink-0">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {managementId && (
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">
              {managementId}
            </span>
          )}
          <p className="font-medium truncate">
            {addressPublic || addressNotSetLabel}
          </p>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {propertyType || typeNotSetLabel}
        </p>
      </div>
    </div>
  )

  if (!sourceUrl) {
    return content
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left"
      >
        {content}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/90"
          onClick={closePreview}
        >
          <div className="absolute top-4 left-4 flex items-center gap-4 text-sm text-white/70">
            <span>1 / 1</span>
            <span className="max-w-[40vw] truncate">
              {addressPublic || addressNotSetLabel}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={(event) => event.stopPropagation()}
            >
              Open in tab
              <ExternalLink className="h-4 w-4" />
            </a>
            <button
              type="button"
              className="text-white/80 hover:text-white p-2"
              onClick={(event) => {
                event.stopPropagation()
                closePreview()
              }}
              aria-label="Close preview"
            >
              <X className="h-8 w-8" />
            </button>
          </div>

          <div
            className="flex h-full w-full items-center justify-center"
            onClick={closePreview}
          >
            {isImageSource ? (
              <div
                className="relative h-[90vh] w-[95vw] cursor-pointer"
                onClick={closePreview}
              >
                <img
                  src={sourceUrl}
                  alt={addressPublic || addressNotSetLabel}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="h-[90vh] w-[95vw] cursor-pointer rounded-md overflow-hidden bg-white"
                onClick={closePreview}
              >
                <iframe
                  title={`Source preview for ${addressPublic || managementId || 'listing'}`}
                  src={sourceUrl}
                  className="pointer-events-none h-full w-full"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
