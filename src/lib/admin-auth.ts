import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

interface AdminUser {
  id: string
  email: string
}

type AdminSessionResult =
  | { status: 'unauthorized' }
  | { status: 'forbidden' }
  | { status: 'ok'; user: AdminUser }

async function getAdminSession(): Promise<AdminSessionResult> {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    return { status: 'unauthorized' }
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, role: true },
  })

  if (!dbUser || dbUser.role !== 'ADMIN') {
    return { status: 'forbidden' }
  }

  return {
    status: 'ok',
    user: {
      id: dbUser.id,
      email: dbUser.email,
    },
  }
}

export async function getAdminUserFromSession(): Promise<AdminUser | null> {
  const session = await getAdminSession()
  return session.status === 'ok' ? session.user : null
}

export async function requireAdminUser(): Promise<
  | { ok: true; user: AdminUser }
  | { ok: false; response: NextResponse }
> {
  const session = await getAdminSession()

  if (session.status === 'unauthorized') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  if (session.status === 'forbidden') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    user: session.user,
  }
}
