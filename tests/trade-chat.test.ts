import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { tradeInput, prepareTradeMessage } from '../src/lib/trade-chat'
const buyer='11111111-1111-4111-8111-111111111111', manager='22222222-2222-4222-8222-222222222222', stranger='33333333-3333-4333-8333-333333333333', room='44444444-4444-4444-8444-444444444444'
test('trade requests validate prices, dates, authority fields and localized facts',()=>{
  assert.equal(tradeInput.safeParse({action:'offer',amountYen:'-1',language:'ja',nonce:room}).success,false)
  assert.equal(tradeInput.safeParse({action:'viewing',date:'2026-02-31',slot:'午前',language:'ja',nonce:room}).success,false)
  assert.equal(tradeInput.safeParse({action:'offer',amountYen:'20000000',language:'ja',nonce:room,sellerSubject:manager}).success,false)
  for (const language of ['ja','en','zh-CN','zh-TW']) {
    const parsed=tradeInput.parse({action:'offer',amountYen:'20000000',language,nonce:room})
    const prepared=prepareTradeMessage(parsed)
    assert.equal(prepared.kind,'offer');assert.equal(prepared.stage,null);assert.match(prepared.body,/20,000,000/)
  }
})
test('only the assigned manager updates progress; requests auto-advance; retries preserve original events',async()=>{
  const db=new PGlite()
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.subject',true),'')::uuid $$; CREATE TABLE listings(id text PRIMARY KEY); INSERT INTO listings VALUES('property');`)
    const names=(await readdir('prisma/migrations')).filter(name=>name.startsWith('20261003_')&&(name.includes('private_property_chat')||name.includes('trade_chat'))).sort()
    assert.deepEqual(names,['20261003_private_property_chat','20261003_trade_chat'])
    for(const name of names)await db.exec(await readFile(`prisma/migrations/${name}/migration.sql`,'utf8'))
    await db.query(`INSERT INTO property_chat_rooms(id,"listingId","buyerSubject","sellerSubject","sellerKind") VALUES($1,'property',$2,$3,'manager')`,[room,buyer,manager])
    const send=async(sender:string,nonce:string,kind:string,stage:string|null=null)=>db.query(`SELECT * FROM property_chat_trade_send($1,$2,$3,$3,'request','ja',$4,'{}',$5)`,[room,sender,nonce,kind,stage])
    await assert.rejects(send(stranger,stranger,'text'),/CHAT_NOT_FOUND/)
    await assert.rejects(send(buyer,stranger,'stage','completed'),/CHAT_NOT_FOUND/)
    await assert.rejects(send(manager,stranger,'offer'),/CHAT_INVALID_ACTION/)
    await send(buyer,buyer,'viewing')
    assert.equal((await db.query<{stage:string}>('SELECT stage FROM property_chat_rooms')).rows[0].stage,'viewing')
    await send(buyer,stranger,'offer')
    assert.equal((await db.query<{stage:string}>('SELECT stage FROM property_chat_rooms')).rows[0].stage,'offer')
    const completed=await send(manager,manager,'stage','completed')
    const retry=await send(manager,manager,'stage','cancelled')
    assert.deepEqual(retry.rows,completed.rows)
    assert.equal((await db.query<{stage:string}>('SELECT stage FROM property_chat_rooms')).rows[0].stage,'completed')
    await db.exec('SET ROLE authenticated')
    await assert.rejects(db.query('SELECT * FROM property_chat_operator'))
    await assert.rejects(send(buyer,room,'stage','completed'))
  } finally { await db.close() }
})
