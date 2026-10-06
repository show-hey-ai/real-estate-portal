import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminUserFromSession } from '@/lib/admin-auth'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AdminListingsTable } from '@/components/admin/admin-listings-table'
import { FileUp, Search } from 'lucide-react'

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; inventory?: string }>
}) {
  const t = await getTranslations('admin')
  if (!await getAdminUserFromSession()) notFound()
  const supabase = createServiceClient()
  const { q, inventory: requestedInventory } = await searchParams
  const inventory = ['advertisable', 'private', 'consent'].includes(requestedInventory || '') ? requestedInventory! : 'all'

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

  if (inventory === 'advertisable') query = query.eq('adAllowed', true).eq('adConsentRequired', false)
  if (inventory === 'private') query = query.eq('adAllowed', false).eq('adConsentRequired', false)
  if (inventory === 'consent') query = query.eq('adConsentRequired', true)

  const safeKeyword = q?.replace(/[^\p{L}\p{N}\s\-]/gu, '').trim().slice(0, 80)
  if (safeKeyword) {
    query = query.or(`managementId.ilike.%${safeKeyword}%,addressPublic.ilike.%${safeKeyword}%,addressPrivate.ilike.%${safeKeyword}%`)
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

      <nav aria-label="広告・公開区分" className="mb-4 flex flex-wrap gap-2">
        {[['all', 'すべて'], ['advertisable', '広告可・掲載候補'], ['private', '非公開・預かり'], ['consent', '承諾・確認待ち']].map(([value, label]) => (
          <Link key={value} href={`/admin/listings?inventory=${value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}>
            <Button variant={inventory === value ? 'default' : 'outline'}>{label}</Button>
          </Link>
        ))}
      </nav>
      <p className="mb-4 text-sm text-muted-foreground">広告可の物件は許可範囲内の住所を最後まで掲載できます。広告不可・未確認の預かり物件は非公開で管理し、承諾待ちは別区分に保留します。</p>
      <form className="mb-4 flex gap-2" action="/admin/listings" method="GET">
        <input type="hidden" name="inventory" value={inventory} />
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
