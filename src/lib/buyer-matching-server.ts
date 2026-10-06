import { randomUUID, createHash } from 'node:crypto'
import { type Prisma, type AutonomyJob } from '@prisma/client'
import { prisma } from './db'
import { getPublicListingScope } from './public-listing-scope'
import { criteriaSchema, matchListing, searchPlans, type BuyerCriteria, type MatchFacts, type Preference, type Evaluation } from './buyer-matching-policy'
import { withLiveLease } from './autonomy/lease'
import { PORTAL_VENTURE_ID } from './autonomy/policy'

type Tx = Prisma.TransactionClient
export class BuyerError extends Error { constructor(public status:number, public code:string){super(code)} }
const asJson = (v:unknown):Prisma.InputJsonValue=>JSON.parse(JSON.stringify(v))
const publicSelect = {id:true,propertyType:true,price:true,priceCurrency:true,city:true,addressPublic:true,currentStatus:true,buildingArea:true,landArea:true,builtYear:true,yieldGross:true,stations:true,updatedAt:true,fetchedAt:true,media:{where:{isAdopted:true},orderBy:{sortOrder:'asc' as const},take:1,select:{url:true}}} as const
const numeric = (v:unknown)=>v === null || v === undefined ? null : Number(v)
type PublicRow = Prisma.ListingGetPayload<{select:typeof publicSelect}>
function facts(l:PublicRow):MatchFacts { return {id:l.id,propertyType:l.propertyType,price:numeric(l.price),priceCurrency:l.priceCurrency,city:l.city,currentStatus:l.currentStatus,buildingArea:numeric(l.buildingArea),landArea:numeric(l.landArea),builtYear:l.builtYear,yieldGross:numeric(l.yieldGross),stations:l.stations} }
function hash(v:unknown){return createHash('sha256').update(JSON.stringify(v)).digest('hex')}
async function lockProfile(tx:Tx,id:string){await tx.$queryRaw`SELECT id FROM buyer_search_profiles WHERE id=${id}::uuid FOR UPDATE`;return tx.buyerSearchProfile.findUnique({where:{id}})}
async function preferences(tx:Tx,profileId:string):Promise<Preference[]> {
  const rows=await tx.buyerFeedback.findMany({where:{profileId,rating:{gte:4},status:{not:'dismiss'},recommendation:{listing:getPublicListingScope()}},take:100,orderBy:{updatedAt:'desc'},select:{listingId:true,rating:true,recommendation:{select:{listing:{select:{city:true,propertyType:true}}}}}})
  return rows.map(x=>({listingId:x.listingId,rating:x.rating,...x.recommendation.listing}))
}
async function refreshInTransaction(tx:Tx,id:string) {
  const p=await lockProfile(tx,id)
  if(!p?.active)return {refreshed:false,incomplete:false}
  const c=criteriaSchema.parse(p.criteria)
  const [listings,prefs,feedback]=await Promise.all([tx.listing.findMany({where:getPublicListingScope(),select:publicSelect,take:1001,orderBy:{id:'asc'}}),preferences(tx,id),tx.buyerFeedback.findMany({where:{profileId:id},select:{listingId:true,status:true}})])
  // A truncated inventory must never withdraw prior suggestions or claim completeness.
  if(listings.length>1000)return {refreshed:false,incomplete:true}
  const dismissed=new Set(feedback.filter(f=>f.status==='dismiss').map(f=>f.listingId))
  const evaluated=listings.filter(l=>!dismissed.has(l.id)).map(l=>({l,e:matchListing(c,facts(l),prefs)}))
  const group=(e:Evaluation)=>e.status==='aligned'?0:e.status==='needs_check'?1:2
  evaluated.sort((a,b)=>group(a.e)-group(b.e)||b.e.score-a.e.score||a.l.id.localeCompare(b.l.id))
  const generation=randomUUID()
  const batch=evaluated.slice(0,30).map(({l,e})=>({profileId:id,listingId:l.id,profileRevision:p.revision,matchGeneration:generation,listingUpdatedAt:l.updatedAt.toISOString(),listingHash:hash(facts(l)),evaluation:e,score:e.score,status:e.status}))
  // One bounded write keeps remote DB round trips low. Old rows retain private ratings,
  // but only the current generation is served or accessible through RLS.
  if(batch.length)await tx.$executeRaw`
    INSERT INTO buyer_recommendations ("profileId","listingId","profileRevision","matchGeneration","listingUpdatedAt","listingHash",evaluation,score,status)
    SELECT x."profileId",x."listingId",x."profileRevision",x."matchGeneration",x."listingUpdatedAt",x."listingHash",x.evaluation,x.score,x.status
    FROM jsonb_to_recordset(${JSON.stringify(batch)}::jsonb) AS x("profileId" uuid,"listingId" text,"profileRevision" integer,"matchGeneration" uuid,"listingUpdatedAt" timestamp(3),"listingHash" text,evaluation jsonb,score integer,status text)
    ON CONFLICT ("profileId","listingId") DO UPDATE SET "profileRevision"=EXCLUDED."profileRevision","matchGeneration"=EXCLUDED."matchGeneration","listingUpdatedAt"=EXCLUDED."listingUpdatedAt","listingHash"=EXCLUDED."listingHash",evaluation=EXCLUDED.evaluation,score=EXCLUDED.score,status=EXCLUDED.status,"updatedAt"=now(),"suggestedAt"=CASE WHEN buyer_recommendations."listingHash"<>EXCLUDED."listingHash" THEN now() ELSE buyer_recommendations."suggestedAt" END`
  await tx.buyerSearchProfile.update({where:{id},data:{lastMatchedAt:new Date(),matchGeneration:generation}})
  return {refreshed:true,incomplete:false}
}
export async function refreshBuyer(subject:string) {
  return prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
    const enabled=await tx.autonomyPolicy.findUnique({where:{id:PORTAL_VENTURE_ID},select:{enabled:true}})
    if(!enabled?.enabled)return {refreshed:false,incomplete:false,paused:true}
    const p=await tx.buyerSearchProfile.findUnique({where:{buyerSubject:subject},select:{id:true}})
    return p?refreshInTransaction(tx,p.id):{refreshed:false,incomplete:false}
  },{timeout:15000,maxWait:10000})
}
export async function buyerProfile(subject:string) {
  const p=await prisma.buyerSearchProfile.findUnique({where:{buyerSubject:subject}})
  if(!p)return null
  return {id:p.id,revision:p.revision,criteria:criteriaSchema.parse(p.criteria),lastMatchedAt:p.lastMatchedAt?.toISOString()||null,lastSourceAt:p.lastSourceAt?.toISOString()||null,sourceState:p.sourceState,createdAt:p.createdAt.toISOString()}
}
export async function saveBuyer(subject:string,revision:number,criteria:BuyerCriteria,profileId:string|null) {
  return prisma.$transaction(async tx=>{
    // Serializes initial inserts too; no connection/session advisory locks.
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${subject},0))`
    const found=await tx.buyerSearchProfile.findUnique({where:{buyerSubject:subject}})
    const p=found?await lockProfile(tx,found.id):null
    if((p?.revision||0)!==revision||(p?.id||null)!==profileId)throw new BuyerError(409,'PROFILE_CHANGED')
    if(p){await tx.buyerSearchProfile.update({where:{id:p.id},data:{criteria:asJson(criteria),active:criteria.active,revision:{increment:1},lastMatchedAt:null,lastSourceAttemptAt:null,sourceState:'waiting',sourcePlan:{},updatedAt:new Date()}})}
    else await tx.buyerSearchProfile.create({data:{id:randomUUID(),buyerSubject:subject,criteria:asJson(criteria),active:criteria.active}})
  },{timeout:10000,maxWait:10000})
}
export async function removeBuyer(subject:string,revision:number,profileId:string) {
  await prisma.$transaction(async tx=>{
    await tx.$queryRaw`SELECT true AS locked FROM pg_advisory_xact_lock(hashtextextended(${subject},0))`
    const found=await tx.buyerSearchProfile.findUnique({where:{buyerSubject:subject}})
    const p=found?await lockProfile(tx,found.id):null
    if(!p||p.revision!==revision||p.id!==profileId)throw new BuyerError(409,'PROFILE_CHANGED')
    await tx.buyerSearchProfile.delete({where:{id:p.id}})
  })
}
export async function buyerDashboard(subject:string) {
  return prisma.$transaction(async tx=>{
    const found=await tx.buyerSearchProfile.findUnique({where:{buyerSubject:subject}})
    const p=found?await lockProfile(tx,found.id):null
    if(!p)return {profile:null,recommendations:[]}
    const profile={id:p.id,revision:p.revision,criteria:criteriaSchema.parse(p.criteria),lastMatchedAt:p.lastMatchedAt?.toISOString()||null,lastSourceAt:p.lastSourceAt?.toISOString()||null,sourceState:p.sourceState,createdAt:p.createdAt.toISOString()}
    if(!p.active||!p.matchGeneration)return {profile,recommendations:[]}
    const rows=await tx.buyerRecommendation.findMany({where:{profileId:p.id,profileRevision:p.revision,matchGeneration:p.matchGeneration,listing:getPublicListingScope()},select:{listingId:true,listingHash:true,listingUpdatedAt:true,suggestedAt:true,listing:{select:publicSelect},feedback:{select:{rating:true,status:true,reason:true}}},take:30})
    const prefs=await preferences(tx,p.id)
    const recommendations=rows.filter(r=>r.feedback?.status!=='dismiss'&&hash(facts(r.listing))===r.listingHash&&r.listing.updatedAt.getTime()===r.listingUpdatedAt.getTime()).map(r=>({listingId:r.listingId,listing:{...facts(r.listing),address:r.listing.addressPublic,image:r.listing.media[0]?.url||null,lastSourceAt:r.listing.fetchedAt?.toISOString()||null},evaluation:matchListing(profile.criteria,facts(r.listing),prefs),feedback:r.feedback,suggestedAt:r.suggestedAt.toISOString()})).sort((a,b)=>['aligned','needs_check','outside'].indexOf(a.evaluation.status)-['aligned','needs_check','outside'].indexOf(b.evaluation.status)||b.evaluation.score-a.evaluation.score)
    return {profile,recommendations}
  },{timeout:10000,maxWait:10000})
}
export async function rateBuyer(subject:string,input:import('zod').infer<typeof import('./buyer-matching-policy').feedbackSchema>) {
  await prisma.$transaction(async tx=>{
    const p=await tx.buyerSearchProfile.findUnique({where:{buyerSubject:subject}})
    if(!p||p.id!==input.profileId)throw new BuyerError(404,'PROFILE_REQUIRED')
    const current=await lockProfile(tx,p.id)
    const key={profileId_listingId:{profileId:p.id,listingId:input.listingId}}
    const old=await tx.buyerFeedback.findUnique({where:key})
    if(current&&old?.lastNonce===input.nonce)return
    if(current?.revision!==input.revision)throw new BuyerError(409,'PROFILE_CHANGED')
    if(!current.active||!current.matchGeneration)throw new BuyerError(404,'PROPERTY_UNAVAILABLE')
    const rec=await tx.buyerRecommendation.findFirst({where:{profileId:p.id,profileRevision:current.revision,matchGeneration:current.matchGeneration,listingId:input.listingId,listing:getPublicListingScope()},select:{listingHash:true,listingUpdatedAt:true,listing:{select:publicSelect}}})
    if(!rec||hash(facts(rec.listing))!==rec.listingHash||rec.listing.updatedAt.getTime()!==rec.listingUpdatedAt.getTime())throw new BuyerError(404,'PROPERTY_UNAVAILABLE')
    const data={rating:input.rating,status:input.status,reason:input.reason,lastNonce:input.nonce,updatedAt:new Date()}
    await tx.buyerFeedback.upsert({where:key,create:{profileId:p.id,listingId:input.listingId,...data},update:data})
    await tx.buyerSearchProfile.update({where:{id:p.id},data:{revision:{increment:1},lastMatchedAt:null,updatedAt:new Date()}})
  },{timeout:10000,maxWait:10000})
}
export async function observeBuyerMatching(job:AutonomyJob) {
  const profiles=await prisma.buyerSearchProfile.findMany({where:{active:true,OR:[{lastMatchedAt:null},{lastMatchedAt:{lt:new Date(Date.now()-3600000)}}]},orderBy:[{lastMatchedAt:{sort:'asc',nulls:'first'}},{id:'asc'}],take:10,select:{id:true}})
  let refreshed=0,incomplete=0
  for(const p of profiles){const result=await withLiveLease(job,tx=>refreshInTransaction(tx,p.id),15000);refreshed+=Number(result.refreshed);incomplete+=Number(result.incomplete)}
  return {profilesChecked:profiles.length,refreshed,incomplete,delivery:'portal_only',paidAiYen:0}
}
export async function buyerSourceTarget(job:AutonomyJob) {
  return withLiveLease(job,async(tx,policy)=>{
    if(!policy.allowReinsIntake)return null
    const due=new Date(Date.now()-policy.reinsIntervalHours*3600000)
    const p=await tx.buyerSearchProfile.findFirst({where:{active:true,OR:[{lastSourceAttemptAt:null},{lastSourceAttemptAt:{lt:due}}]},orderBy:[{lastSourceAttemptAt:{sort:'asc',nulls:'first'}},{id:'asc'}]})
    if(!p)return null
    const current=await lockProfile(tx,p.id)
    if(!current?.active)return null
    const c=criteriaSchema.parse(current.criteria),plans=searchPlans(c,await preferences(tx,p.id)),plan=plans[current.sourceCursor%plans.length]
    await tx.buyerSearchProfile.update({where:{id:p.id},data:{lastSourceAttemptAt:new Date(),sourceState:'acquiring',sourcePlan:asJson(plan)}})
    return {profileId:p.id,criteriaHash:hash(c),plan}
  },10000)
}
export async function buyerSourceCurrent(target:{profileId:string;criteriaHash:string}) {
  const p=await prisma.buyerSearchProfile.findUnique({where:{id:target.profileId},select:{active:true,criteria:true}})
  return !!p?.active&&hash(criteriaSchema.parse(p.criteria))===target.criteriaHash
}
export async function finishBuyerSource(job:AutonomyJob,target:{profileId:string;criteriaHash:string},success:boolean) {
  await withLiveLease(job,async tx=>{
    const p=await lockProfile(tx,target.profileId)
    if(!p?.active||hash(criteriaSchema.parse(p.criteria))!==target.criteriaHash)return
    await tx.buyerSearchProfile.update({where:{id:p.id},data:{sourceState:success?'review_pending':'failed',...(success?{lastSourceAt:new Date(),sourceCursor:{increment:1}}:{})}})
  })
}
