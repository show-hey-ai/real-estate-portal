'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2 } from 'lucide-react'

interface AlertTokenActionProps {
  token: string
  endpoint: '/api/alerts/confirm' | '/api/alerts/unsubscribe'
  title: string
  description: string
  button: string
  done: string
  failed: string
  back: string
}

type State = 'idle' | 'sending' | 'done' | 'failed'

/** One button that confirms or cancels alerts; acting needs a press, not just opening the link. */
export function AlertTokenAction({ token, endpoint, title, description, button, done, failed, back }: AlertTokenActionProps) {
  const [state, setState] = useState<State>('idle')
  const submit = async () => {
    setState('sending')
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) })
      setState(response.ok ? 'done' : 'failed')
    } catch {
      setState('failed')
    }
  }
  return <div className="mx-auto max-w-xl rounded-2xl border border-[#dbe2e9] bg-white p-6 text-center md:p-10">
    <h1 className="text-2xl font-semibold text-[#1b293a]">{title}</h1>
    {state === 'done'
      ? <p className="mt-4 flex items-center justify-center gap-2 font-semibold text-[#3f5f39]" role="status"><CheckCircle2 aria-hidden="true" className="h-5 w-5" />{done}</p>
      : <>
        <p className="mt-3 text-sm leading-7 text-[#536274]">{description}</p>
        <button type="button" onClick={submit} disabled={state === 'sending' || !token} className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#274d7d] px-6 font-semibold text-white hover:bg-[#18375f] disabled:opacity-60">{state === 'sending' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{button}</button>
        {state === 'failed' && <p className="mt-4 text-sm text-[#b42318]" role="alert">{failed}</p>}
      </>}
    <p className="mt-8"><Link href="/listings" className="text-sm font-semibold text-[#274d7d] hover:underline">{back}</Link></p>
  </div>
}
