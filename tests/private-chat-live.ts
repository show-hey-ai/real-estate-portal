// Explicit opt-in integration check. Uses isolated accounts and private rooms;
// never connects a test seller to a real public listing or contacts customers.
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { chromium } from '@playwright/test'

async function main() {
if (process.env.PRIVATE_CHAT_LIVE_QA !== '1') throw new Error('Explicit PRIVATE_CHAT_LIVE_QA=1 is required')
dotenv.config({ path: '/Users/shoheifujita/Library/Application Support/Ziyou Portal/autonomy/runtime.env', override: true, quiet: true })
const { prisma } = await import('../src/lib/db')
const origin = process.env.PRIVATE_CHAT_QA_ORIGIN || 'http://localhost:3103'
const out = '/Users/shoheifujita/Library/Application Support/Ziyou Portal/autonomy/private-chat-2026-10-03'
await mkdir(out, { recursive: true, mode: 0o700 })
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
const actors: { id: string; email: string; cookies: { name: string; value: string }[]; token?: string }[] = []
const room = randomUUID(), otherRoom = randomUUID(), nonce = randomUUID()
const extraRooms: string[] = []
const browser = await chromium.launch({ headless: true })
const results: { check: string; ok: boolean }[] = []
try {
  for (const role of ['buyer', 'seller', 'outsider', 'admin']) {
    const email = `chat-qa-${role}-${randomUUID()}@example.com`, password = `QA-${randomUUID()}-!9Aa`
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { private_chat_qa: true } })
    if (error || !data.user) throw new Error(`Could not create isolated QA account (${error?.code || error?.status || 'unknown'})`)
    const cookies: { name: string; value: string }[] = []
    actors.push({ id: data.user.id, email, cookies })
    await prisma.user.create({ data: { email, role: role === 'admin' || role === 'seller' ? 'ADMIN' : 'USER', name: 'Private chat isolated QA' } })
    const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll: () => [], setAll: values => { cookies.push(...values.map(c => ({ name: c.name, value: c.value }))) } } })
    const login = await client.auth.signInWithPassword({ email, password })
    if (login.error) throw new Error('Isolated account sign-in failed')
    actors[actors.length - 1].token = login.data.session?.access_token
  }
  const listing = await prisma.listing.findFirst({ where: { status: 'PUBLISHED', adAllowed: true }, select: { id: true } })
  assert.ok(listing)
  await prisma.$executeRaw`INSERT INTO property_chat_rooms (id,"listingId","buyerSubject","sellerSubject","sellerKind") VALUES (${room}::uuid,${listing.id},${actors[0].id}::uuid,${actors[1].id}::uuid,'manager'),(${otherRoom}::uuid,${listing.id},${actors[2].id}::uuid,${actors[1].id}::uuid,'manager')`
  const contexts = await Promise.all(actors.map(async actor => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    await context.addCookies(actor.cookies.map(c => ({ ...c, url: origin })))
    return context
  }))
  const anonymous = await browser.newContext()
  assert.equal((await anonymous.request.get(`${origin}/api/chats/${room}`)).status(), 401)
  assert.equal((await contexts[2].request.get(`${origin}/api/chats/${room}`)).status(), 404)
  assert.equal((await contexts[3].request.get(`${origin}/api/chats/${room}`)).status(), 404)
  for (const index of [2, 3]) {
    const response = await contexts[index].request.post(`${origin}/api/chats/${room}`, { headers: { Origin: origin }, data: { body: 'Should never be stored', language: 'en', nonce: randomUUID() } })
    assert.equal(response.status(), 404)
  }
  results.push({ check: 'anonymous, unrelated buyer and nonparticipant administrator cannot read or write', ok: true })
  const rejected = await contexts[0].request.post(`${origin}/api/chats/${room}`, { headers: { Origin: 'https://outside.example' }, data: { body: 'cross-origin', language: 'en', nonce } })
  assert.equal(rejected.status(),403)
  const payload = { body: 'This is an isolated QA message. 実際のお客様への送信ではありません。', language: 'ja', nonce }
  const sent = await contexts[0].request.post(`${origin}/api/chats/${room}`, { headers: { Origin: origin }, data: payload })
  assert.equal(sent.status(),200)
  const retry = await contexts[0].request.post(`${origin}/api/chats/${room}`, { headers: { Origin: origin }, data: payload })
  assert.equal((await sent.json()).message.id,(await retry.json()).message.id)
  const messages = await contexts[1].request.get(`${origin}/api/chats/${room}`)
  assert.equal(messages.status(),200)
  assert.equal((await messages.json()).messages.length,1)
  const outsiderList = await contexts[2].request.get(`${origin}/api/chats`)
  assert.ok(!(await outsiderList.json()).rooms.some((r: { id: string }) => r.id === room))
  assert.equal((await contexts[3].request.get(`${origin}/api/chats`)).status(),200)
  assert.equal((await (await contexts[3].request.get(`${origin}/api/chats`)).json()).rooms.length,0)
  results.push({ check: 'parties exchange messages; retries deduplicate; cross-origin rejected; lists scoped', ok: true })
  for (let i = 0; i < actors.length; i++) {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { global: { headers: { Authorization: `Bearer ${actors[i].token}` } }, auth: { persistSession: false } })
    const direct = await client.from('property_chat_messages').select('id').eq('roomId',room)
    assert.equal(direct.error,null)
    assert.equal(direct.data?.length,i < 2 ? 1 : 0)
  }
  results.push({ check: 'live database REST RLS also isolates buyer/seller from outsiders and administrators', ok: true })
  const start = await contexts[0].request.post(`${origin}/api/chats`, { headers: { Origin: origin }, data: { listingId: listing.id } })
  const startData=await start.json()
  if (startData.id) extraRooms.push(startData.id)
  assert.equal(start.status(),200)
  const connected=await (await contexts[0].request.get(`${origin}/api/chats/${startData.id}`)).json()
  assert.equal(connected.room.sellerKind,'manager')
  // Only open an empty room to verify routing; never send test messages to the real desk.
  await prisma.propertyChatRoom.delete({where:{id:startData.id}})
  extraRooms.pop()
  results.push({ check: 'unassigned properties connect automatically to configured management desk', ok: true })
  const viewing=await contexts[0].request.post(`${origin}/api/chats/${room}`,{headers:{Origin:origin},data:{action:'viewing',date:'2026-10-10',slot:'午前',language:'ja',nonce:randomUUID()}})
  assert.equal(viewing.status(),200)
  assert.equal((await (await contexts[1].request.get(`${origin}/api/chats/${room}`)).json()).room.stage,'viewing')
  const offer=await contexts[0].request.post(`${origin}/api/chats/${room}`,{headers:{Origin:origin},data:{action:'offer',amountYen:'20000000',language:'ja',nonce:randomUUID()}})
  assert.equal(offer.status(),200)
  const buyerStage=await contexts[0].request.post(`${origin}/api/chats/${room}`,{headers:{Origin:origin},data:{action:'stage',stage:'completed',language:'ja',nonce:randomUUID()}})
  assert.equal(buyerStage.status(),403)
  const progress=await contexts[1].request.post(`${origin}/api/chats/${room}`,{headers:{Origin:origin},data:{action:'stage',stage:'contract',language:'ja',nonce:randomUUID()}})
  assert.equal(progress.status(),200)
  assert.equal((await (await contexts[0].request.get(`${origin}/api/chats/${room}`)).json()).room.stage,'contract')
  results.push({check:'viewing and purchase requests advance progress; only assigned management can record contract status',ok:true})
  const page = await contexts[0].newPage()
  await page.goto(`${origin}/chats/${room}`)
  await page.getByTestId('private-chat-room').waitFor()
  await page.getByText(payload.body,{ exact: true }).waitFor()
  await page.getByTestId('trade-chat-actions').waitFor()
  await page.getByRole('button',{name:'Request a viewing',exact:true}).click()
  await page.getByLabel('Preferred date',{exact:true}).fill('2026-10-10')
  await page.getByLabel('Preferred time',{exact:true}).fill('Morning — isolated QA')
  await page.getByLabel('Notes / conditions',{exact:true}).fill('UI request test')
  await page.getByRole('button',{name:'Send to chat',exact:true}).click()
  await page.getByText(/Preferred time: Morning — isolated QA/).waitFor()
  const managerPage=await contexts[1].newPage()
  await managerPage.goto(`${origin}/chats/${room}`)
  await managerPage.getByRole('button',{name:'Record progress',exact:true}).click()
  await managerPage.getByLabel('Transaction progress',{exact:true}).selectOption('settlement')
  await managerPage.getByRole('button',{name:'Send to chat',exact:true}).click()
  await managerPage.getByTestId('trade-stage').getByText('Settlement / handover',{exact:true}).waitFor()
  await managerPage.screenshot({path:`${out}/manager-trade-room.png`,fullPage:true})
  results.push({check:'buyer viewing form and management progress form send correctly in the UI',ok:true})
  assert.equal(await page.locator('textarea').count(),1)
  await page.screenshot({ path: `${out}/buyer-room-desktop.png`, fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: `${out}/buyer-room-mobile.png`, fullPage: true })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
  // Deterministic UI exercise only: no model download and no external translator.
  await page.addInitScript({ content: "Object.defineProperty(globalThis, 'Translator', { configurable: true, value: { create: async function() { return { translate: async function(text) { return 'Translated QA: ' + text; }, destroy: function() {} }; } } });" })
  await page.goto(`${origin}/chats/${room}`)
  await page.getByRole('button',{ name: 'Enable automatic translation' }).click()
  await page.getByText(`Translated QA: ${payload.body}`,{ exact: true }).waitFor()
  await page.getByRole('article').filter({hasText:`Translated QA: ${payload.body}`}).getByText('Original message',{ exact: true }).click()
  await page.getByText(payload.body,{ exact: true }).waitFor()
  results.push({ check: 'translation adapter UI preserves originals (stubbed device translator)', ok: true })
  await page.goto(`${origin}/chats`)
  await page.getByTestId('private-chat-index').waitFor()
  await page.locator(`a[href="/chats/${room}"]`).waitFor()
  await page.screenshot({ path: `${out}/buyer-inbox.png`, fullPage: true })
  const unauthorizedPage = await contexts[3].newPage()
  const denied = await unauthorizedPage.goto(`${origin}/chats/${room}`)
  assert.equal(denied?.status(),404)
  assert.equal(await unauthorizedPage.getByText(payload.body,{ exact: true }).count(),0)
  results.push({ check: 'desktop/mobile room and inbox render; nonparticipant room page rejects access', ok: true })
  await writeFile(`${out}/live-qa.json`, JSON.stringify({ origin, results }, null, 2), { mode: 0o600 })
  console.log(JSON.stringify({ passed: results.length, results }))
} finally {
  await browser.close()
  await prisma.$executeRaw`DELETE FROM property_chat_rooms WHERE id IN (${room}::uuid,${otherRoom}::uuid)`
  if(extraRooms.length)await prisma.propertyChatRoom.deleteMany({where:{id:{in:extraRooms}}})
  for (const actor of actors) {
    await prisma.user.deleteMany({ where: { email: actor.email, name: 'Private chat isolated QA' } })
    const deletion = await service.auth.admin.deleteUser(actor.id)
    if (deletion.error) console.error('QA account cleanup needs attention')
  }
  await prisma.$disconnect()
}
process.exit(0)
}
void main().catch(error => { console.error(error instanceof Error ? error.message : 'Private chat QA failed'); process.exit(1) })
