import { createHash, createHmac, randomInt, randomUUID } from 'node:crypto'
import { cookies } from 'next/headers'
import { type AutonomyJob, type Prisma } from '@prisma/client'
import { prisma } from './db'
import { catalogFingerprint } from './buyer-funnel-copy'
import { day, decide, stateSchema, summarize, funnelVersion, type FunnelEvent, type FunnelState } from './buyer-funnel-policy'
import { excludedVisitor, funnelCookie, readToken, type FunnelToken } from './buyer-funnel-token'
import { PORTAL_VENTURE_ID } from './autonomy/policy'
import { withLiveLease } from './autonomy/lease'

export const funnelHash=createHash('sha256').update(catalogFingerprint).digest('hex')
const key={ventureId:PORTAL_VENTURE_ID,dedupeKey:'buyer-funnel:state'}
export function initialFunnelState():FunnelState { return {revision:0,enabled:true,manual:null,id:randomUUID(),hash:funnelHash,incumbent:'original',challenger:'criteria',remaining:['question'],startedAt:new Date().toISOString(),closedAt:null} }
export async function funnelState() {
  const [policy,record]=await Promise.all([prisma.autonomyPolicy.findUnique({where:{id:PORTAL_VENTURE_ID},select:{enabled:true}}),prisma.autonomyRecord.findUnique({where:{ventureId_dedupeKey:key}})])
  const parsed=stateSchema.safeParse(record?.content)
  return policy?.enabled && parsed.success && parsed.data.hash===funnelHash ? parsed.data : null
}
export function tokenForState(state:FunnelState,previous:FunnelToken|null,enroll=true):FunnelToken|null {
  if(!state.enabled || state.manual || !state.challenger) return null
  if(previous?.experiment===state.id && previous.hash===state.hash && [state.incumbent,state.challenger].includes(previous.variant)) return previous
  if(state.closedAt || !enroll) return null
  return {id:randomUUID(),experiment:state.id,hash:state.hash,variant:randomInt(2) ? state.challenger : state.incumbent,issued:Date.now()}
}
export async function funnelEvents(state:FunnelState,client:Pick<Prisma.TransactionClient,'autonomyRecord'>=prisma) {
  const records=await client.autonomyRecord.findMany({where:{ventureId:PORTAL_VENTURE_ID,recordType:'buyer_funnel_event',sources:{equals:[state.id]}},orderBy:{createdAt:'asc'},take:20001})
  if(records.length>20000) throw new Error('Funnel cohort exceeded bounded analysis size; keep current copy')
  return records.map(r=>r.content as unknown as FunnelEvent)
}
async function saveEvent(token:FunnelToken,event:string,surface:string,campaign='',at=Date.now(),subject?:string) {
  await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
    const [policy,record]=await Promise.all([tx.autonomyPolicy.findUnique({where:{id:PORTAL_VENTURE_ID}}),tx.autonomyRecord.findUnique({where:{ventureId_dedupeKey:key}})])
    const parsed=stateSchema.safeParse(record?.content)
    if(!policy?.enabled || !parsed.success) return
    const state=parsed.data
    if(!state.enabled || state.manual || state.hash!==funnelHash || state.id!==token.experiment || token.hash!==state.hash || !state.challenger || ![state.incumbent,state.challenger].includes(token.variant)) return
    if(at<token.issued || at>Date.now() || (state.closedAt && (event==='exposure' || event==='click' || event==='submit'))) return
    const exposure=await tx.autonomyRecord.findFirst({where:{ventureId:PORTAL_VENTURE_ID,recordType:'buyer_funnel_event',dedupeKey:{startsWith:`buyer-funnel:${state.id}:${token.id}:exposure:`}},orderBy:{createdAt:'asc'}})
    if(event!=='exposure' && (!exposure || at<(exposure.content as unknown as FunnelEvent).at || at>(exposure.content as unknown as FunnelEvent).at+day)) return
    const authenticated=event==='registration'||event==='consultation'
    if(authenticated&&!subject) return
    const identity=authenticated ? createHmac('sha256',process.env.AUTONOMY_CRON_SECRET!).update('funnel-subject:'+subject).digest('hex') : token.id
    const dedupeKey=`buyer-funnel:${state.id}:${identity}:${event}:${authenticated?'journey':surface}`
    const content={assignment:token.id,variant:token.variant,event,at,surface,campaign}
    const size=await tx.autonomyRecord.count({where:{ventureId:PORTAL_VENTURE_ID,recordType:'buyer_funnel_event',sources:{equals:[state.id]}}})
    if(size>=20000) {
      await tx.autonomyRecord.update({where:{ventureId_dedupeKey:key},data:{content:{...state,enabled:false,revision:state.revision+1}}})
      await tx.autonomyRecord.upsert({where:{ventureId_dedupeKey:{ventureId:PORTAL_VENTURE_ID,dedupeKey:`buyer-funnel:capacity:${state.id}`}},create:{ventureId:PORTAL_VENTURE_ID,dedupeKey:`buyer-funnel:capacity:${state.id}`,recordType:'buyer_funnel_warning',title:'Buyer funnel paused: cohort event capacity reached',content:{experiment:state.id,reason:'incomplete_cohort',limit:20000},sources:[state.id],verification:'failed',version:funnelVersion},update:{}})
      return
    }
    await tx.autonomyRecord.upsert({where:{ventureId_dedupeKey:{ventureId:PORTAL_VENTURE_ID,dedupeKey}},create:{ventureId:PORTAL_VENTURE_ID,dedupeKey,recordType:'buyer_funnel_event',title:event,content,sources:[state.id],verification:event==='registration'||event==='consultation'?'verified':'observed',version:funnelVersion},update:{}})
  },{timeout:10000})
}
export async function clientFunnelEvent(token:FunnelToken,event:'exposure'|'click'|'submit',surface:string,campaign:string) { await saveEvent(token,event,surface,campaign) }
// Server-confirmed success only. Failure of analytics must never break authentication or chat.
export async function confirmedFunnelEvent(user:{id:string;email?:string;created_at?:string;email_confirmed_at?:string},event:'registration'|'consultation',at=new Date(),requestHeaders?:Headers) {
  try {
    if(!user.email || (requestHeaders && excludedVisitor(requestHeaders))) return
    const local=await prisma.user.findUnique({where:{email:user.email},select:{role:true}})
    if(local?.role==='ADMIN') return
    const token=readToken((await cookies()).get(funnelCookie)?.value,process.env.AUTONOMY_CRON_SECRET||'')
    if(!token || (event==='registration' && (!user.email_confirmed_at || !user.created_at || new Date(user.created_at).getTime()<token.issued))) return
    if(requestHeaders?.get('x-ziyou-funnel-assignment')!==token.id) return
    await saveEvent(token,event,'journey','',at.getTime(),user.id)
  } catch { console.error('Buyer funnel conversion recording unavailable') }
}
export async function evaluateBuyerFunnel(job:AutonomyJob) {
  const state=await funnelState()
  if(!state || !state.enabled || state.manual || !state.challenger) return {status:'paused_or_complete'}
  const events=await funnelEvents(state), now=Date.now(), metrics=summarize(events,now)
  const ready=now-new Date(state.startedAt).getTime()>=14*day && metrics[state.incumbent].visitors>=200 && metrics[state.challenger].visitors>=200
  if(!state.closedAt && !ready) return {status:'collecting',metrics}
  if(state.closedAt && now<new Date(state.closedAt).getTime()+day) return {status:'maturing',metrics}
  return withLiveLease(job,async tx=>{
    const current=await tx.autonomyRecord.findUnique({where:{ventureId_dedupeKey:key}})
    const currentState=stateSchema.safeParse(current?.content)
    if(!currentState.success || currentState.data.revision!==state.revision || currentState.data.id!==state.id || currentState.data.hash!==state.hash || !currentState.data.enabled || currentState.data.manual) return {status:'operator_changed'}
    // Freeze final outcomes under the same lock as client/conversion writers.
    const mature=summarize(state.closedAt ? await funnelEvents(state,tx) : events,Date.now(),true)
    const outcome=state.closedAt ? decide(mature[state.incumbent],mature[state.challenger!]) : null
    let next:FunnelState
    if(!state.closedAt) next={...state,revision:state.revision+1,closedAt:new Date().toISOString()}
    else {
      const incumbent=outcome==='challenger'?state.challenger!:state.incumbent
      next={...state,revision:state.revision+1,id:randomUUID(),incumbent,challenger:state.remaining[0]||null,remaining:state.remaining.slice(1),startedAt:new Date(now).toISOString(),closedAt:null}
      await tx.autonomyRecord.create({data:{ventureId:PORTAL_VENTURE_ID,dedupeKey:`buyer-funnel:decision:${state.id}`,recordType:'buyer_funnel_decision',title:outcome==='challenger'?'Better inquiry copy adopted':'Current copy retained',content:{experiment:state.id,outcome,incumbent,metrics:mature,decisionAt:new Date(now).toISOString(),hash:state.hash},sources:[state.id],verification:'verified',version:funnelVersion}})
    }
    await tx.autonomyRecord.update({where:{ventureId_dedupeKey:key},data:{content:next as unknown as Prisma.InputJsonValue}})
    return {status:outcome||'maturing',metrics:mature}
  },10000)
}
export async function updateFunnelState(revision:number,change:{enabled?:boolean;manual?:FunnelState['manual']},operatorId:string) {
  return prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
    const record=await tx.autonomyRecord.findUnique({where:{ventureId_dedupeKey:key}})
    const state=stateSchema.parse(record?.content)
    if(state.revision!==revision) throw new Error('STATE_CHANGED')
    // Pausing/manual switching invalidates the cohort rather than mixing treatments.
    const next={...state,...change,revision:revision+1,id:randomUUID(),startedAt:new Date().toISOString(),closedAt:null}
    await tx.autonomyRecord.update({where:{ventureId_dedupeKey:key},data:{content:next}})
    await tx.adminLog.create({data:{adminId:operatorId,action:'BUYER_FUNNEL_CONFIG',targetType:'AutonomyRecord',targetId:record!.id,detail:JSON.stringify({revision:next.revision,enabled:next.enabled,manual:next.manual})}})
    return next
  })
}
