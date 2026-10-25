'use client'

import { useSyncExternalStore } from 'react'
import { PROFILE_OPTIONS, PROFILE_QUESTIONS, PROFILE_STORAGE_KEY, getProfileCopy, parseStoredProfile, type BuyerProfile, type ProfileQuestion } from '@/lib/buyer-profile'

// Every contact box on the page shares the answers; they are kept in this browser only.
const CHANGE_EVENT = 'ziyou-buyer-profile-change'
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
          <div className="mt-1 flex flex-wrap gap-1.5">
            {PROFILE_OPTIONS[question].map((option) => {
              const chosen = profile[question] === option
              return <button key={option} type="button" role="radio" aria-checked={chosen} onClick={() => onAnswer(question, option)}
                className={`min-h-9 rounded-full border px-3 text-xs font-semibold transition-colors ${chosen ? 'border-[#274d7d] bg-[#274d7d] text-white' : missing ? 'border-[#f0b4ad] bg-white text-[#1b293a]' : 'border-[#cfd9e3] bg-white text-[#1b293a] hover:bg-[#f3f6f9]'}`}>
                {copy.options[question][option]}
              </button>
            })}
          </div>
        </div>
      })}
    </div>
  </fieldset>
}
