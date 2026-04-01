import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: dbUser, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('email', authUser.email)
    .single()

  if (userError || !dbUser || dbUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params

  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      media (
        id,
        url,
        category,
        sortOrder,
        isAdopted
      )
    `)
    .eq('id', id)
    .single()

  if (error || !listing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ listing })
}
