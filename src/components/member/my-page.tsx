'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useLocale } from 'next-intl'
import { Building2, Heart, History, Search, Trash2, UserRound, X } from 'lucide-react'
import { LISTS_CHANGED_EVENT, readFavorites, readRecent, writeRecent, type RecentListing } from '@/lib/browser-lists'
import { SAVED_SEARCH_CHANGE_EVENT, SAVED_SEARCH_STORAGE_KEY, readSavedSearches, type SavedSearch } from '@/lib/listing-search'
import { MEMBER_CLEAR_RECENT_EVENT, MEMBER_REMOVE_SEARCH_EVENT } from '@/lib/member-lists'
import { getMemberCopy } from '@/lib/member-copy'
import { ListingCard } from '@/components/listing/listing-card'
import { describeSavedSearch } from '@/components/listing/search-results-toolbar'
import { BuyerProfileFields, useBuyerProfile } from '@/components/contact/buyer-profile-fields'

type CardListing = Parameters<typeof ListingCard>[0]['listing']
type CardFromApi = Omit<CardListing, 'price'> & { price: string | null }

function storage() {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

function subscribe(onChange: () => void) {
  for (const name of [LISTS_CHANGED_EVENT, SAVED_SEARCH_CHANGE_EVENT, 'storage']) window.addEventListener(name, onChange)
  return () => { for (const name of [LISTS_CHANGED_EVENT, SAVED_SEARCH_CHANGE_EVENT, 'storage']) window.removeEventListener(name, onChange) }
}

// Snapshots are serialised so React sees a stable value between changes.
function useStored<T>(read: () => T): T {
  return JSON.parse(useSyncExternalStore(subscribe, () => JSON.stringify(read()), () => 'null') ?? 'null') as T
}

function Section({ icon: Icon, title, count, action, children }: { icon: typeof Heart; title: string; count?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="mt-10" aria-label={title}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><Icon aria-hidden="true" className="h-5 w-5 text-[#57769b]" />{title}{count && <span className="text-sm font-normal text-[#657487]">{count}</span>}</h2>
      {action}
    </div>
    {children}
  </section>
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-[#cfd9e3] bg-[#f8fafc] px-4 py-6 text-center text-sm text-[#536274]">{children}</p>
}

interface MyPageProps {
  /** Signed-in member's email, or null for a visitor without an account. */
  email: string | null
  userId: string | null
}

/** Favorites, history, saved searches and buyer answers; for visitors these live in this browser, for members in their account too. */
export function MyPage({ email, userId }: MyPageProps) {
  const locale = useLocale()
  const text = getMemberCopy(locale)
  const favoriteIds = useStored(() => readFavorites(storage()).map((item) => item.id)) ?? []
  const recent = useStored<RecentListing[]>(() => readRecent(storage())) ?? []
  const searches = useStored<SavedSearch[]>(() => readSavedSearches(storage()?.getItem(SAVED_SEARCH_STORAGE_KEY) ?? null)) ?? []
  const [profile, answer] = useBuyerProfile()
  const [cards, setCards] = useState<CardListing[]>([])
  const idsKey = favoriteIds.join(',')

  useEffect(() => {
    // With no favorites nothing is shown (cards are filtered by the current ids), so nothing to load.
    if (!idsKey) return
    let cancelled = false
    fetch(`/api/member/favorite-cards?ids=${encodeURIComponent(idsKey)}&lang=${encodeURIComponent(locale)}`)
      .then((res) => (res.ok ? res.json() : { cards: [] }))
      .then((data: { cards: CardFromApi[] }) => { if (!cancelled) setCards(data.cards.map((card) => ({ ...card, price: card.price == null ? null : BigInt(card.price) }))) })
      .catch(() => undefined)
    return () => { cancelled = true }
  }, [idsKey, locale])

  const removeSearch = (query: string) => {
    try {
      storage()?.setItem(SAVED_SEARCH_STORAGE_KEY, JSON.stringify(searches.filter((item) => item.query !== query)))
    } catch { /* storage blocked: nothing to remove */ }
    window.dispatchEvent(new Event(SAVED_SEARCH_CHANGE_EVENT))
    window.dispatchEvent(new CustomEvent(MEMBER_REMOVE_SEARCH_EVENT, { detail: query }))
  }
  const clearRecent = () => {
    writeRecent(storage(), [])
    window.dispatchEvent(new Event(LISTS_CHANGED_EVENT))
    window.dispatchEvent(new Event(MEMBER_CLEAR_RECENT_EVENT))
  }
  const shownCards = cards.filter((card) => favoriteIds.includes(card.id))

  return <div className="container max-w-6xl py-8" data-testid="my-page">
    <h1 className="flex items-center gap-2 text-2xl font-semibold md:text-3xl"><UserRound aria-hidden="true" className="h-6 w-6 text-[#274d7d]" />{text.title}</h1>
    <p className="mt-2 text-sm leading-6 text-[#536274]">{email ? text.signedInAs(email) : text.intro}</p>

    {!email && <div className="mt-5 rounded-xl border border-[#cfd9e3] bg-[#edf3f9] p-5" data-testid="my-page-guest">
      <h2 className="font-semibold text-[#18375f]">{text.guestTitle}</h2>
      <p className="mt-1 text-sm leading-6 text-[#3d4a5a]">{text.guestBody}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/login?redirect=/mypage" className="inline-flex min-h-11 items-center rounded-lg bg-[#274d7d] px-5 text-sm font-semibold text-white hover:bg-[#18375f]">{text.signIn}</Link>
        <Link href="/register?redirect=/mypage" className="inline-flex min-h-11 items-center rounded-lg border border-[#cfd9e3] bg-white px-5 text-sm font-semibold text-[#274d7d] hover:bg-[#f2f6fa]">{text.register}</Link>
      </div>
    </div>}

    <Section icon={Heart} title={text.favorites} count={favoriteIds.length ? text.count(favoriteIds.length) : undefined}>
      {favoriteIds.length
        ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{shownCards.map((card) => <ListingCard key={card.id} listing={card} userId={userId} isFavorite />)}</div>
        : <Empty>{text.favoritesEmpty}</Empty>}
    </Section>

    <Section icon={History} title={text.recent} count={recent.length ? text.count(recent.length) : undefined}
      action={recent.length > 0 && <button type="button" onClick={clearRecent} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#536274] hover:bg-[#f2f6fa]"><Trash2 aria-hidden="true" className="h-3.5 w-3.5" />{text.clearRecent}</button>}>
      {recent.length
        ? <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{recent.map((item) => <li key={item.id}>
          <Link href={`/listings/${item.id}`} className="block overflow-hidden rounded-lg border border-[#dbe2e9] bg-white hover:shadow-md">
            <div className="relative aspect-[4/3] bg-[#eef2f6]">{item.image ? <Image src={item.image} alt="" fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" /> : <Building2 aria-hidden="true" className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-[#9fb2c6]" />}</div>
            <div className="p-2"><p className="text-sm font-bold text-[#1b293a]">{item.price}</p><p className="mt-0.5 line-clamp-2 text-xs text-[#536274]">{item.title}</p></div>
          </Link>
        </li>)}</ul>
        : <Empty>{text.recentEmpty}</Empty>}
    </Section>

    <Section icon={Search} title={text.searches} count={searches.length ? text.count(searches.length) : undefined}>
      {searches.length
        ? <ul className="space-y-2">{searches.map((item) => <li key={item.query} className="flex items-center gap-2 rounded-xl border border-[#dbe2e9] bg-white p-2 pl-4">
          <Link href={`/listings?${item.query}`} className="min-w-0 flex-1 py-2 text-sm text-[#1b293a] hover:underline">{describeSavedSearch(item.query, locale) || item.query}<span className="ml-2 text-xs font-semibold text-[#274d7d]">{text.openSearch} →</span></Link>
          <button type="button" onClick={() => removeSearch(item.query)} aria-label={`${text.deleteSearch}: ${describeSavedSearch(item.query, locale)}`} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#657487] hover:bg-[#f2f6fa]"><X aria-hidden="true" className="h-4 w-4" /></button>
        </li>)}</ul>
        : <Empty>{text.searchesEmpty}</Empty>}
    </Section>

    <Section icon={UserRound} title={text.profile}>
      <p className="mb-3 text-sm text-[#536274]">{text.profileNote}</p>
      <div className="max-w-2xl"><BuyerProfileFields locale={locale} profile={profile} onAnswer={answer} showMissing={false} idPrefix="my-page-profile" /></div>
    </Section>
  </div>
}
