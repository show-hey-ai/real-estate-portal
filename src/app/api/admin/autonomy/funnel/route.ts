import { NextRequest,NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminUser } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { funnelHash, funnelEvents, updateFunnelState } from '@/lib/buyer-funnel-server'
import { stateSchema, summarize, variantSchema, campaignSummary } from '@/lib/buyer-funnel-policy'
import { PORTAL_VENTURE_ID } from '@/lib/autonomy/policy'
import { boundedFunnelBody } from '@/lib/buyer-funnel-request'
export const dynamic='force-dynamic'
const headers={'Cache-Control':'private, no-store'}
export async function GET() {
  const auth=await requireAdminUser();if(!auth.ok) return auth.response
  try {
    const record=await prisma.autonomyRecord.findUnique({where:{ventureId_dedupeKey:{ventureId:PORTAL_VENTURE_ID,dedupeKey:'buyer-funnel:state'}}})
    const parsed=stateSchema.safeParse(record?.content)
    if(!parsed.success) return NextResponse.json({error:'まだ有効化されていません'},{status:503,headers})
    const state=parsed.data,events=await funnelEvents(state)
    const decisions=await prisma.autonomyRecord.findMany({where:{ventureId:PORTAL_VENTURE_ID,recordType:'buyer_funnel_decision'},orderBy:{createdAt:'desc'},take:10,select:{content:true,title:true}})
    const operating=await prisma.autonomyPolicy.findUnique({where:{id:PORTAL_VENTURE_ID},select:{enabled:true}})
    const campaigns=campaignSummary(events,Date.now())
    return NextResponse.json({state,active:!!operating?.enabled&&state.enabled&&state.hash===funnelHash,metrics:summarize(events,Date.now()),campaigns,decisions},{headers})
  } catch { return NextResponse.json({error:'計測記録を取得できません。現在の表示を維持します。'},{status:503,headers}) }
}
const command=z.object({revision:z.number().int().nonnegative(),enabled:z.boolean().optional(),manual:variantSchema.nullable().optional()}).strict().refine(v=>v.enabled!==undefined || v.manual!==undefined)
export async function POST(request:NextRequest) {
  if(request.headers.get('origin')!==request.nextUrl.origin) return new NextResponse(null,{status:403})
  const auth=await requireAdminUser();if(!auth.ok) return auth.response
  const raw=await boundedFunnelBody(request);if(raw===null) return new NextResponse(null,{status:413})
  let body:unknown;try{body=JSON.parse(raw)}catch{return new NextResponse(null,{status:400})}
  const input=command.safeParse(body);if(!input.success) return new NextResponse(null,{status:400})
  try {const {revision,...change}=input.data;return NextResponse.json(await updateFunnelState(revision,change,auth.user.id),{headers})}
  catch {return NextResponse.json({error:'設定が更新されています。再読込してください。'},{status:409,headers})}
}
