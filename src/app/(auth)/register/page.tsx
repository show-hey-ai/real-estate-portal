'use client'

import { FunnelText, useBuyerFunnelRecord, useBuyerFunnelHeaders } from '@/components/analytics/buyer-funnel'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Loader2 } from 'lucide-react'
import { safeAuthRedirect } from '@/lib/auth-redirect'
import { AuthBrandPanel } from '@/components/auth/auth-brand-panel'
import { AuthAlternatives } from '@/components/auth/auth-alternatives'
import { authCallbackUrl } from '@/lib/login-methods'

export default function RegisterPage() {
  const recordFunnel = useBuyerFunnelRecord()
  const funnelHeaders = useBuyerFunnelHeaders()
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeAuthRedirect(searchParams.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [alternativeBusy, setAlternativeBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (alternativeBusy || isLoading) return

    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch'))
      return
    }

    recordFunnel('submit', 'registerButton')
    setIsLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallbackUrl(window.location.origin, redirect, funnelHeaders['x-ziyou-funnel-assignment']),
      },
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    if (data.session) await fetch('/api/analytics/funnel/registration', { method: 'POST', headers: funnelHeaders }).catch(() => {})
    toast.success(t('registrationSuccess'))
    router.push(data.session ? redirect : `/login?redirect=${encodeURIComponent(redirect)}`)
    router.refresh()
  }

  return (
    <div data-testid="auth-page" className="min-h-screen bg-[#f7f5ed] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.78fr)]">
      <AuthBrandPanel />
      <div className="flex min-h-screen items-center justify-center p-5 sm:p-8">
      <Card className="portal-surface w-full max-w-md rounded-[12px] border-[#d9d2bd] py-2">
        <CardHeader className="text-center">
          <Link href="/" className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8" />
            <span className="font-bold text-xl">{tCommon('appName')}</span>
          </Link>
          <CardTitle><FunnelText field="registerTitle" baseline={t('registerTitle')} /></CardTitle>
          <CardDescription>
            {t('hasAccount')}{' '}
            <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline">
              {t('loginTitle')}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthAlternatives placement="top" redirect={redirect} disabled={isLoading} onBusyChange={setAlternativeBusy} />
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || alternativeBusy}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || alternativeBusy}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading || alternativeBusy}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || alternativeBusy}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                <FunnelText field="registerButton" baseline={t('registerButton')} />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
