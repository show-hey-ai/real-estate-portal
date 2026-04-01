import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminListingsTable } from '@/components/admin/admin-listings-table'
import { FileUp, Search } from 'lucide-react'

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const t = await getTranslations('admin')
  const supabase = await createClient()
  const { q } = await searchParams

  let query = supabase
    .from('listings')
    .select(`
      *,
      media (
        url,
        isAdopted
      )
    `)
    .order('createdAt', { ascending: false })

  if (q) {
    query = query.or(`managementId.ilike.%${q}%,addressPublic.ilike.%${q}%,addressPrivate.ilike.%${q}%`)
  }

  const { data: listingsData, error } = await query

  if (error) {
    console.error('Error fetching listings:', error)
  }

  const listings = (listingsData || []).map(l => ({
    ...l,
    media: Array.isArray(l.media)
      ? l.media.filter((m: { isAdopted: boolean }) => m.isAdopted).slice(0, 1)
      : []
  }))

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

      <form className="mb-4 flex gap-2" action="/admin/listings" method="GET">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="管理番号・住所で検索 (例: TP-0047)"
            defaultValue={q || ''}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">検索</Button>
        {q && (
          <Link href="/admin/listings">
            <Button variant="ghost">クリア</Button>
          </Link>
        )}
      </form>

      <AdminListingsTable
        listings={listings}
        labels={{
          property: t('table.property'),
          price: t('table.price'),
          status: t('table.status'),
          viewCount: t('table.viewCount'),
          createdAt: t('table.createdAt'),
          actions: t('table.actions'),
          noListings: t('noListings'),
          addressNotSet: t('addressNotSet'),
          typeNotSet: t('typeNotSet'),
          statusDraft: t('listingStatus.draft'),
          statusInReview: t('listingStatus.inReview'),
          statusReviewed: t('listingStatus.reviewed'),
          statusPublished: t('listingStatus.published'),
          statusArchived: t('listingStatus.archived'),
        }}
      />
    </div>
  )
}
