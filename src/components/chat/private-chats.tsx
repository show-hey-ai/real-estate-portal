'use client'

import { useBuyerFunnelHeaders } from '@/components/analytics/buyer-funnel'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { LockKeyhole, MessageCircle, ArrowLeft, Send, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getPrivateChatCopy } from '@/lib/private-chat-copy'
import { translatorLanguage } from '@/lib/private-chat-policy'
import { getTradeChatCopy, stageLabel, tradeStages } from '@/lib/trade-chat'

type Room = { id: string; listingId: string; title: string; role: 'buyer' | 'seller'; sellerKind: 'seller' | 'manager'; stage: string; updatedAt: string }
type Message = { id: string; body: string; language: string; mine: boolean; createdAt: string }
type TranslatorInstance = { translate(text: string): Promise<string>; destroy(): void }
type TranslatorAPI = { create(options: { sourceLanguage: string; targetLanguage: string }): Promise<TranslatorInstance> }
const languages = { ja: '日本語', en: 'English', 'zh-CN': '简体中文', 'zh-TW': '繁體中文' }
function errorCopy(code: string, locale: string) {
  const c = getPrivateChatCopy(locale)
  return code === 'SELLER_PENDING' ? c.pending : code === 'SELLER_OPEN_INBOX' ? c.sellerInbox : code === 'LOGIN_REQUIRED' ? c.login : code === 'CHAT_NOT_FOUND' ? c.missing : code === 'RATE_LIMIT' ? c.rate : c.error
}
export function PropertyChatLink({ listingId }: { listingId: string }) {
  const c = getTradeChatCopy(useLocale())
  return <Link href={`/chats?listing=${encodeURIComponent(listingId)}&start=1`} data-testid="property-private-chat" className="flex items-center justify-center gap-2 rounded-lg bg-[#274d7d] px-4 py-3 font-medium text-white hover:bg-[#18375f]"><MessageCircle className="h-5 w-5" />{c.start}</Link>
}
export function PrivateChatIndex({ listingId, start }: { listingId?: string; start?: boolean }) {
  const locale = useLocale(), c = getPrivateChatCopy(locale), router = useRouter()
  const trade = getTradeChatCopy(locale)
  const [rooms, setRooms] = useState<Room[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true), [next, setNext] = useState<string | null>(null)
  const paged = useRef(false)
  const load = useCallback(async (before?: string, quiet = false) => {
    if (!quiet) { setLoading(true); setError('') }
    try {
      const query = new URLSearchParams()
      if (listingId) query.set('listing', listingId)
      if (before) query.set('before', before)
      const response = await fetch(`/api/chats?${query}`, { cache: 'no-store' })
      const data = await response.json()
      if (!response.ok) { if ([401,403].includes(response.status)) setRooms([]); throw new Error(data.error) }
      setRooms(old => before ? [...old, ...data.rooms] : data.rooms); setNext(data.next)
      paged.current=Boolean(before)
    } catch (e) { setError(errorCopy(e instanceof Error ? e.message : '', locale)) } finally { setLoading(false) }
  }, [listingId, locale])
  useEffect(() => { if(start)return;const timer=setInterval(()=>{if(!document.hidden&&!paged.current)void load(undefined,true)},10000);return()=>clearInterval(timer) },[start,load])
  useEffect(() => {
    let active = true
    async function initialize() {
      if (start && listingId) {
        try {
          const response = await fetch('/api/chats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listingId }) })
          const data = await response.json()
          if (!active) return
          if (response.ok) { router.replace(`/chats/${data.id}`); return }
          if (data.error === 'SELLER_OPEN_INBOX') { router.replace(`/chats?listing=${encodeURIComponent(listingId)}`); return }
          setError(errorCopy(data.error, locale))
        } catch { if (active) setError(c.error) }
        if (active) setLoading(false)
      } else if (active) await load()
    }
    void initialize()
    return () => { active = false }
  }, [start, listingId, router, locale, c.error, load])
  return <section data-testid="private-chat-index" className="mx-auto max-w-4xl px-4 py-10">
    <h1 className="text-3xl font-semibold text-[#142337]">{c.title}</h1>
    <p className="my-4 flex gap-2 text-sm text-[#647487]"><LockKeyhole className="h-4 w-4 shrink-0" />{trade.privacy}</p>
    {listingId && <Link href={`/listings/${listingId}`} className="text-sm text-[#274d7d] underline">{c.property}</Link>}
    {loading && <p className="py-6" role="status">{c.loading}</p>}
    {error && <div className="my-6 rounded-lg border bg-white p-5" role="alert"><p>{error}</p><Link href="/chats" className="mt-3 inline-block text-[#274d7d] underline">{c.back}</Link></div>}
    {!loading && !error && rooms.length === 0 && <p className="my-8 rounded-xl border bg-white p-8 text-[#647487]">{c.empty}</p>}
    <div className="my-6 space-y-3">{rooms.map(room => <Link key={room.id} href={`/chats/${room.id}`} className="flex items-center gap-4 rounded-xl border bg-white p-5 hover:border-[#274d7d]"><MessageCircle className="h-6 w-6 text-[#274d7d]" /><div className="min-w-0 flex-1"><h2 className="truncate font-semibold">{room.title}</h2><p className="text-sm text-[#647487]">{room.role === 'buyer' ? c.buyer : room.sellerKind==='manager' ? trade.manager : c.seller} · #{room.id.slice(-6)} · {new Date(room.updatedAt).toLocaleString(locale)}</p><p className="mt-1 text-xs font-medium text-[#274d7d]">{stageLabel(room.stage,locale)}</p></div><LockKeyhole className="h-4 w-4 text-[#647487]" /></Link>)}</div>
    {next && <Button variant="outline" disabled={loading} onClick={() => void load(next)}>{c.more}</Button>}
  </section>
}
function MessageBubble({ message, translator, locale }: { message: Message; translator?: TranslatorInstance; locale: string }) {
  const c = getPrivateChatCopy(locale)
  const [translation, setTranslation] = useState(''), [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    if (translator) void translator.translate(message.body).then(text => { if (active) { setTranslation(text); setFailed(false) } }).catch(() => { if (active) setFailed(true) })
    return () => { active = false }
  }, [translator, message.body])
  return <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}><article className={`max-w-[90%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${message.mine ? 'bg-[#e8f0fa]' : 'border bg-white'}`}>
    <p className="whitespace-pre-wrap break-words text-sm leading-6">{translation || message.body}</p>
    {translation && <><span className="text-xs text-[#647487]">{c.translated}</span><details className="mt-1 text-xs"><summary className="cursor-pointer">{c.original}</summary><p className="mt-2 whitespace-pre-wrap break-words">{message.body}</p></details></>}
    {failed && <p className="mt-1 text-xs text-[#647487]">{c.translationFailed}</p>}
    <time className="mt-2 block text-xs text-[#647487]" dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString(locale)}</time>
  </article></div>
}
export function PrivateChatRoom({ id }: { id: string }) {
  const locale = useLocale()
  return <PrivateChatRoomContent key={`${id}:${locale}`} id={id} locale={locale} />
}
function PrivateChatRoomContent({ id, locale }: { id: string; locale: string }) {
  const funnelHeaders = useBuyerFunnelHeaders()
  const c = getPrivateChatCopy(locale)
  const trade = getTradeChatCopy(locale)
  const [room, setRoom] = useState<Room | null>(null), [messages, setMessages] = useState<Message[]>([]), [error, setError] = useState(''), [body, setBody] = useState(''), [sending, setSending] = useState(false), [loading, setLoading] = useState(true), [next, setNext] = useState<string | null>(null)
  const [language, setLanguage] = useState(locale in languages ? locale : 'en')
  const [translators, setTranslators] = useState<Record<string, TranslatorInstance>>({}), [translationState, setTranslationState] = useState(''), [translationLoading, setTranslationLoading] = useState(false)
  const translatorRefs = useRef<TranslatorInstance[]>([]), mounted = useRef(true), nonce = useRef<{ body: string; language: string; id: string } | null>(null)
  useEffect(() => { mounted.current = true; const instances = translatorRefs.current; return () => { mounted.current = false; instances.forEach(t => t.destroy()) } }, [])
  const merge = useCallback((incoming: Message[]) => setMessages(old => Array.from(new Map([...old, ...incoming].map(m => [m.id, m])).values()).sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id))), [])
  const load = useCallback(async (before?: string) => {
    try {
      const response = await fetch(`/api/chats/${id}${before ? `?before=${before}` : ''}`, { cache: 'no-store' })
      const data = await response.json()
      if (!mounted.current) return
      if (!response.ok) {
        if ([401,403,404].includes(response.status)) { setRoom(null); setMessages([]) }
        throw new Error(data.error)
      }
      setRoom(data.room); merge(data.messages); setError('')
      if (before || loading) setNext(data.next)
    } catch (e) { if (mounted.current) setError(errorCopy(e instanceof Error ? e.message : '', locale)) } finally { if (mounted.current) setLoading(false) }
  }, [id, locale, merge, loading])
  useEffect(() => { void load(); const timer = setInterval(() => { if (!document.hidden) void load() }, 5000); return () => clearInterval(timer) }, [load])
  useEffect(() => { const api = (globalThis as typeof globalThis & { Translator?: TranslatorAPI }).Translator; if (!api) setTranslationState(c.unavailable) }, [c.unavailable])
  async function enableTranslation() {
    const api = (globalThis as typeof globalThis & { Translator?: TranslatorAPI }).Translator
    if (!api) { setTranslationState(c.unavailable); return }
    setTranslationLoading(true); setTranslationState('')
    const target = translatorLanguage(locale)
    const sources = Array.from(new Set(Object.keys(languages).map(translatorLanguage))).filter(source => source !== target)
    // Invoke create directly inside the click: model downloads require user activation.
    const attempts = sources.map(source => api.create({ sourceLanguage: source, targetLanguage: target }).then(instance => ({ source, instance })))
    const results = await Promise.allSettled(attempts)
    const ready: Record<string, TranslatorInstance> = {}
    for (const result of results) if (result.status === 'fulfilled') { ready[result.value.source] = result.value.instance; translatorRefs.current.push(result.value.instance) }
    if (!mounted.current) { Object.values(ready).forEach(t => t.destroy()); return }
    setTranslators(ready); setTranslationLoading(false)
    if (Object.keys(ready).length < sources.length) setTranslationState(c.unavailable)
  }
  async function send(event: React.FormEvent) {
    event.preventDefault()
    if (!body.trim() || sending) return
    setSending(true); setError('')
    if (!nonce.current || nonce.current.body !== body || nonce.current.language !== language) nonce.current = { body, language, id: crypto.randomUUID() }
    try {
      const response = await fetch(`/api/chats/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...funnelHeaders }, body: JSON.stringify({ body, language, nonce: nonce.current.id }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      merge([data.message]); setBody(''); nonce.current = null
    } catch (e) { setError(errorCopy(e instanceof Error ? e.message : '', locale)) } finally { setSending(false) }
  }
  return <section data-testid="private-chat-room" className="mx-auto max-w-3xl px-4 py-8">
    <Link href="/chats" className="mb-5 flex items-center gap-2 text-sm text-[#274d7d]"><ArrowLeft className="h-4 w-4" />{c.back}</Link>
    {loading && <p role="status">{c.loading}</p>}
    {error && <p role="alert" className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4">{error}</p>}
    {!room && !loading && <Button onClick={() => void load()} variant="outline">{c.retry}</Button>}
    {room && <><div className="rounded-xl border bg-white p-5"><h1 className="text-xl font-semibold">{room.title}</h1><p className="my-3 flex gap-2 text-sm text-[#647487]"><LockKeyhole className="h-4 w-4 shrink-0" />{trade.privacy}</p><p className="mb-3 text-sm font-medium">{room.sellerKind==='manager' ? trade.manager : c.seller} · #{room.id.slice(-6)}</p><Link href={`/listings/${room.listingId}`} className="text-sm text-[#274d7d] underline">{c.property}</Link></div>
      <TradeChatActions room={room} locale={locale} onSent={() => void load()} />
      <div className="my-4 rounded-xl bg-[#f0f4f8] p-4"><Button variant="outline" onClick={() => void enableTranslation()} disabled={translationLoading || Object.keys(translators).length > 0}><Languages className="mr-2 h-4 w-4" />{translationLoading ? c.loading : c.translate}</Button><p className="mt-2 text-xs text-[#647487]">{translationState || c.translationNote}</p></div>
      {next && <Button variant="outline" onClick={() => void load(next)}>{c.older}</Button>}
      <div className="my-5 space-y-4" aria-live="polite" aria-relevant="additions">{messages.length === 0 && <p className="py-8 text-center text-sm text-[#647487]">{c.noMessages}</p>}{messages.map(message => <MessageBubble key={message.id} message={message} locale={locale} translator={translatorLanguage(message.language) !== translatorLanguage(locale) ? translators[translatorLanguage(message.language)] : undefined} />)}</div>
      <form onSubmit={send} className="sticky bottom-0 rounded-xl border bg-white p-4 shadow-sm"><label className="mb-2 block text-xs text-[#647487]">{c.language}<select className="ml-2 rounded border p-1" value={language} onChange={e => setLanguage(e.target.value)} disabled={sending}>{Object.entries(languages).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><textarea aria-label={c.placeholder} placeholder={c.placeholder} value={body} onChange={e => setBody(e.target.value)} disabled={sending} maxLength={4000} rows={3} required className="w-full resize-y rounded-lg border p-3 text-sm" /><div className="mt-2 flex items-center justify-between"><span className="text-xs text-[#647487]">{body.length}/4000</span><Button type="submit" disabled={sending || !body.trim()}><Send className="mr-2 h-4 w-4" />{sending ? c.busy : c.send}</Button></div></form>
    </>}
  </section>
}

function TradeChatActions({ room, locale, onSent }: { room: Room; locale: string; onSent(): void }) {
  const funnelHeaders = useBuyerFunnelHeaders()
  const c = getTradeChatCopy(locale), chat = getPrivateChatCopy(locale)
  const [action,setAction] = useState<'viewing'|'offer'|'stage'|null>(null)
  const [date,setDate] = useState(''), [slot,setSlot] = useState(''), [amountYen,setAmount] = useState(''), [note,setNote] = useState(''), [stage,setStage] = useState(room.stage)
  const [busy,setBusy] = useState(false), [error,setError] = useState('')
  const nonce = useRef<{ signature: string; id: string } | null>(null)
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!action || busy) return
    const data = { action, language: locale in languages ? locale : 'en', note, ...(action==='viewing' ? {date,slot} : action==='offer' ? {amountYen} : {stage}) }
    const signature = JSON.stringify(data)
    if (nonce.current?.signature!==signature) nonce.current = {signature,id:crypto.randomUUID()}
    setBusy(true); setError('')
    try {
      const response = await fetch(`/api/chats/${room.id}`,{ method:'POST',headers:{'Content-Type':'application/json',...funnelHeaders},body:JSON.stringify({...data,nonce:nonce.current.id}) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setAction(null); setNote(''); nonce.current=null; onSent()
    } catch (e) { setError(errorCopy(e instanceof Error ? e.message : '',locale)) } finally { setBusy(false) }
  }
  return <section className="my-4 rounded-xl border bg-white p-4" data-testid="trade-chat-actions"><p className="text-xs text-[#647487]">{c.progress}</p><p className="my-2 font-semibold text-[#274d7d]" data-testid="trade-stage">{stageLabel(room.stage,locale)}</p><div className="flex flex-wrap gap-2">{room.role==='buyer' ? <><Button variant="outline" disabled={busy} onClick={()=>{setError('');setAction('viewing')}}>{c.viewing}</Button><Button variant="outline" disabled={busy} onClick={()=>{setError('');setAction('offer')}}>{c.offer}</Button></> : <Button variant="outline" disabled={busy} onClick={()=>{setStage(room.stage);setError('');setAction('stage')}}>{c.update}</Button>}</div>
    {action && <form onSubmit={submit} className="mt-4 border-t pt-4"><fieldset disabled={busy} className="space-y-3"><p className="text-xs text-[#647487]">{action==='stage' ? c.stageNote : c.requestNote}</p>
      {action==='viewing' && <><label className="block text-sm">{c.date}<input type="date" required value={date} onChange={e=>setDate(e.target.value)} className="mt-1 block max-w-full rounded border p-2" /></label><label className="block text-sm">{c.slot}<input required maxLength={80} value={slot} onChange={e=>setSlot(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label></>}
      {action==='offer' && <label className="block text-sm">{c.amount}<input type="text" inputMode="numeric" pattern="[1-9][0-9]{0,11}" required value={amountYen} onChange={e=>setAmount(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>}
      {action==='stage' && <label className="block text-sm">{c.progress}<select aria-label={c.progress} value={stage} onChange={e=>setStage(e.target.value)} className="mt-1 block max-w-full rounded border p-2">{tradeStages.map(s=><option key={s} value={s}>{stageLabel(s,locale)}</option>)}</select></label>}
      <label className="block text-sm">{c.note}<textarea value={note} maxLength={1000} rows={2} onChange={e=>setNote(e.target.value)} className="mt-1 block w-full rounded border p-2" /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? chat.busy : c.submit}</Button><Button type="button" variant="ghost" disabled={busy} onClick={()=>setAction(null)}>{c.cancel}</Button></div>
    </fieldset></form>}
  </section>
}
