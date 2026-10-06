import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { isChatParticipant, sameChatOrigin, sendChatInput, translatorLanguage, boundedChatBody } from '../src/lib/private-chat-policy'

const buyer = '11111111-1111-4111-8111-111111111111', seller = '22222222-2222-4222-8222-222222222222', outsider = '33333333-3333-4333-8333-333333333333'
const room = '44444444-4444-4444-8444-444444444444'
test('only immutable buyer/seller subjects grant access; roles and same-email replacements do not', () => {
  const conversation = { buyerSubject: buyer, sellerSubject: seller }
  assert.equal(isChatParticipant(buyer, conversation), true)
  assert.equal(isChatParticipant(seller, conversation), true)
  assert.equal(isChatParticipant(outsider, conversation), false)
  assert.equal(sameChatOrigin(new Request('https://portal.ziyou-fudosan.com/api/chats', { headers: { origin: 'https://evil.example' } })), false)
  assert.equal(sameChatOrigin(new Request('https://portal.ziyou-fudosan.com/api/chats')), false)
  assert.equal(sameChatOrigin(new Request('https://portal.ziyou-fudosan.com/api/chats', { headers: { origin: 'https://portal.ziyou-fudosan.com' } })), true)
  assert.equal(sendChatInput.safeParse({ body: ' ', language: 'ja', nonce: room }).success, false)
  assert.equal(sendChatInput.safeParse({ body: 'a'.repeat(4001), language: 'ja', nonce: room }).success, false)
  assert.equal(sendChatInput.safeParse({ body: 'Hello', language: 'en', nonce: room, senderSubject: seller }).success, false)
  assert.equal(translatorLanguage('zh-TW'), 'zh-Hant')
  assert.equal(translatorLanguage('zh-CN'), 'zh')
})
test('oversized streaming bodies stop before consuming the entire request', async () => {
  let chunks = 0, cancelled = false
  const stream = new ReadableStream<Uint8Array>({ pull(controller) { chunks++; controller.enqueue(new Uint8Array(16000)); if (chunks === 8) controller.close() }, cancel() { cancelled = true } })
  const request = new Request('https://portal.example/api/chats', { method: 'POST', body: stream, duplex: 'half' } as RequestInit)
  assert.equal(await boundedChatBody(request), null)
  assert.equal(cancelled,true)
  assert.ok(chunks < 8)
})
test('database isolates conversations, denies REST writes and outsiders, deduplicates retries and limits sends', async () => {
  const db = new PGlite()
  try {
    await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
      CREATE SCHEMA auth; CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT nullif(current_setting('test.subject', true), '')::uuid $$;
      GRANT USAGE ON SCHEMA auth TO authenticated; GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated;
      CREATE TABLE listings (id text PRIMARY KEY); INSERT INTO listings VALUES ('listing');`)
    await db.exec(await readFile('prisma/migrations/20261003_private_property_chat/migration.sql', 'utf8'))
    await db.query('INSERT INTO property_chat_rooms (id,"listingId","buyerSubject","sellerSubject") VALUES ($1,\'listing\',$2,$3)', [room,buyer,seller])
    const nonce = '55555555-5555-4555-8555-555555555555'
    const sent = await db.query(`SELECT * FROM property_chat_send($1,$2,$3,$3,'private original','en')`, [room,buyer,nonce])
    const retry = await db.query(`SELECT * FROM property_chat_send($1,$2,$3,$3,'different retry body','ja')`, [room,buyer,nonce])
    assert.deepEqual(retry.rows, sent.rows)
    await assert.rejects(db.query(`SELECT * FROM property_chat_send($1,$2,$3,$3,'bad','en')`, [room,outsider,nonce]), /CHAT_NOT_FOUND/)
    await db.exec('SET ROLE authenticated')
    for (const subject of [buyer,seller]) {
      await db.query(`SELECT set_config('test.subject',$1,false)`, [subject])
      assert.equal((await db.query('SELECT * FROM property_chat_rooms')).rows.length,1)
      assert.equal((await db.query('SELECT * FROM property_chat_messages')).rows.length,1)
    }
    await db.query(`SELECT set_config('test.subject',$1,false)`, [outsider])
    assert.equal((await db.query('SELECT * FROM property_chat_rooms')).rows.length,0)
    assert.equal((await db.query('SELECT * FROM property_chat_messages')).rows.length,0)
    await assert.rejects(db.query(`SELECT * FROM property_chat_send($1,$2,$3,$3,'forged','en')`, [room,buyer,nonce]))
    await assert.rejects(db.query('SELECT * FROM property_chat_sellers'))
    await assert.rejects(db.query('UPDATE property_chat_rooms SET "buyerSubject"=$1', [outsider]))
    await db.exec('RESET ROLE; SET ROLE anon')
    await assert.rejects(db.query('SELECT * FROM property_chat_messages'))
    await db.exec('RESET ROLE')
    for (let i = 1; i < 20; i++) {
      const id = `66666666-6666-4666-8666-${String(i).padStart(12,'0')}`
      await db.query(`SELECT * FROM property_chat_send($1,$2,$3,$3,'message','ja')`, [room,buyer,id])
    }
    await assert.rejects(db.query(`SELECT * FROM property_chat_send($1,$2,$3,$3,'limited','ja')`, [room,buyer,outsider]), /CHAT_RATE_LIMIT/)
    await assert.rejects(db.query(`INSERT INTO property_chat_rooms (id,"listingId","buyerSubject","sellerSubject") VALUES ($1,'listing',$2,$2)`, [outsider,buyer]))
  } finally { await db.close() }
})
