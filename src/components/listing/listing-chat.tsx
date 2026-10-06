'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useLocale } from 'next-intl'
import { ArrowUp, MessageCircle, RotateCcw } from 'lucide-react'
import { getListingChatCopy } from '@/lib/listing-chat-copy'

interface Message {
  id: number
  role: 'user' | 'assistant'
  text: string
  needsInquiry?: boolean
}

const subscribeReady = () => () => {}
const clientReady = () => true
const serverReady = () => false

export function ListingChat({
  listingId,
  listingTitle,
}: {
  listingId: string
  listingTitle: string
}) {
  const locale = useLocale()
  const copy = getListingChatCopy(locale)
  const ready = useSyncExternalStore(subscribeReady, clientReady, serverReady)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [unavailable, setUnavailable] = useState(false)
  const request = useRef<AbortController | null>(null)
  const nextId = useRef(0)
  const log = useRef<HTMLDivElement>(null)
  useEffect(
    () => () => {
      request.current?.abort()
      request.current = null
    },
    []
  )
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight
  }, [messages, pending])

  async function send(question: string) {
    const text = question.trim()
    if (!ready || !text || text.length > 600 || request.current || unavailable)
      return
    const controller = new AbortController()
    request.current = controller
    setPending(true)
    setError('')
    setDraft('')
    const outgoing: Message = { id: nextId.current++, role: 'user', text }
    setMessages((current) => [...current, outgoing].slice(-23))
    const timeout = setTimeout(() => controller.abort(), 15_000)
    try {
      const response = await fetch(
        `/api/listings/${encodeURIComponent(listingId)}/chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, locale }),
          signal: controller.signal,
        }
      )
      if (!response.ok) {
        if (response.status === 404) setUnavailable(true)
        setError(
          response.status === 429
            ? copy.rate
            : response.status === 404
              ? copy.unavailable
              : copy.error
        )
        setDraft(text)
        return
      }
      const result = await response.json()
      if (
        result.listingId !== listingId ||
        typeof result.answer !== 'string' ||
        result.answer.length > 8000
      )
        throw new Error('Invalid answer')
      const incoming: Message = {
        id: nextId.current++,
        role: 'assistant',
        text: result.answer,
        needsInquiry: result.needsInquiry === true,
      }
      setMessages((current) => [...current, incoming].slice(-24))
    } catch {
      if (!controller.signal.aborted || request.current === controller) {
        setError(copy.error)
        setDraft(text)
      }
    } finally {
      clearTimeout(timeout)
      if (request.current === controller) {
        request.current = null
        setPending(false)
      }
    }
  }

  return (
    <section
      id="property-chat"
      aria-label={copy.title}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-[#cfded8] bg-white shadow-sm"
      data-testid="listing-chat"
      data-listing-chat={listingId}
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#e0e9e4] bg-[#f0f7f4] p-5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-[#244f42]">
            <MessageCircle aria-hidden="true" className="h-5 w-5 shrink-0" />
            {copy.title}
          </h2>
          <p className="mt-2 break-words text-xs text-[#59766b]">
            {listingTitle}
          </p>
          <p className="mt-1 text-xs leading-5 text-[#59766b]">
            {copy.subtitle}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            aria-label={copy.clear}
            disabled={pending}
            onClick={() => {
              setMessages([])
              setError('')
              setDraft('')
            }}
            className="shrink-0 rounded-md p-2 text-[#658075] hover:bg-white disabled:opacity-40"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>
      <div
        ref={log}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={copy.title}
        className="max-h-[340px] space-y-3 overflow-y-auto overscroll-contain p-5"
      >
        <p className="rounded-xl bg-[#f4f7f6] p-3 text-sm leading-6 text-[#405b50]">
          {copy.welcome}
        </p>
        {messages.map((message) => (
          <div
            key={message.id}
            className={message.role === 'user' ? 'ml-6' : 'mr-2'}
          >
            <p
              className={`whitespace-pre-wrap break-words rounded-xl px-4 py-3 text-sm leading-6 [overflow-wrap:anywhere] ${message.role === 'user' ? 'bg-[#326a5d] text-white' : 'border border-[#e1e9e5] bg-[#f8faf9] text-[#345248]'}`}
            >
              {message.text}
            </p>
            {message.role === 'assistant' && (
              <div className="mt-2 space-y-1 px-1">
                <a
                  href="#property-facts"
                  className="block text-[11px] text-[#6f847b] underline underline-offset-2"
                >
                  {copy.source}
                </a>
                {message.needsInquiry && (
                  <a
                    href="#inquiry"
                    className="inline-block text-xs font-medium text-[#316957] underline underline-offset-4"
                  >
                    {copy.inquiry}
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
        {pending && (
          <p role="status" className="text-xs text-[#698476]">
            {copy.working}
          </p>
        )}
      </div>
      <div className="border-t border-[#e0e9e4] p-4">
        {!messages.length && (
          <div className="mb-3 flex flex-wrap gap-2">
            {copy.suggestions.map((question) => (
              <button
                key={question}
                type="button"
                disabled={!ready || pending || unavailable}
                onClick={() => void send(question)}
                className="rounded-full border border-[#d9e6df] bg-[#f7faf8] px-3 py-2 text-left text-xs leading-4 text-[#456e5c] hover:bg-[#edf5f0] disabled:opacity-40"
              >
                {question}
              </button>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="mb-3 text-xs leading-5 text-red-700">
            {error}
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void send(draft)
          }}
          className="flex items-end gap-2"
        >
          <label className="sr-only" htmlFor={`listing-question-${listingId}`}>
            {copy.question}
          </label>
          <textarea
            id={`listing-question-${listingId}`}
            value={draft}
            disabled={!ready || pending || unavailable}
            maxLength={600}
            rows={2}
            placeholder={copy.placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.nativeEvent.isComposing ||
                event.nativeEvent.keyCode === 229
              )
                return
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                void send(draft)
              }
            }}
            className="min-w-0 flex-1 resize-none rounded-xl border border-[#d0dfd7] px-3 py-2 text-sm outline-none placeholder:text-[#8ca096] focus:border-[#39786e] focus:ring-2 focus:ring-[#39786e]/15 disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label={copy.send}
            disabled={!ready || !draft.trim() || pending || unavailable}
            className="mb-1 rounded-xl bg-[#326a5d] p-3 text-white hover:bg-[#255445] disabled:opacity-35"
          >
            <ArrowUp aria-hidden="true" className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-3 text-[11px] leading-5 text-[#5a6e63]">
          {copy.privacy}
        </p>
        <a
          href="#inquiry"
          className="mt-2 inline-block text-xs font-medium text-[#316957] underline underline-offset-4"
        >
          {copy.inquiry}
        </a>
      </div>
    </section>
  )
}
