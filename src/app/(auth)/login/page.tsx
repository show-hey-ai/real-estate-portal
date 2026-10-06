'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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
import { getLoginMethodsCopy } from '@/lib/login-methods-copy'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tCommon = useTranslations('common')
  const loginCopy = getLoginMethodsCopy(useLocale())
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeAuthRedirect(searchParams.get('redirect'))

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [alternativeBusy, setAlternativeBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (alternativeBusy || isLoading) return
    setIsLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      toast.error(error.message)
      setIsLoading(false)
      return
    }

    router.push(redirect)
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
          <CardTitle>{t('loginTitle')}</CardTitle>
          <CardDescription>
            {t('noAccount')}{' '}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-primary hover:underline">
              {t('registerTitle')}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searchParams.get('error') === 'auth_failed' && <p role="alert" className="mb-4 text-sm text-destructive">{loginCopy.failed}</p>}
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
              />
            </div>
            <Link href="/forgot-password" className="block text-right text-sm text-primary hover:underline">{t('forgotPassword')}</Link>
            <Button type="submit" className="w-full" disabled={isLoading || alternativeBusy}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                t('loginButton')
              )}
            </Button>
          </form>
          <div className="mt-6 border-t pt-5 text-center">
            <p className="mb-3 text-sm text-muted-foreground">{t('noAccount')}</p>
            <Button asChild variant="outline" className="w-full min-h-11 border-primary text-primary">
              <Link href={`/register?redirect=${encodeURIComponent(redirect)}`}>{t('registerTitle')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
