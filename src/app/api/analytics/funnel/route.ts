import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { funnelState, tokenForState, clientFunnelEvent } from '@/lib/buyer-funnel-server'
import { excludedVisitor, funnelCookie, readToken, signToken } from '@/lib/buyer-funnel-token'
import { funnelFields, catalogFingerprint } from '@/lib/buyer-funnel-copy'
import { allowFunnelRequest, boundedFunnelBody } from '@/lib/buyer-funnel-request'
import { variantSchema } from '@/lib/buyer-funnel-policy'

export const dynamic='force-dynamic'
const input=z.object({event:z.enum(['assignment','exposure','click','submit']),enroll:z.boolean().optional(),surface:z.enum(funnelFields).optional(),campaign:z.string().regex(/^[a-zA-Z0-9_.:-]{0,100}$/).default(''),assignment:z.string().uuid().optional(),variant:variantSchema.optional(),hash:z.string().regex(/^[a-f0-9]{64}$/).optional()}).strict()
const empty=()=>NextResponse.json({variant:'original',tracking:false,catalog:catalogFingerprint},{headers:{'Cache-Control':'private, no-store'}})
export async function POST(request:NextRequest) {
  if(request.headers.get('origin')!==new URL(request.url).origin) return new NextResponse(null,{status:403})
  if(excludedVisitor(request.headers)) return empty()
  if(!allowFunnelRequest(request.headers)) return new NextResponse(null,{status:429,headers:{'Retry-After':'60'}})
  try {
    const raw=await boundedFunnelBody(request)
    if(raw===null) return new NextResponse(null,{status:413})
    const parsed=input.safeParse(JSON.parse(raw))
    if(!parsed.success) return new NextResponse(null,{status:400})
    const secret=process.env.AUTONOMY_CRON_SECRET||''
    if(secret.length<32) return empty()
    const previous=readToken(request.cookies.get(funnelCookie)?.value,secret)
    if(parsed.data.event==='assignment' && parsed.data.enroll===false && !previous) return empty()
    const supabase=await createClient(), {data:{user}}=await supabase.auth.getUser()
    if(user?.email && (await prisma.user.findUnique({where:{email:user.email},select:{role:true}}))?.role==='ADMIN') return empty()
    const state=await funnelState()
    if(!state) return empty()
    if(!state.enabled) return NextResponse.json({variant:state.manual||state.incumbent,tracking:false,catalog:catalogFingerprint},{headers:{'Cache-Control':'private, no-store'}})
    if(parsed.data.event==='assignment') {
      const token=tokenForState(state,previous,parsed.data.enroll!==false)
      const response=NextResponse.json({variant:state.manual||token?.variant||state.incumbent,tracking:!!token,catalog:catalogFingerprint,hash:state.hash,experiment:token?.experiment,assignment:token?.id},{headers:{'Cache-Control':'private, no-store'}})
      if(token && token!==previous) response.cookies.set(funnelCookie,signToken(token,secret),{httpOnly:true,secure:request.nextUrl.protocol==='https:',sameSite:'lax',path:'/',maxAge:30*86400})
      return response
    }
    if(!previous || !parsed.data.surface || previous.experiment!==state.id || previous.hash!==state.hash || parsed.data.assignment!==previous.id || parsed.data.variant!==previous.variant || parsed.data.hash!==previous.hash) return new NextResponse(null,{status:204})
    await clientFunnelEvent(previous,parsed.data.event,parsed.data.surface,parsed.data.campaign)
    return new NextResponse(null,{status:204,headers:{'Cache-Control':'private, no-store'}})
  } catch { return empty() }
}
