import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { confirmedFunnelEvent } from '@/lib/buyer-funnel-server'
import { allowFunnelRequest } from '@/lib/buyer-funnel-request'
export async function POST(request:NextRequest) {
  if(request.headers.get('origin')!==new URL(request.url).origin) return new NextResponse(null,{status:403})
  if(!allowFunnelRequest(request.headers)) return new NextResponse(null,{status:429})
  const {data:{user}}=await (await createClient()).auth.getUser()
  if(!user?.email_confirmed_at) return new NextResponse(null,{status:401})
  await confirmedFunnelEvent(user,'registration',new Date(),request.headers)
  return new NextResponse(null,{status:204})
}
