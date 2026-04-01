'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { AdminListingSourcePreviewTrigger } from '@/components/admin/admin-listing-source-preview-trigger'
import { AdminListingPreviewButton } from '@/components/admin/admin-listing-preview-button'
import { AdminListingDeleteButton } from '@/components/admin/admin-listing-delete-button'
import { AdminListingNotes } from '@/components/admin/admin-listing-notes'
import { AdminBulkImagePreview } from '@/components/admin/admin-bulk-image-preview'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPrice } from '@/lib/format'
import { Eye, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

interface ListingMedia {
  url: string
  isAdopted: boolean
}

interface Listing {
  id: string
  managementId: string | null
  addressPublic: string | null
  propertyType: string | null
  price: number | null
  status: string
  adAllowed: boolean
  viewCount: number | null
  createdAt: string
  sourcePdfUrl: string | null
  adminNotes: string | null
  media: ListingMedia[]
}

interface AdminListingsTableProps {
  listings: Listing[]
  labels: {
    property: string
    price: string
    status: string
    viewCount: string
    createdAt: string
    actions: string
    noListings: string
    addressNotSet: string
    typeNotSet: string
    statusDraft: string
    statusInReview: string
    statusReviewed: string
    statusPublished: string
    statusArchived: string
  }
}

export function AdminListingsTable({ listings, labels }: AdminListingsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const allSelected = listings.length > 0 && selected.size === listings.length
  const someSelected = selected.size > 0 && selected.size < listings.length

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(listings.map(l => l.id)))
    }
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelected(next)
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`${selected.size}件の物件を削除しますか？この操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(`${data.deleted}件を削除しました`)
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || '削除に失敗しました')
      }
    } catch {
      toast.error('削除に失敗しました')
    }

    setSelected(new Set())
    setIsDeleting(false)
    router.refresh()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500'
      case 'IN_REVIEW': return 'bg-orange-500'
      case 'REVIEWED': return 'bg-yellow-500'
      case 'PUBLISHED': return 'bg-green-500'
      case 'ARCHIVED': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return labels.statusDraft
      case 'IN_REVIEW': return labels.statusInReview
      case 'REVIEWED': return labels.statusReviewed
      case 'PUBLISHED': return labels.statusPublished
      case 'ARCHIVED': return labels.statusArchived
      default: return status
    }
  }

  const COL_COUNT = 9

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-4 p-3 bg-muted rounded-md">
          <span className="text-sm font-medium">{selected.size}件選択中</span>
          <AdminBulkImagePreview selectedIds={Array.from(selected)} />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? '削除中...' : '選択した物件を削除'}
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>{labels.property}</TableHead>
              <TableHead>{labels.actions}</TableHead>
              <TableHead>{labels.price}</TableHead>
              <TableHead>{labels.status}</TableHead>
              <TableHead className="text-center">広告</TableHead>
              <TableHead className="text-center">{labels.viewCount}</TableHead>
              <TableHead>{labels.createdAt}</TableHead>
              <TableHead>メモ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COL_COUNT} className="text-center py-8 text-muted-foreground">
                  {labels.noListings}
                </TableCell>
              </TableRow>
            ) : (
              listings.map((listing) => (
                <TableRow key={listing.id} className={selected.has(listing.id) ? 'bg-muted/50' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={selected.has(listing.id)}
                      onCheckedChange={() => toggleOne(listing.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <AdminListingSourcePreviewTrigger
                      sourceUrl={listing.sourcePdfUrl}
                      thumbnailUrl={listing.media[0]?.url || null}
                      managementId={listing.managementId}
                      addressPublic={listing.addressPublic}
                      propertyType={listing.propertyType}
                      addressNotSetLabel={labels.addressNotSet}
                      typeNotSetLabel={labels.typeNotSet}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <AdminListingPreviewButton
                        listingId={listing.id}
                        addressPublic={listing.addressPublic}
                      />
                      <Link href={`/admin/listings/${listing.id}/review`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <AdminListingDeleteButton
                        listingId={listing.id}
                        managementId={listing.managementId}
                      />
                      {listing.status === 'PUBLISHED' && (
                        <Link href={`/listings/${listing.id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {listing.price ? formatPrice(listing.price) : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(listing.status)}>
                      {getStatusLabel(listing.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {!listing.adAllowed && (
                      <span title="広告承諾必要">
                        <ShieldAlert className="h-4 w-4 text-destructive mx-auto" />
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{listing.viewCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(listing.createdAt + "Z").toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <AdminListingNotes
                      listingId={listing.id}
                      initialNotes={listing.adminNotes}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
