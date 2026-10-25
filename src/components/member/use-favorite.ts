'use client'

import { useState, useSyncExternalStore } from 'react'
import { useLocale } from 'next-intl'
import { LISTS_CHANGED_EVENT, readFavorites, toggleFavorite, writeFavorites } from '@/lib/browser-lists'

function storage() {
  try { return typeof window === 'undefined' ? null : window.localStorage } catch { return null }
}

function subscribe(onChange: () => void) {
  window.addEventListener(LISTS_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => { window.removeEventListener(LISTS_CHANGED_EVENT, onChange); window.removeEventListener('storage', onChange) }
}

const HINT: Record<string, string> = {
  ja: 'この端末に保存しました。ログインすると、スマホとパソコンで共有できます。',
  en: 'Saved on this device. Sign in to see your favorites on your phone and computer.',
  'zh-TW': '已儲存在此裝置。登入後可在手機與電腦間共用。',
  'zh-CN': '已保存在此设备。登录后可在手机和电脑之间共享。',
}

/**
 * Favorites work without an account (kept in this browser). Signed-in members also save them to
 * their account, and MemberSync copies the account's favorites into the browser.
 */
export function useFavorite(listingId: string, userId: string | null, initialFavorite: boolean) {
  const locale = useLocale()
  const stored = useSyncExternalStore(subscribe, () => readFavorites(storage()).some((item) => item.id === listingId), () => false)
  const [chosen, setChosen] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const isFavorite = chosen ?? (stored || initialFavorite)

  async function toggle(): Promise<{ ok: boolean; added: boolean; hint?: string }> {
    if (!userId) {
      const added = toggleFavorite(storage(), listingId)
      setChosen(added)
      window.dispatchEvent(new Event(LISTS_CHANGED_EVENT))
      return { ok: true, added, hint: added ? HINT[locale] ?? HINT.en : undefined }
    }
    setBusy(true)
    try {
      const res = await fetch('/api/favorites', { method: isFavorite ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId }) })
      if (!res.ok) return { ok: false, added: isFavorite }
      const local = readFavorites(storage()).filter((item) => item.id !== listingId)
      writeFavorites(storage(), isFavorite ? local : [{ id: listingId, addedAt: Date.now() }, ...local])
      setChosen(!isFavorite)
      window.dispatchEvent(new Event(LISTS_CHANGED_EVENT))
      return { ok: true, added: !isFavorite }
    } catch {
      return { ok: false, added: isFavorite }
    } finally {
      setBusy(false)
    }
  }

  return { isFavorite, busy, toggle }
}
