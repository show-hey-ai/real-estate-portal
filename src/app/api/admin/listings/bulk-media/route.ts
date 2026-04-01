import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserFromSession } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const admin = await getAdminUserFromSession()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { ids } = (await req.json()) as { ids: string[] }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids required' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: listings, error } = await supabase
    .from('listings')
    .select(`
      id,
      managementId,
      addressPublic,
      sourcePdfUrl,
      media (
        id,
        url,
        category,
        sortOrder,
        isAdopted
      )
    `)
    .in('id', ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (listings || []).map((listing) => ({
    id: listing.id,
    managementId: listing.managementId,
    addressPublic: listing.addressPublic,
    sourcePdfUrl: listing.sourcePdfUrl,
    media: (listing.media as { id: string; url: string; category: string; sortOrder: number | null; isAdopted: boolean }[] || [])
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
  }))

  return NextResponse.json({ listings: result })
}
