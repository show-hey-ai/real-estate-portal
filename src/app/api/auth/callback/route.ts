import { confirmedFunnelEvent } from '@/lib/buyer-funnel-server'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeAuthRedirect } from '@/lib/auth-redirect'
import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeAuthRedirect(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const clearFailedSession = async () => {
      try { await supabase.auth.signOut({ scope: 'local' }) } catch { /* Clear local cookies even when remote revocation is unavailable. */ }
      const cookieStore = await cookies()
      const project = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]
      const prefix = `sb-${project}-auth-token`
      for (const { name } of cookieStore.getAll()) {
        if (name === prefix || name.startsWith(`${prefix}.`) || name === `${prefix}-code-verifier` || name.startsWith(`${prefix}-code-verifier.`)) cookieStore.set(name, '', { path: '/', maxAge: 0 })
      }
    }
    let exchanged = false
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      exchanged = !error && !!data.user
      if (!error && data.user?.email) {
        // Provider metadata must never change an existing user's role or profile.
        const name = data.user.user_metadata?.name ?? data.user.user_metadata?.full_name
        await prisma.user.upsert({
          where: { email: data.user.email },
          create: { email: data.user.email, name: typeof name === 'string' ? name.slice(0, 128) : null },
          update: {},
        })
        const funnelHeaders = new Headers(request.headers)
        funnelHeaders.set('x-ziyou-funnel-assignment', searchParams.get('funnel_assignment') || '')
        await confirmedFunnelEvent(data.user, 'registration', new Date(), funnelHeaders)
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (data.user) await clearFailedSession()
    } catch {
      if (exchanged) await clearFailedSession()
      console.error('Portal authentication completion unavailable')
    }
  }

  if (next === '/reset-password') return NextResponse.redirect(`${origin}/forgot-password?error=auth_failed`)
  return NextResponse.redirect(`${origin}/login?error=auth_failed&redirect=${encodeURIComponent(next)}`)
}
