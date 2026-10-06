'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { getPrivateChatCopy } from '@/lib/private-chat-copy'
import { getTradeChatCopy } from '@/lib/trade-chat'
import { Button } from '@/components/ui/button'

export function ChatSellerSetup({ listingId }: { listingId: string }) {
  const c = getPrivateChatCopy(useLocale())
  const trade = getTradeChatCopy(useLocale())
  const [managed,setManaged]=useState(false)
  const [email, setEmail] = useState(''), [verified, setVerified] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('')
  useEffect(() => { let active = true; void fetch(`/api/admin/listings/${listingId}/seller`, { cache: 'no-store' }).then(r => r.json()).then(data => { if (active) { if(data.email)setEmail(data.email);setManaged(Boolean(data.managed)) } }).catch(() => { if (active) setNotice(c.error) }); return () => { active = false } }, [listingId, c.error])
  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/admin/listings/${listingId}/seller`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), authorized: verified }) })
      const data = await response.json()
      setNotice(response.ok ? c.saved : data.error === 'SELLER_NOT_REGISTERED' ? c.notRegistered : c.error)
    } catch { setNotice(c.error) } finally { setBusy(false) }
  }
  return <section className="my-6 rounded-xl border bg-white p-5"><h2 className="text-lg font-semibold">{managed ? trade.manager : c.sellerSetup}</h2>{managed && <p className="my-3 rounded bg-green-50 p-3 text-sm text-green-800">✓ {trade.managedNote}</p>}<p className="my-2 text-sm text-muted-foreground">{c.setupNote}</p><form onSubmit={save} className="space-y-3"><label className="block text-sm">{c.email}<input type="email" required value={email} onChange={e => { setEmail(e.target.value); setVerified(false) }} className="mt-1 block w-full max-w-md rounded border p-2" /></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={verified} onChange={e => setVerified(e.target.checked)} className="mt-1" />{c.verified}</label><Button disabled={busy || !verified} type="submit">{busy ? c.loading : c.save}</Button></form>{notice && <p role="status" className="mt-3 text-sm">{notice}</p>}<Link href={`/chats?listing=${listingId}`} className="mt-4 inline-block text-sm text-[#274d7d] underline">{c.title}</Link></section>
}
