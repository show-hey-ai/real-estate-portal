'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { FileText, ExternalLink, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminListingPreviewContent } from '@/components/admin/admin-listing-preview-content'

interface AdminListingPreviewButtonProps {
  listingId: string
  addressPublic: string | null
}

interface PreviewResponse {
  listing: {
    id: string
    price: string | number | null
    addressPublic: string | null
    propertyType: string | null
    builtYear: number | null
    builtMonth: number | null
    structure: string | null
    floorCount: number | null
    landArea: string | number | null
    buildingArea: string | number | null
    zoning: string | null
    currentStatus: string | null
    yieldGross: string | number | null
    yieldNet: string | number | null
    warnings: string[] | null
    stations: Array<{
      name: string
      name_en?: string | null
      line?: string | null
      line_en?: string | null
      walk_minutes?: number | null
    }> | null
    features: string[] | null
    featuresEn?: string[] | null
    featuresZhTw?: string[] | null
    featuresZhCn?: string[] | null
    descriptionJa?: string | null
    descriptionEn?: string | null
    descriptionZhTw?: string | null
    descriptionZhCn?: string | null
    media: Array<{
      id: string
      url: string
      category: string
      sortOrder?: number | null
      isAdopted?: boolean | null
    }>
  }
}

const NON_CLOSING_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'option',
  'label',
  'iframe',
  '[role="button"]',
  '[data-preview-interactive]',
].join(', ')

export function AdminListingPreviewButton({
  listingId,
  addressPublic,
}: AdminListingPreviewButtonProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<PreviewResponse['listing'] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const previewUrl = `/preview/listings/${listingId}`
  const closePreview = useCallback(() => {
    setOpen(false)
  }, [])

  const loadPreview = useCallback(async () => {
    if (preview || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/listings/${listingId}/preview`)
      if (!response.ok) {
        throw new Error('Failed to load preview')
      }

      const data: PreviewResponse = await response.json()
      setPreview(data.listing)
    } catch {
      setError('Preview could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [listingId, loading, preview])

  const openPreview = useCallback(() => {
    setOpen(true)
    void loadPreview()
  }, [loadPreview])

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

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openPreview}
        onMouseEnter={() => {
          void loadPreview()
        }}
        title="Customer preview"
      >
        <FileText className="h-4 w-4" />
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 whitespace-normal"
          onClick={closePreview}
        >
          <div className="absolute top-4 left-4 text-sm text-white/70">
            Customer Preview
          </div>

          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            <a
              href={previewUrl}
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
              className="p-2 text-white/80 hover:text-white"
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
            <div
              className="h-[90vh] w-[95vw] overflow-hidden rounded-md bg-white shadow-2xl"
              onClick={(event) => {
                event.stopPropagation()

                const target = event.target as HTMLElement
                if (target.closest(NON_CLOSING_SELECTOR)) {
                  return
                }

                closePreview()
              }}
            >
              {loading && !preview ? (
                <div className="flex h-full w-full items-center justify-center gap-3 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading preview...</span>
                </div>
              ) : error ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-muted-foreground">
                  <p>{error}</p>
                  <Button variant="outline" size="sm" onClick={() => void loadPreview()}>
                    Retry
                  </Button>
                </div>
              ) : preview ? (
                <div className="h-full overflow-y-auto">
                  <AdminListingPreviewContent listing={preview} />
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
