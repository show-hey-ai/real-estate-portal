'use client'

import { useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ArrowRight, BookOpen, MessageCircle, Search, X } from 'lucide-react'
import { helpArticles, getHelpCopy, helpLocale } from '@/content/help'
import { HELP_QUERY_LIMIT, searchHelp } from '@/lib/help-search'

const subscribe = () => () => {}

export function HelpCenter({ locale }: { locale: string }) {
  const copy = getHelpCopy(locale)
  const language = helpLocale(locale)
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
  const [query, setQuery] = useState('')
  const [answered, setAnswered] = useState<string | null>(null)
  const sourceDetails = useRef<Record<string, HTMLDetailsElement | null>>({})
  const answers = answered ? searchHelp(answered, locale) : []
  function ask(value: string) {
    const trimmed = value.trim().slice(0, HELP_QUERY_LIMIT)
    if (!ready || !trimmed) return
    setQuery(trimmed)
    setAnswered(trimmed)
  }

  return (
    <div data-testid="help-center" className="bg-[#f5f7f9] pb-16">
      <div className="border-b border-[#dbe2e9] bg-white">
        <div className="container max-w-5xl py-10 sm:py-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#647487]">
            ZIYOU / {copy.nav}
          </p>
          <h1 className="text-3xl font-semibold leading-tight text-[#142337] sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#647487] sm:text-base">
            {copy.subtitle}
          </p>
        </div>
      </div>
      <div className="container max-w-5xl pt-8">
        <section
          aria-labelledby="help-assistant-title"
          className="rounded-xl border border-[#cce1d9] bg-[#edf6f1] p-5 sm:p-8"
        >
          <h2
            id="help-assistant-title"
            className="flex items-center gap-2 text-lg font-semibold text-[#142337]"
          >
            <MessageCircle
              className="h-5 w-5 shrink-0 text-[#39715c]"
              aria-hidden="true"
            />
            {copy.assistant}
          </h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              ask(query)
            }}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="help-query" className="sr-only">
              {copy.label}
            </label>
            <div className="relative flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#647487]"
              />
              <input
                id="help-query"
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setAnswered(null)
                }}
                disabled={!ready}
                maxLength={HELP_QUERY_LIMIT}
                autoComplete="off"
                placeholder={copy.placeholder}
                className="h-14 w-full rounded-md border border-[#cad6d1] bg-white pl-12 pr-4 text-base text-[#142337] outline-none focus:ring-2 focus:ring-[#39715c] disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={!ready || !query.trim()}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-md bg-[#274d7d] px-6 text-sm font-semibold text-white hover:bg-[#18375f] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
            >
              {copy.submit}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </form>
          <p className="mt-3 text-xs leading-5 text-[#536c60]">
            {copy.privacy}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {copy.examples.map((example) => (
              <button
                key={example}
                type="button"
                disabled={!ready}
                onClick={() => ask(example)}
                className="rounded-full border border-[#cad6d1] bg-white/70 px-3 py-2 text-xs leading-5 text-[#355846] hover:bg-white disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-[#536c60]">{copy.note}</p>
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            data-testid="help-answer"
          >
            {answered !== null && (
              <div className="mt-6 rounded-lg border border-[#cad6d1] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm font-semibold text-[#142337]">
                    {copy.answer}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setAnswered(null)
                    }}
                    className="flex shrink-0 items-center gap-1 text-xs text-[#647487] hover:text-[#142337]"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                    {copy.clear}
                  </button>
                </div>
                {answers.length ? (
                  <div className="mt-4 space-y-5">
                    {answers.map((answer) => (
                      <div key={answer.id}>
                        <h4 className="text-sm font-semibold text-[#274d7d]">
                          {answer.title}
                        </h4>
                        <p className="mt-2 text-sm leading-7 text-[#415266]">
                          {answer.body}
                        </p>
                        <a
                          href={`#${answer.id}`}
                          onClick={() => {
                            const source = sourceDetails.current[answer.id]
                            if (source) source.open = true
                          }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#274d7d] underline underline-offset-4"
                        >
                          {copy.sources}: {answer.title}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-[#415266]">
                    {copy.empty}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        <section aria-labelledby="help-topics-title" className="mt-10">
          <h2
            id="help-topics-title"
            className="mb-6 text-xl font-semibold text-[#142337]"
          >
            {copy.all}
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {(['search', 'listing', 'account'] as const).map((category) => (
              <div key={category} className="min-w-0">
                <h3 className="mb-3 text-sm font-semibold text-[#647487]">
                  {copy.categories[category]}
                </h3>
                <div className="space-y-3">
                  {helpArticles
                    .filter((article) => article.category === category)
                    .map((article) => (
                      <details
                        key={article.id}
                        id={article.id}
                        ref={(element) => {
                          sourceDetails.current[article.id] = element
                        }}
                        className="group scroll-mt-44 rounded-lg border border-[#dbe2e9] bg-white p-5 open:ring-1 open:ring-[#c8d4e1]"
                      >
                        <summary className="cursor-pointer text-sm font-semibold leading-6 text-[#142337]">
                          {article.text[language].title}
                        </summary>
                        <p className="mt-3 text-sm leading-7 text-[#536377]">
                          {article.text[language].body}
                        </p>
                        <Link
                          href={article.href}
                          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#274d7d] underline underline-offset-4"
                        >
                          {article.text[language].action}
                          <ArrowRight aria-hidden="true" className="h-3 w-3" />
                        </Link>
                      </details>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </section>
        <div className="mt-10 flex flex-wrap gap-5 border-t border-[#dbe2e9] pt-6 text-sm font-medium text-[#274d7d]">
          <Link href="/listings" className="inline-flex items-center gap-2">
            <Search aria-hidden="true" className="h-4 w-4" />
            {copy.browse}
          </Link>
          <Link href="/buying-guide" className="inline-flex items-center gap-2">
            <BookOpen aria-hidden="true" className="h-4 w-4" />
            {copy.guide}
          </Link>
        </div>
      </div>
    </div>
  )
}
