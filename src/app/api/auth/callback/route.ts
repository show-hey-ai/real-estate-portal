import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // DBにユーザーが存在しなければ作成
      const existingUser = await prisma.user.findUnique({
        where: { email: data.user.email! },
      })

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: data.user.email!,
            name: data.user.user_metadata?.name || null,
          },
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
