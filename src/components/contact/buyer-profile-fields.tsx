'use client'

import { useState, useSyncExternalStore } from 'react'
import { PROFILE_CHANGED_AT_KEY, PROFILE_CHANGE_EVENT, PROFILE_OPTIONS, PROFILE_QUESTIONS, PROFILE_STORAGE_KEY, getProfileCopy, parseStoredProfile, profileSummary, type BuyerProfile, type ProfileQuestion } from '@/lib/buyer-profile'

// Every contact box on the page shares the answers; they are kept in this browser (and in a member's account).
const CHANGE_EVENT = PROFILE_CHANGE_EVENT
let memory: string | null = null

function read(): string | null {
  try {
    return localStorage.getItem(PROFILE_STORAGE_KEY) ?? memory
  } catch {
    return memory
  }
}
function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback)
    window.removeEventListener('storage', callback)
  }
}

export function useBuyerProfile(): [BuyerProfile, (question: ProfileQuestion, answer: string) => void] {
  const raw = useSyncExternalStore(subscribe, read, () => null)
  const profile = parseStoredProfile(raw)
  const answer = (question: ProfileQuestion, value: string) => {
    memory = JSON.stringify({ ...parseStoredProfile(read()), [question]: value })
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, memory)
      localStorage.setItem(PROFILE_CHANGED_AT_KEY, String(Date.now()))
    } catch {
      // Private windows may refuse storage; the answers still last for this page.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }
  return [profile, answer]
}

interface BuyerProfileFieldsProps {
  locale: string
  profile: BuyerProfile
  onAnswer: (question: ProfileQuestion, answer: string) => void
  /** Outline unanswered questions after a send was attempted. */
  showMissing: boolean
  idPrefix: string
}

interface QuestionChipsProps {
  locale: string
  question: ProfileQuestion
  profile: BuyerProfile
  missing: boolean
  onChoose: (question: ProfileQuestion, answer: string) => void
}

function QuestionChips({ locale, question, profile, missing, onChoose }: QuestionChipsProps) {
  const copy = getProfileCopy(locale)
  return <div className="mt-1 flex flex-wrap gap-1.5">
    {PROFILE_OPTIONS[question].map((option) => {
      const chosen = profile[question] === option
      return <button key={option} type="button" role="radio" aria-checked={chosen} onClick={() => onChoose(question, option)}
        className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${chosen ? 'border-[#274d7d] bg-[#274d7d] text-white' : missing ? 'border-[#f0b4ad] bg-white text-[#1b293a]' : 'border-[#cfd9e3] bg-white text-[#1b293a] hover:bg-[#f3f6f9]'}`}>
        {copy.options[question][option]}
      </button>
    })}
  </div>
}

/** The five required "about you" questions as tap-to-choose chips. */
export function BuyerProfileFields({ locale, profile, onAnswer, showMissing, idPrefix }: BuyerProfileFieldsProps) {
  const copy = getProfileCopy(locale)
  return <fieldset className="rounded-xl border border-[#dbe2e9] bg-white p-3" data-testid="buyer-profile">
    <legend className="px-1 text-sm font-semibold text-[#1b293a]">{copy.title}</legend>
    <p className="text-[11px] leading-4 text-[#657487]">{copy.note}</p>
    <div className="mt-2 space-y-2.5">
      {PROFILE_QUESTIONS.map((question) => {
        const missing = showMissing && !profile[question]
        return <div key={question} role="radiogroup" aria-labelledby={`${idPrefix}-${question}`} aria-required="true" aria-invalid={missing}>
          <p id={`${idPrefix}-${question}`} className={`text-xs font-semibold ${missing ? 'text-[#b42318]' : 'text-[#536274]'}`}>{copy.questions[question]}</p>
          <QuestionChips locale={locale} question={question} profile={profile} missing={missing} onChoose={onAnswer} />
        </div>
      })}
    </div>
  </fieldset>
}

/**
 * The same five questions one at a time, then a one-line summary with "change" (listing contact box).
 * Five rows of chips made phones scroll past half a screen before the send buttons.
 */
export function BuyerProfileSteps({ locale, profile, onAnswer, showMissing, idPrefix }: BuyerProfileFieldsProps) {
  const copy = getProfileCopy(locale)
  const [editing, setEditing] = useState<ProfileQuestion | null>(null)
  const current = editing ?? PROFILE_QUESTIONS.find((question) => !profile[question]) ?? null
  const choose = (question: ProfileQuestion, answer: string) => {
    onAnswer(question, answer)
    // Changing or going back walks on through the questions in order; otherwise the first one still
    // open comes next, and with none left, the summary.
    setEditing(editing ? PROFILE_QUESTIONS[PROFILE_QUESTIONS.indexOf(question) + 1] ?? null : null)
  }

  if (!current) {
    return <fieldset className="rounded-xl border border-[#dbe2e9] bg-white p-3" data-testid="buyer-profile">
      <legend className="px-1 text-sm font-semibold text-[#1b293a]">{copy.title}</legend>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-5 text-[#1b293a]" data-testid="buyer-profile-summary">{profileSummary(profile, locale)}</p>
        <button type="button" onClick={() => setEditing(PROFILE_QUESTIONS[0])} className="-my-2 inline-flex min-h-9 shrink-0 items-center text-xs font-semibold text-[#274d7d] underline underline-offset-2">{copy.change}</button>
      </div>
    </fieldset>
  }

  const index = PROFILE_QUESTIONS.indexOf(current)
  const missing = showMissing && !profile[current]
  return <fieldset className="rounded-xl border border-[#dbe2e9] bg-white p-3" data-testid="buyer-profile">
    <legend className="px-1 text-sm font-semibold text-[#1b293a]">{copy.title}</legend>
    <p className="text-[11px] leading-4 text-[#657487]">{copy.note}</p>
    <div aria-hidden="true" className="mt-2 flex gap-1">
      {PROFILE_QUESTIONS.map((question) => <span key={question} className={`h-1 flex-1 rounded-full ${profile[question] ? 'bg-[#274d7d]' : question === current ? 'bg-[#8fb0d6]' : 'bg-[#e1e7ee]'}`} />)}
    </div>
    <div className="mt-2" role="radiogroup" aria-labelledby={`${idPrefix}-${current}`} aria-required="true" aria-invalid={missing}>
      <p id={`${idPrefix}-${current}`} aria-live="polite" className={`flex items-baseline justify-between gap-2 text-xs font-semibold ${missing ? 'text-[#b42318]' : 'text-[#536274]'}`}>
        <span>{copy.questions[current]}</span><span className="shrink-0 text-[11px] font-normal tabular-nums text-[#657487]">{copy.step(index + 1, PROFILE_QUESTIONS.length)}</span>
      </p>
      <QuestionChips locale={locale} question={current} profile={profile} missing={missing} onChoose={choose} />
    </div>
    {index > 0 && <button type="button" onClick={() => setEditing(PROFILE_QUESTIONS[index - 1])} className="mt-1 inline-flex min-h-8 items-center text-[11px] font-semibold text-[#536274] hover:text-[#274d7d]">← {copy.back}</button>}
  </fieldset>
}
