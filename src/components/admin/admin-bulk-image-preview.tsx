'use client'

import { useState, useCallback, useEffect } from 'react'
import { Images, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MediaItem {
  id: string
  url: string
  category: string
  sortOrder: number | null
}

interface ListingMedia {
  id: string
  managementId: string | null
  addressPublic: string | null
  sourcePdfUrl: string | null
  media: MediaItem[]
}

interface AdminBulkImagePreviewProps {
  selectedIds: string[]
}

export function AdminBulkImagePreview({ selectedIds }: AdminBulkImagePreviewProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ListingMedia[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/listings/bulk-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      })
      if (res.ok) {
        const json = await res.json()
        const listings = json.listings as ListingMedia[]
        setData(listings)
        setCurrentIndex(0)
      }
    } catch {
      // ignore
    }
    setLoading(false)
  }, [selectedIds])

  const handleOpen = () => {
    setOpen(true)
    setData([])
    void loadMedia()
  }

  const handleClose = useCallback(() => {
    setOpen(false)
  }, [])

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(data.length - 1, prev + 1))
  }, [data.length])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
      if (e.key === 'ArrowLeft') goToPrev()
      if (e.key === 'ArrowRight') goToNext()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, handleClose, goToPrev, goToNext])

  const getLabel = (item: ListingMedia) => {
    const parts: string[] = []
    if (item.managementId) parts.push(item.managementId)
    if (item.addressPublic) parts.push(item.addressPublic)
    return parts.join('  ') || item.id.slice(0, 8)
  }

  const currentListing = data[currentIndex]
  const sourceUrl = currentListing?.sourcePdfUrl || currentListing?.media[0]?.url || ''

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Images className="mr-2 h-4 w-4" />
        画像一覧
      </Button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/95 whitespace-normal flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70">
                画像一覧（{data.length}件）
              </span>
              {currentListing && (
                <span className="text-sm text-white font-medium">
                  {currentIndex + 1} / {data.length}　{getLabel(currentListing)}
                </span>
              )}
            </div>
            <button
              type="button"
              className="p-2 text-white/80 hover:text-white"
              onClick={handleClose}
              aria-label="閉じる"
            >
              <X className="h-7 w-7" />
            </button>
          </div>

          {/* Listing tabs */}
          {data.length > 0 && (
            <div className="flex gap-1 px-4 pb-2 shrink-0 overflow-x-auto">
              {data.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  className={`text-xs px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                    idx === currentIndex
                      ? 'bg-white text-black font-medium'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }`}
                  onClick={() => setCurrentIndex(idx)}
                >
                  {getLabel(item)}
                </button>
              ))}
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 relative min-h-0">
            {loading ? (
              <div className="flex h-full items-center justify-center gap-3 text-white/70">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>読み込み中...</span>
              </div>
            ) : data.length === 0 ? (
              <div className="flex h-full items-center justify-center text-white/70">
                画像がありません
              </div>
            ) : !sourceUrl ? (
              <div className="flex h-full items-center justify-center text-white/70">
                この物件にはソース画像がありません
              </div>
            ) : (
              <>
                {/* PDF/Image viewer - full width */}
                <div className="h-full w-full px-16">
                  <iframe
                    key={sourceUrl}
                    title={`Source: ${getLabel(currentListing)}`}
                    src={sourceUrl}
                    className="h-full w-full rounded-md bg-white"
                  />
                </div>

                {/* Left navigation button */}
                {currentIndex > 0 && (
                  <button
                    type="button"
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    onClick={goToPrev}
                    title="前の物件"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </button>
                )}

                {/* Right navigation button */}
                {currentIndex < data.length - 1 && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    onClick={goToNext}
                    title="次の物件"
                  >
                    <ChevronRight className="h-8 w-8" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
