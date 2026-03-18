import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Increment view count
  const { error } = await supabase.rpc('increment_view_count', {
    listing_id: id,
  })

  if (error) {
    // Fallback: direct update if RPC doesn't exist
    const { error: updateError } = await supabase
      .from('listings')
      .update({ viewCount: supabase.rpc('increment_view_count_inline', { listing_id: id }) })
      .eq('id', id)

    if (updateError) {
      // Final fallback: simple increment
      const { data: listing } = await supabase
        .from('listings')
        .select('viewCount')
        .eq('id', id)
        .single()

      if (listing) {
        await supabase
          .from('listings')
          .update({ viewCount: (listing.viewCount || 0) + 1 })
          .eq('id', id)
      }
    }
  }

  return NextResponse.json({ success: true })
}
