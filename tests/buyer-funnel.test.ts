import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {summarize,decide,day,campaignSummary,type FunnelEvent} from '../src/lib/buyer-funnel-policy'
import {signToken,readToken,excludedVisitor,type FunnelToken} from '../src/lib/buyer-funnel-token'
const now=Date.now(), secret='a'.repeat(32)
const t:FunnelToken={id:randomUUID(),experiment:randomUUID(),variant:'criteria',hash:'b'.repeat(64),issued:now-1000}
const event=(assignment:string,event:string,at:number,variant:'criteria'|'original'='criteria',campaign=''):FunnelEvent=>({assignment,event,at,variant,campaign,surface:'consult'})
test('cookie cannot be forged, replayed after expiry, or issued in future',()=>{
 const signed=signToken(t,secret)
 assert.deepEqual(readToken(signed,secret,now),t)
 assert.equal(readToken(signed+'x',secret,now),null)
 assert.equal(readToken(signed,'c'.repeat(32),now),null)
 assert.equal(readToken(signed,secret,now+31*day),null)
 assert.equal(readToken(signToken({...t,issued:now+100},secret),secret,now),null)
 assert.equal(readToken(signed,'',now),null)
})
test('unique exposure and inquiries, real exposure before success, bounded outcome window',()=>{
 const events=[event('a','exposure',now-2*day),event('a','exposure',now-day),event('a','click',now-2*day+5),event('a','consultation',now-2*day+20),event('a','consultation',now-2*day+30),event('a','registration',now-2*day+day+1),event('b','consultation',now),event('c','exposure',now-1),event('c','consultation',now)]
 assert.deepEqual(summarize(events,now,true).criteria,{visitors:1,clicks:1,submissions:0,registrations:0,consultations:1})
 assert.equal(summarize(events,now).criteria.visitors,2)
})
test('clicks and sparse or indistinguishable inquiries do not select a winner',()=>{
 const arm={visitors:200,clicks:180,submissions:80,registrations:40,consultations:2}
 assert.equal(decide({...arm,clicks:1},arm),'inconclusive')
 assert.equal(decide({...arm,visitors:199,consultations:0},{...arm,consultations:100}),'inconclusive')
 assert.equal(decide({...arm,consultations:20},{...arm,consultations:22}),'inconclusive')
 assert.equal(decide({...arm,consultations:3},{...arm,consultations:60}),'challenger')
 assert.equal(decide({...arm,consultations:60},{...arm,consultations:3}),'incumbent')
})
test('campaign follows first exposure across navigation, without duplicate conversion credit',()=>{
 const es=[event('a','exposure',now-100,'criteria','post-a'),event('a','exposure',now-50,'criteria',''),event('a','consultation',now,'criteria',''),event('b','exposure',now-30,'original','post-b')]
 const cs=campaignSummary(es,now)
 assert.equal(cs.length,2)
 assert.equal(cs.find(c=>c.campaign==='post-a')!.metrics.criteria.consultations,1)
 assert.equal(cs.find(c=>c.campaign==='post-b')!.metrics.original.consultations,0)
})
test('crawler and privacy opt-out never enroll',()=>{
 assert.equal(excludedVisitor(new Headers({'User-Agent':'Ziyou-Autonomy-Health/1.0'})),true)
 assert.equal(excludedVisitor(new Headers({'sec-gpc':'1'})),true)
 assert.equal(excludedVisitor(new Headers({'DNT':'1'})),true)
 assert.equal(excludedVisitor(new Headers({'User-Agent':'Mozilla/5.0'})),false)
})

import {allowFunnelRequest,boundedFunnelBody} from '../src/lib/buyer-funnel-request'
test('oversized and chunked anonymous bodies are rejected before parsing',async()=>{
 assert.equal(await boundedFunnelBody(new Request('https://example.test',{method:'POST',body:'a'.repeat(1025)})),null)
 assert.equal(await boundedFunnelBody(new Request('https://example.test',{method:'POST',headers:{'content-length':'2000'},body:'{}'})),null)
 assert.equal(await boundedFunnelBody(new Request('https://example.test',{method:'POST',body:'{}'})),'{}')
})
test('bounded limiter stops floods and resets after the window',()=>{
 const headers=new Headers({'x-forwarded-for':'192.0.2.51'}),time=1000
 for(let i=0;i<120;i++)assert.equal(allowFunnelRequest(headers,time),true)
 assert.equal(allowFunnelRequest(headers,time),false);assert.equal(allowFunnelRequest(headers,time+60000),true)
})
