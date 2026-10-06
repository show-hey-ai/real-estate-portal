import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import Module from 'node:module'
import { randomUUID } from 'node:crypto'
import { day,type FunnelState } from '../src/lib/buyer-funnel-policy'
import {signToken,type FunnelToken} from '../src/lib/buyer-funnel-token'
const require=createRequire(import.meta.url)
const secret='test-funnel-signing-secret-for-fixtures-only'
process.env.AUTONOMY_CRON_SECRET=secret
let state:FunnelState,enabled=true,lease=true,cookie='',role='USER'
const records:{dedupeKey:string;recordType:string;content:any;sources:string[]}[]=[]
// JSONB deliberately returns reordered keys, reproducing the production serialization boundary.
function jsonb(v:unknown){return JSON.parse(JSON.stringify(v,Object.keys(v as object).sort()))}
const tx:any={
 $queryRaw:async()=>[],
 autonomyPolicy:{findUnique:async()=>({enabled})},
 user:{findUnique:async()=>({role})},
 autonomyRecord:{
  count:async()=>records.filter(r=>r.recordType==='buyer_funnel_event').length,
  findUnique:async()=>({id:'state-row',content:jsonb(state)}),
  findMany:async()=>records.filter(r=>r.recordType==='buyer_funnel_event'&&r.sources[0]===state.id),
  findFirst:async({where}:any)=>records.find(r=>r.dedupeKey.startsWith(where.dedupeKey.startsWith)),
  update:async({data}:any)=>{state=data.content;return {content:state}},
  create:async({data}:any)=>{assert(!records.some(r=>r.dedupeKey===data.dedupeKey));records.push(data);return data},
  upsert:async({create}:any)=>{const old=records.find(r=>r.dedupeKey===create.dedupeKey);if(!old)records.push(create);return old||create},
 },
 adminLog:{create:async()=>({})},
}
const db={...tx,$transaction:async(action:any)=>action(tx)}
const loader=Module as unknown as {_load:(id:string,parent:any,...args:any[])=>any}
const old=loader._load
loader._load=function(id,parent,...args){
 if(parent?.filename?.endsWith('buyer-funnel-server.ts')){
  if(id==='./db')return {prisma:db}
  if(id==='./autonomy/lease')return {withLiveLease:async(_job:any,action:any)=>{if(!enabled||!lease)throw new Error('lease changed');return action(tx,{enabled})}}
  if(id==='next/headers')return {cookies:async()=>({get:()=>cookie?{value:cookie}:undefined})}
 }
 return old.call(this,id,parent,...args)
}
const server=require('../src/lib/buyer-funnel-server') as typeof import('../src/lib/buyer-funnel-server')
loader._load=old
function reset(){state=server.initialFunnelState();state.startedAt=new Date(Date.now()-15*day).toISOString();enabled=true;lease=true;role='USER';cookie='';records.length=0}
function exposure(assignment:string,variant:'original'|'criteria',at=Date.now()-day-10){records.push({dedupeKey:`buyer-funnel:${state.id}:${assignment}:exposure:consult`,recordType:'buyer_funnel_event',content:{assignment,variant,event:'exposure',at,surface:'consult',campaign:''},sources:[state.id]})}
function cohort(){for(let i=0;i<200;i++){exposure('a'+i,'original');exposure('b'+i,'criteria');if(i<3)records.push({dedupeKey:'ca'+i,recordType:'buyer_funnel_event',content:{assignment:'a'+i,variant:'original',event:'consultation',at:Date.now()-day,surface:'journey',campaign:''},sources:[state.id]});if(i<60)records.push({dedupeKey:'cb'+i,recordType:'buyer_funnel_event',content:{assignment:'b'+i,variant:'criteria',event:'consultation',at:Date.now()-day,surface:'journey',campaign:''},sources:[state.id]})}}
test('live engine closes cohort with JSONB order, waits maturity, adopts exactly once, then advances',async()=>{
 reset();cohort();const id=state.id
 assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'maturing');assert(state.closedAt)
 assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'maturing')
 state.closedAt=new Date(Date.now()-day-1).toISOString()
 assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'challenger');assert.equal(state.incumbent,'criteria');assert.equal(state.challenger,'question');assert.notEqual(state.id,id)
 assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'collecting');assert.equal(records.filter(r=>r.recordType==='buyer_funnel_decision').length,1)
})
test('global stop, manual preference, expired lease and low data cannot adopt',async()=>{
 reset();assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'collecting');cohort()
 enabled=false;assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'paused_or_complete')
 enabled=true;state.manual='question';assert.equal((await server.evaluateBuyerFunnel({} as any)).status,'paused_or_complete')
 state.manual=null;lease=false;await assert.rejects(server.evaluateBuyerFunnel({} as any),/lease changed/);assert.equal(state.closedAt,null)
})
test('staff and old signup/replayed message never become fresh conversions; successful inquiry dedupes',async()=>{
 reset();const token:FunnelToken={id:randomUUID(),experiment:state.id,hash:state.hash,variant:'criteria',issued:Date.now()-1000};cookie=signToken(token,secret)
 exposure(token.id,'criteria',Date.now()-500)
 const user={id:randomUUID(),email:'fixture@example.test',created_at:new Date(token.issued-10).toISOString(),email_confirmed_at:new Date().toISOString()}
 await server.confirmedFunnelEvent(user,'registration',new Date(),new Headers({'x-ziyou-funnel-assignment':token.id}));assert.equal(records.length,1)
 await server.confirmedFunnelEvent(user,'consultation',new Date(token.issued-10),new Headers({'x-ziyou-funnel-assignment':token.id}));assert.equal(records.length,1)
 role='ADMIN';await server.confirmedFunnelEvent(user,'consultation',new Date(),new Headers({'x-ziyou-funnel-assignment':token.id}));assert.equal(records.length,1)
 role='USER';await server.confirmedFunnelEvent(user,'consultation',new Date(),new Headers({'x-ziyou-funnel-assignment':token.id}));await server.confirmedFunnelEvent(user,'consultation',new Date(),new Headers({'x-ziyou-funnel-assignment':token.id}));assert.equal(records.filter(r=>r.content.event==='consultation').length,1)
 const second={...token,id:randomUUID(),variant:'original' as const};cookie=signToken(second,secret);exposure(second.id,'original',Date.now()-300)
 await server.confirmedFunnelEvent(user,'consultation',new Date(),new Headers({'x-ziyou-funnel-assignment':second.id}));assert.equal(records.filter(r=>r.content.event==='consultation').length,1)
})
test('closed cohort preserves treatment for existing users but enrolls no new users',()=>{
 reset();state.closedAt=new Date().toISOString();const token:FunnelToken={id:randomUUID(),experiment:state.id,hash:state.hash,variant:'criteria',issued:Date.now()}
 assert.equal(server.tokenForState(state,token),token);assert.equal(server.tokenForState(state,null),null)
 state.enabled=false;assert.equal(server.tokenForState(state,token),null)
})
test('manual updates invalidate mixed cohorts and reject stale admin revisions',async()=>{
 reset();const id=state.id;await server.updateFunnelState(0,{manual:'question'},'fixture-admin');assert.notEqual(state.id,id);assert.equal(state.manual,'question')
 await assert.rejects(server.updateFunnelState(0,{manual:null},'fixture-admin'),/STATE_CHANGED/)
})
