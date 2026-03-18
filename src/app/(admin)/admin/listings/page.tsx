import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatPrice } from '@/lib/format'
import { Eye, Pencil, FileUp, FileText } from 'lucide-react'

export default async function AdminListingsPage() {
  const t = await getTranslations('admin')
  const supabase = await createClient()

  const { data: listingsData, error } = await supabase
    .from('listings')
    .select(`
      *,
      media (
        url,
        isAdopted
      )
    `)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching listings:', error)
  }

  const listings = (listingsData || []).map(l => ({
    ...l,
    media: Array.isArray(l.media)
      ? l.media.filter((m: { isAdopted: boolean }) => m.isAdopted).slice(0, 1)
      : []
  }))

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500'
      case 'REVIEWED':
        return 'bg-yellow-500'
      case 'PUBLISHED':
        return 'bg-green-500'
      case 'ARCHIVED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return t('listingStatus.draft')
      case 'REVIEWED':
        return t('listingStatus.reviewed')
      case 'PUBLISHED':
        return t('listingStatus.published')
      case 'ARCHIVED':
        return t('listingStatus.archived')
      default:
        return status
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t('listings')}</h1>
        <Link href="/admin/import">
          <Button>
            <FileUp className="mr-2 h-4 w-4" />
            {t('importButton')}
          </Button>
        </Link>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.property')}</TableHead>
              <TableHead>{t('table.price')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              <TableHead className="text-center">{t('table.viewCount')}</TableHead>
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead className="text-right">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('noListings')}
                </TableCell>
              </TableRow>
            ) : (
              listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-12 bg-muted rounded overflow-hidden">
                        {listing.media[0] && (
                          <img
                            src={listing.media[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{listing.addressPublic || t('addressNotSet')}</p>
                        <p className="text-sm text-muted-foreground">
                          {listing.propertyType || t('typeNotSet')}
                        </p>
                      </div>
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
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{listing.viewCount || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(listing.createdAt).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-8">
                        {listing.sourcePdfUrl && (
                          <a href={listing.sourcePdfUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" title="PDF">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                      <div className="w-8">
                        <Link href={`/admin/listings/${listing.id}/review`}>
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="w-8">
                        {listing.status === 'PUBLISHED' && (
                          <Link href={`/listings/${listing.id}`} target="_blank">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
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
