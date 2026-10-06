import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { PUBLIC_PROPERTY_TYPES } from '../src/lib/market-category'
const owner='00000000-0000-4000-8000-000000000001',other='00000000-0000-4000-8000-000000000002',admin='00000000-0000-4000-8000-000000000003'
const profile='10000000-0000-4000-8000-000000000001',generation='20000000-0000-4000-8000-000000000001'
async function setup(){
 const db=new PGlite()
 await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
 CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,email text,role text);
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 GRANT USAGE ON SCHEMA auth TO authenticated,service_role; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,service_role;
 CREATE TABLE listings(id text PRIMARY KEY,status text,"adAllowed" boolean,"adConsentRequired" boolean,"hospitalityCategory" text,"propertyType" text,"conditionsExpiry" timestamptz,"autonomyValidUntil" timestamptz,"updatedAt" timestamp(3));
 GRANT SELECT(id,status,"propertyType") ON listings TO authenticated;
 INSERT INTO auth.users VALUES ('${owner}','same@example.test','USER'),('${other}','same@example.test','USER'),('${admin}','admin@example.test','ADMIN');`)
 await db.exec(await readFile('prisma/migrations/20261005_buyer_matching/migration.sql','utf8'))
 await db.exec(`INSERT INTO buyer_search_profiles(id,"buyerSubject",criteria,"matchGeneration") VALUES ('${profile}','${owner}','{"active":true}','${generation}');
 INSERT INTO listings VALUES ('eligible','PUBLISHED',true,false,null,'区分マンション',null,null,'2026-10-05');
 INSERT INTO buyer_recommendations("profileId","listingId","profileRevision","matchGeneration","listingUpdatedAt","listingHash",evaluation,score,status) VALUES ('${profile}','eligible',1,'${generation}','2026-10-05','${'a'.repeat(64)}','{}',95,'aligned');
 INSERT INTO buyer_feedback VALUES ('${profile}','eligible',5,'like','none','30000000-0000-4000-8000-000000000001',now());`)
 return db
}
async function as(db:PGlite,id:string){await db.exec('RESET ROLE');await db.query(`SELECT set_config('request.jwt.claim.sub',$1,false)`,[id]);await db.exec('SET ROLE authenticated')}
async function counts(db:PGlite){return Promise.all(['buyer_search_profiles','buyer_recommendations','buyer_feedback'].map(async table=>(await db.query(`SELECT * FROM ${table}`)).rows.length))}
test('only immutable auth UUID owner reads profile, criteria, recommendations or evaluations; same email and ADMIN grant nothing',async()=>{
 const db=await setup();try{await as(db,owner);assert.deepEqual(await counts(db),[1,1,1]);await assert.rejects(db.query('SELECT "autonomyValidUntil" FROM listings'));for(const id of [other,admin]){await as(db,id);assert.deepEqual(await counts(db),[0,0,0])}}finally{await db.close()}
})
test('anonymous reads and browser REST inserts, updates, deletes are prohibited',async()=>{
 const db=await setup();try{await db.exec('SET ROLE anon');for(const table of ['buyer_search_profiles','buyer_recommendations','buyer_feedback'])await assert.rejects(db.query(`SELECT * FROM ${table}`));await as(db,owner);for(const table of ['buyer_search_profiles','buyer_recommendations','buyer_feedback']){await assert.rejects(db.query(`DELETE FROM ${table}`));await assert.rejects(db.query(`UPDATE ${table} SET "updatedAt"=now()`))}await assert.rejects(db.query(`INSERT INTO buyer_search_profiles(id,"buyerSubject",criteria) VALUES ('40000000-0000-4000-8000-000000000001','${other}','{"active":true}')`))}finally{await db.close()}
})
test('every RLS recommendation read checks permission, expiry, property scope and source fact timestamp',async()=>{
 const db=await setup();try{for(const change of [`"adAllowed"=false`,`"adConsentRequired"=true`,`status='ARCHIVED'`,`"hospitalityCategory"='hotel'`,`"propertyType"='未確認'`,`"conditionsExpiry"=now()-interval '1 minute'`,`"autonomyValidUntil"=now()-interval '1 minute'`,`"updatedAt"='2026-10-06'`]){await db.exec('RESET ROLE');await db.exec(`UPDATE listings SET status='PUBLISHED',"adAllowed"=true,"adConsentRequired"=false,"hospitalityCategory"=null,"propertyType"='区分マンション',"conditionsExpiry"=null,"autonomyValidUntil"=null,"updatedAt"='2026-10-05'`);await db.exec(`UPDATE listings SET ${change}`);await as(db,owner);assert.equal((await counts(db))[1],0,change)}}finally{await db.close()}
})
test('SQL and application property whitelists agree; old revisions/generations and disabled profiles cannot expose recommendations',async()=>{
 const db=await setup();try{for(const type of PUBLIC_PROPERTY_TYPES){await db.exec('RESET ROLE');await db.query(`UPDATE listings SET "propertyType"=$1`,[type]);await as(db,owner);assert.equal((await counts(db))[1],1,type)}for(const change of ['revision=2',`"matchGeneration"='20000000-0000-4000-8000-000000000002'`,`active=false,criteria='{"active":false}'`]){await db.exec('RESET ROLE');await db.exec(`UPDATE buyer_search_profiles SET revision=1,active=true,criteria='{"active":true}',"matchGeneration"='${generation}'`);await db.exec(`UPDATE buyer_search_profiles SET ${change}`);await as(db,owner);assert.equal((await counts(db))[1],0,change);assert.equal((await counts(db))[2],1,'own ratings are retained privately')}}finally{await db.close()}
})
test('deleting profile or auth account cascades without orphaned ratings or reusable recommendations',async()=>{
 const db=await setup();try{await db.exec(`DELETE FROM auth.users WHERE id='${owner}'`);for(const table of ['buyer_search_profiles','buyer_recommendations','buyer_feedback'])assert.equal((await db.query(`SELECT * FROM ${table}`)).rows.length,0);await assert.rejects(db.exec(`INSERT INTO buyer_search_profiles(id,"buyerSubject",criteria) VALUES ('${profile}','${owner}','{"active":true}')`))}finally{await db.close()}
})
