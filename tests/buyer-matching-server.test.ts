import test from 'node:test'
import assert from 'node:assert/strict'
import Module,{createRequire} from 'node:module'
import {randomUUID} from 'node:crypto'
import {criteriaSchema,feedbackSchema} from '../src/lib/buyer-matching-policy'
const require=createRequire(import.meta.url)
let profiles:any[]=[],listings:any[]=[],recs:any[]=[],ratings:any[]=[],enabled=true,leased=true,onLock:(()=>void)|null=null
const now=()=>new Date()
function visible(l:any){return l.status==='PUBLISHED'&&l.adAllowed&&!l.adConsentRequired&&l.hospitalityCategory===null&&['区分マンション','戸建','土地','一棟マンション','一棟アパート','一棟ビル','店舗・事務所'].includes(l.propertyType)&&(!l.conditionsExpiry||l.conditionsExpiry>now())&&(!l.autonomyValidUntil||l.autonomyValidUntil>now())}
const same=(obj:any,where:any)=>Object.entries(where).every(([k,v])=>obj[k]===v)
function changes(p:any,data:any){for(const [k,v] of Object.entries(data))p[k]=v&&typeof v==='object'&&'increment' in v?p[k]+v.increment:v;return p}
function findProfile(where:any){return profiles.find(p=>same(p,where))||null}
function recommendation(where:any){return recs.filter(r=>Object.entries(where).every(([k,v])=>k==='listing'?visible(listings.find(l=>l.id===r.listingId)):r[k]===v)).map(r=>({...r,listing:listings.find(l=>l.id===r.listingId),feedback:ratings.find(f=>f.profileId===r.profileId&&f.listingId===r.listingId)||null}))}
const tx:any={
 $queryRaw:async(strings:TemplateStringsArray)=>{if(strings.join('').includes('buyer_search_profiles')&&onLock){const fn=onLock;onLock=null;fn()}return []},
 $executeRaw:async(_strings:TemplateStringsArray,...values:any[])=>{for(const row of JSON.parse(values[0])){row.listingUpdatedAt=new Date(row.listingUpdatedAt);row.suggestedAt=new Date();const old=recs.find(r=>r.profileId===row.profileId&&r.listingId===row.listingId);if(old)Object.assign(old,row);else recs.push(row)}},
 autonomyPolicy:{findUnique:async()=>({enabled})},
 buyerSearchProfile:{findUnique:async({where}:any)=>findProfile(where),findMany:async()=>profiles.filter(p=>p.active),findFirst:async()=>profiles.find(p=>p.active)||null,create:async({data}:any)=>{const p={revision:1,createdAt:now(),lastSourceAt:null,lastSourceAttemptAt:null,lastMatchedAt:null,matchGeneration:null,sourceCursor:0,sourceState:'waiting',...data};profiles.push(p);return p},update:async({where,data}:any)=>changes(findProfile(where),data),delete:async({where}:any)=>{profiles=profiles.filter(p=>p.id!==where.id);recs=recs.filter(p=>p.profileId!==where.id);ratings=ratings.filter(p=>p.profileId!==where.id)}},
 listing:{findMany:async()=>listings.filter(visible)},
 buyerRecommendation:{findMany:async({where,take}:any)=>recommendation(where).slice(0,take),findFirst:async({where}:any)=>recommendation(where)[0]||null},
 buyerFeedback:{findMany:async({where}:any)=>ratings.filter(f=>f.profileId===where.profileId&&(!where.rating||(f.rating>=where.rating.gte&&f.status!=='dismiss'&&visible(listings.find(l=>l.id===f.listingId))))).map(f=>({...f,recommendation:{listing:listings.find(l=>l.id===f.listingId)}})),findUnique:async({where}:any)=>ratings.find(r=>same(r,where.profileId_listingId))||null,upsert:async({where,create,update}:any)=>{const old=ratings.find(r=>same(r,where.profileId_listingId));if(old)return Object.assign(old,update);ratings.push(create);return create}},
}
const db={...tx,$transaction:async(fn:any)=>fn(tx)}
const loader=Module as unknown as {_load:(id:string,parent:any,...args:any[])=>any},original=loader._load
loader._load=function(id,parent,...args){if(parent?.filename?.endsWith('buyer-matching-server.ts')){if(id==='./db')return {prisma:db};if(id==='./autonomy/lease')return {withLiveLease:async(_job:any,fn:any)=>{if(!enabled||!leased)throw new Error('lease lost');return fn(tx,{allowReinsIntake:true,reinsIntervalHours:24})}}}return original.call(this,id,parent,...args)}
const s=require('../src/lib/buyer-matching-server') as typeof import('../src/lib/buyer-matching-server')
loader._load=original
function reset(){profiles=[];listings=[];recs=[];ratings=[];enabled=true;leased=true;onLock=null}
const criteria=()=>criteriaSchema.parse({purpose:'residential',budgetMax:80000000,wards:['文京区']})
const makeListing=(id='fixture')=>({id,propertyType:'区分マンション',price:60000000,priceCurrency:'JPY',city:'文京区',currentStatus:'空室',buildingArea:50,landArea:null,builtYear:2000,yieldGross:null,stations:[],status:'PUBLISHED',adAllowed:true,adConsentRequired:false,hospitalityCategory:null,conditionsExpiry:null,autonomyValidUntil:new Date(Date.now()+86400000),updatedAt:now(),fetchedAt:now(),addressPublic:'公開住所',media:[]})
async function create(subject='owner'){await s.saveBuyer(subject,0,criteria(),null);listings.push(makeListing());await s.refreshBuyer(subject);return profiles[0]}
test('profiles are keyed only by supplied verified UUID; foreign profile ID and stale revision cannot change or delete',async()=>{
 reset();const p=await create();assert.equal(await s.buyerProfile('other'),null);assert.equal((await s.buyerDashboard('other')).recommendations.length,0);await assert.rejects(s.saveBuyer('other',p.revision,criteria(),p.id),/PROFILE_CHANGED/);await assert.rejects(s.removeBuyer('other',p.revision,p.id),/PROFILE_CHANGED/);await assert.rejects(s.saveBuyer('owner',0,criteria(),p.id),/PROFILE_CHANGED/);assert.equal(profiles.length,1)
})
test('CAS is rechecked after profile lock and opaque ID protects delete/recreate ABA',async()=>{
 reset();const p=await create(),oldId=p.id;onLock=()=>p.revision++;await assert.rejects(s.saveBuyer('owner',1,criteria(),oldId),/PROFILE_CHANGED/);await s.removeBuyer('owner',p.revision,oldId);await s.saveBuyer('owner',0,criteria(),null);assert.notEqual(profiles[0].id,oldId);await assert.rejects(s.saveBuyer('owner',1,criteria(),oldId),/PROFILE_CHANGED/);await assert.rejects(s.removeBuyer('owner',1,oldId),/PROFILE_CHANGED/)
})
test('rating requires own current recommendation and nonce retry changes nothing twice',async()=>{
 reset();const p=await create();const input=feedbackSchema.parse({profileId:p.id,listingId:'fixture',revision:p.revision,status:'like',rating:5,nonce:randomUUID()});await assert.rejects(s.rateBuyer('other',input),/PROFILE_REQUIRED/);await s.rateBuyer('owner',input);assert.equal(p.revision,2);await s.rateBuyer('owner',input);assert.equal(p.revision,2);await assert.rejects(s.rateBuyer('owner',{...input,nonce:randomUUID()}),/PROFILE_CHANGED/);assert.equal(ratings.length,1)
})
test('feed and ratings suppress revoked, expired or changed facts immediately; pause suppresses new work',async()=>{
 reset();const p=await create(),input=feedbackSchema.parse({profileId:p.id,listingId:'fixture',revision:1,status:'like',rating:5,nonce:randomUUID()});assert.equal((await s.buyerDashboard('owner')).recommendations.length,1);listings[0].price=90000000;assert.equal((await s.buyerDashboard('owner')).recommendations.length,0);await assert.rejects(s.rateBuyer('owner',input),/PROPERTY_UNAVAILABLE/);listings[0].price=60000000;listings[0].updatedAt=new Date(Date.now()+1000);assert.equal((await s.buyerDashboard('owner')).recommendations.length,0);listings[0].adAllowed=false;assert.equal((await s.buyerDashboard('owner')).recommendations.length,0);enabled=false;const paused=await s.refreshBuyer('owner');assert('paused' in paused&&paused.paused);assert.equal((await s.buyerDashboard('owner')).recommendations.length,0)
})
test('batch refresh replaces displayed top 30 but retains ratings; oversized inventory reports incomplete',async()=>{
 reset();const p=await create();ratings.push({profileId:p.id,listingId:'fixture',rating:5,status:'like',reason:'none'});listings[0].price=999999999;for(let i=0;i<35;i++)listings.push(makeListing('new-'+i));await s.refreshBuyer('owner');const dashboard=await s.buyerDashboard('owner');assert.equal(dashboard.recommendations.length,30);assert(!dashboard.recommendations.some(r=>r.listingId==='fixture'));assert.equal(ratings.length,1);const generation=p.matchGeneration;for(let i=35;i<1001;i++)listings.push(makeListing('more-'+i));assert.equal((await s.refreshBuyer('owner')).incomplete,true);assert.equal(p.matchGeneration,generation);assert.equal(ratings.length,1)
})
test('source guard stops edited, paused and deleted buyer targets; completion cannot revive old profiles; lost lease cannot search',async()=>{
 reset();const p=await create(),target=(await s.buyerSourceTarget({} as any))!;assert(target);assert.equal(target.plan.env.REINS_CITY,'文京区');assert.equal(await s.buyerSourceCurrent(target),true);await s.saveBuyer('owner',p.revision,{...criteria(),budgetMax:70000000},p.id);assert.equal(await s.buyerSourceCurrent(target),false);await s.finishBuyerSource({} as any,target,true);assert.equal(p.sourceState,'waiting');await s.removeBuyer('owner',p.revision,p.id);assert.equal(await s.buyerSourceCurrent(target),false);await s.saveBuyer('owner',0,criteria(),null);await s.finishBuyerSource({} as any,target,true);assert.equal(profiles[0].sourceState,'waiting');leased=false;await assert.rejects(s.buyerSourceTarget({} as any),/lease lost/)
})
