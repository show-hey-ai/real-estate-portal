'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PasswordRecovery({ mode }: { mode: 'request' | 'reset' }) {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(mode === 'request')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (mode !== 'reset') {
      if (new URLSearchParams(window.location.search).get('error') === 'auth_failed') setError(t('resetLinkInvalid'))
      return
    }
    let active = true
    const supabase = createClient()
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return
      if (error || !data.user) setError(t('resetLinkInvalid'))
      else setReady(true)
    }).catch(() => { if (active) setError(t('resetLinkInvalid')) })
    return () => { active = false }
  }, [mode, t])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (busy || !ready) return
    setError('')
    if (mode === 'reset' && password !== confirm) {
      setError(t('passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      const supabase = createClient()
      if (mode === 'request') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/api/auth/callback?next=%2Freset-password`,
        })
        if (error) throw error
      } else {
        const { data, error: authError } = await supabase.auth.getUser()
        if (authError || !data.user) { setReady(false); setError(t('resetLinkInvalid')); return }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        const { error: signOutError } = await supabase.auth.signOut()
        if (signOutError) setError(t('resetLogoutFailed'))
        setPassword('')
        setConfirm('')
      }
      setDone(true)
    } catch {
      setError(t('recoveryError'))
    } finally { setBusy(false) }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ed] p-5">
      <Card className="portal-surface w-full max-w-md border-[#d9d2bd]">
        <CardHeader><CardTitle>{t(mode === 'request' ? 'forgotPassword' : 'resetPasswordTitle')}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {done ? <p role="status">{t(mode === 'request' ? 'resetEmailSent' : 'passwordResetSuccess')}</p> : ready ? (
            <form onSubmit={submit} className="space-y-4">
              {mode === 'request' ? <>
                <p className="text-sm text-muted-foreground">{t('resetEmailHelp')}</p>
                <Label htmlFor="recovery-email">{t('email')}</Label>
                <Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
              </> : <>
                <p className="text-sm text-muted-foreground">{t('newPasswordHelp')}</p>
                <Label htmlFor="new-password">{t('newPassword')}</Label>
                <Input id="new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} />
                <Label htmlFor="confirm-new-password">{t('confirmPassword')}</Label>
                <Input id="confirm-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={busy} />
              </>}
              <Button className="w-full" disabled={busy}>{t(busy ? 'recoveryLoading' : mode === 'request' ? 'sendResetEmail' : 'saveNewPassword')}</Button>
            </form>
          ) : !error && <p role="status">{t('recoveryLoading')}</p>}
          {mode === 'reset' && !ready && error && <Link className="block text-primary hover:underline" href="/forgot-password">{t('sendResetEmail')}</Link>}
          {done && mode === 'reset' && error && <Button variant="outline" disabled={busy} onClick={async () => {
            setBusy(true)
            try {
              const { error } = await createClient().auth.signOut()
              setError(error ? t('resetLogoutFailed') : '')
            } catch { setError(t('resetLogoutFailed')) }
            finally { setBusy(false) }
          }}>{t('retryLogout')}</Button>}
          <Link className="block text-sm text-primary hover:underline" href="/login">{t('backToLogin')}</Link>
        </CardContent>
      </Card>
    </div>
  )
}
