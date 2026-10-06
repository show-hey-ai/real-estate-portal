import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) {
    return new NextResponse('Origin rejected', { status: 403, headers: { 'Cache-Control': 'private, no-store' } })
  }
  const supabase = await createClient()
  await supabase.auth.signOut()

  // A relative location stays on the domain that received the form. 303 turns
  // the logout POST into a GET even when an old deployment URL is configured.
  return new NextResponse(null, { status: 303, headers: { Location: '/', 'Cache-Control': 'private, no-store' } })
}
