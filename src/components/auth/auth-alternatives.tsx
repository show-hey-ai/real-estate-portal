'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { Provider } from '@supabase/supabase-js'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { useBuyerFunnelHeaders } from '@/components/analytics/buyer-funnel'
import { emailLoginRequest, loginMethod, parseLoginMethods, socialLoginRequest, type LoginMethods, type SocialMethodId } from '@/lib/login-methods'
import { getLoginMethodsCopy, socialButtonLabel } from '@/lib/login-methods-copy'

export function AuthAlternatives({ redirect, disabled = false, onBusyChange }: { redirect: string; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const locale = useLocale(), copy = getLoginMethodsCopy(locale), t = useTranslations('auth')
  const headers = useBuyerFunnelHeaders()
  const [methods, setMethods] = useState<LoginMethods>({ providers: [], emailLink: false })
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    void fetch('/api/auth/methods', { signal: controller.signal }).then(async response => {
      if (response.ok) {
        const value = parseLoginMethods(await response.json())
        if (!controller.signal.aborted) setMethods(value)
      }
    }).catch(() => {}).finally(() => clearTimeout(timer))
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])

  const assignment = headers['x-ziyou-funnel-assignment']
  const locked = disabled || busy !== null
  function working(value: string | null) { setBusy(value); onBusyChange?.(value !== null) }
  async function startSocial(id: SocialMethodId) {
    if (locked || !methods.providers.includes(id)) return
    working(id); setError(null)
    try {
      const request = socialLoginRequest(id, window.location.origin, redirect, assignment)
      const result = await createClient().auth.signInWithOAuth({ ...request, provider: request.provider as Provider })
      if (result.error || !result.data.url) { setError(copy.failed); working(null) }
    } catch { setError(copy.failed); working(null) }
  }

  async function sendLink(event: React.FormEvent) {
    event.preventDefault()
    if (locked || !methods.emailLink) return
    working('email'); setError(null)
    try {
      const { error } = await createClient().auth.signInWithOtp(emailLoginRequest(email, window.location.origin, redirect, assignment))
      if (error) setError(copy.emailFailed)
      else setSent(true)
    } catch { setError(copy.emailFailed) }
    finally { working(null) }
  }

  if (!methods.providers.length && !methods.emailLink) return null
  return (
    <div data-testid="auth-alternatives" className="mt-6 space-y-4 border-t pt-5">
      <p className="text-center text-xs text-muted-foreground">{copy.or}</p>
      {methods.providers.length > 0 && <div className="space-y-2">
        {methods.providers.map(id => <Button key={id} type="button" variant="outline" className="min-h-11 w-full whitespace-normal" disabled={locked} onClick={() => void startSocial(id)}>
          {busy === id && <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />}
          {busy === id ? copy.connecting : socialButtonLabel(loginMethod(id)!.name, locale)}
        </Button>)}
        <p className="text-xs leading-relaxed text-muted-foreground">{copy.notice}</p>
      </div>}
      {methods.emailLink && <details className="rounded-lg border bg-muted/20 p-3" data-testid="email-login">
        <summary className="cursor-pointer text-sm font-medium text-primary">{copy.emailLink}</summary>
        {sent ? <div className="mt-3 space-y-3">
          <p role="status" className="text-sm leading-relaxed">{copy.sent}</p>
          <Button type="button" variant="outline" className="min-h-11 w-full whitespace-normal" disabled={locked} onClick={() => { setSent(false); setEmail(''); setError(null) }}>{copy.change}</Button>
        </div> : <form onSubmit={sendLink} className="mt-3 space-y-3">
          <p className="text-xs leading-relaxed text-muted-foreground">{copy.emailNote}</p>
          <Label htmlFor="link-email">{t('email')}</Label>
          <Input id="link-email" name="email" type="email" autoComplete="email" maxLength={254} value={email} required disabled={locked} onChange={event => setEmail(event.target.value)} />
          <Button type="submit" className="min-h-11 w-full whitespace-normal" disabled={locked}>
            {busy === 'email' ? <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" /> : <Mail aria-hidden="true" className="mr-2 h-4 w-4" />}{copy.send}
          </Button>
        </form>}
      </details>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
