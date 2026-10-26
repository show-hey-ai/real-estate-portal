import { NextRequest, NextResponse } from 'next/server'
import { getListingCardsByIds } from '@/lib/public-listing-cards'
import { withCardFacts } from '@/lib/card-facts'
import { FAVORITES_LIMIT } from '@/lib/browser-lists'
import { defaultLocale, locales } from '@/i18n/config'

const ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/

/** Card data for favorites kept in a browser; only published listings, the same facts as the public pages. */
export async function GET(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get('lang') ?? ''
  const locale = (locales as readonly string[]).includes(lang) ? lang : defaultLocale
  const ids = [...new Set((request.nextUrl.searchParams.get('ids') ?? '').split(','))].filter((id) => ID_PATTERN.test(id)).slice(0, FAVORITES_LIMIT)
  try {
    const cards = await getListingCardsByIds(ids)
    // Prices travel as strings (JSON has no bigint); the order follows the request.
    const order = new Map(ids.map((id, index) => [id, index]))
    return NextResponse.json({
      cards: cards.map((card) => ({ ...withCardFacts(card, locale), price: card.price == null ? null : String(card.price) }))
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)),
    })
  } catch (error) {
    console.error('Favorite cards error:', error)
    return NextResponse.json({ cards: [] }, { status: 500 })
  }
}
