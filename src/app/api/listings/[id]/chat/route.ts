import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PROPERTY_TYPES } from '@/lib/market-category'
import {
  ChatRateLimiter,
  createListingChatHandler,
} from '@/lib/listing-chat-api'
import type { ChatListingFacts } from '@/lib/listing-chat'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

const handler = createListingChatHandler({
  limiter: new ChatRateLimiter(),
  async getListing(id) {
    // Public scope is verified even when the viewer is an administrator whose
    // management RLS policy can otherwise read expired rows.
    // Never use a service-role client or accept listing facts from the browser.
    const supabase = await createClient()
    const eligible = await supabase.rpc('is_public_listing', { listing_id: id })
    if (eligible.error) throw new Error('Public eligibility unavailable')
    if (eligible.data !== true) return null
    const { data, error } = await supabase
      .from('listings')
      .select(
        'id,propertyType,price,priceCurrency,addressPublic,stations,builtYear,builtMonth,buildingArea,landArea,structure,floorCount,currentStatus,updatedAt'
      )
      .eq('id', id)
      .eq('status', 'PUBLISHED')
      .eq('adAllowed', true)
      .in('propertyType', [...PUBLIC_PROPERTY_TYPES])
      .is('hospitalityCategory', null)
      .maybeSingle()
    if (error) throw new Error('Public listing unavailable')
    if (!data) return null
    const stillEligible = await supabase.rpc('is_public_listing', { listing_id: id })
    if (stillEligible.error) throw new Error('Public eligibility unavailable')
    if (stillEligible.data !== true) return null
    return data as ChatListingFacts | null
  },
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handler(request, (await params).id)
}
