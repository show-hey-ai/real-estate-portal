import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'
import { isLocalAnalyticsHost } from '../src/lib/site-analytics'

const require = createRequire(import.meta.url)
const { NextRequest } = require('next/server')
const serverSource = readFileSync(new URL('../src/lib/site-analytics-server.ts', import.meta.url), 'utf8')

function guard(admin: boolean, known = false) {
  let historyWrites = 0
  let authChecks = 0
  const exports: Record<string, (...args: unknown[]) => Promise<Response | null>> = {}
  runInNewContext(ts.transpileModule(serverSource, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    require: (name: string) => {
      if (name === 'next/server') return require(name)
      if (name === './site-analytics') return require('../src/lib/site-analytics.ts')
      if (name === './admin-auth') return { getAdminUserFromSession: async () => { authChecks++; return admin ? { id: 'administrator' } : null } }
      if (name === './db') return { prisma: {
        $executeRaw: async () => { historyWrites++; return 1 },
        $queryRaw: async () => [{ excluded: known }],
      } }
      throw new Error('Unexpected dependency: ' + name)
    },
  })
  return { skip: exports.skipInternalAnalytics, writes: () => historyWrites, authChecks: () => authChecks }
}

function request(cookie: string, agent = 'Mozilla/5.0', url = 'https://portal.ziyou-fudosan.com/api/analytics/page-view') {
  return new NextRequest(url, { method: 'POST', headers: { cookie, 'user-agent': agent } })
}

test('administrators are excluded on their first public visit and retain opt-out after logout', async () => {
  const g = guard(true)
  const response = await g.skip(request('tp_vid=verified-admin-browser; sb-project-auth-token.0=session'))
  assert.equal(response?.status, 204)
  assert.match(response?.headers.get('set-cookie') || '', /tp_internal=1/)
  assert.match(response?.headers.get('set-cookie') || '', /HttpOnly/i)
  assert.equal(g.writes(), 1)
  assert.equal(g.authChecks(), 1)
  const loggedOut = guard(false)
  assert.equal((await loggedOut.skip(request('tp_vid=verified-admin-browser; tp_internal=1')))?.status, 204)
  assert.equal(loggedOut.writes(), 0)
  assert.equal(loggedOut.authChecks(), 0)
})

test('regular signed-in buyers and anonymous buyers remain countable', async () => {
  const g = guard(false)
  assert.equal(await g.skip(request('tp_vid=customer-browser')), null)
  assert.equal(await g.skip(request('tp_vid=customer-browser; sb-project-auth-token=session')), null)
  assert.equal(g.writes(), 0)
})

test('a forged opt-out can never exclude another visitor history', async () => {
  const g = guard(false)
  await g.skip(request('tp_vid=another-browser; tp_internal=1'))
  assert.equal(g.writes(), 0)
  assert.equal((await guard(false, true).skip(request('tp_vid=verified-admin-browser')))?.status, 204)
})

test('local development and automation are suppressed without poisoning the exclusion registry', async () => {
  for (const host of ['localhost', 'app.localhost', '127.0.0.1', '127.0.0.2', '[::1]']) assert.equal(isLocalAnalyticsHost(host), true)
  for (const host of ['localhost.example.com', 'portal.ziyou-fudosan.com', '127.0.0.1.example']) assert.equal(isLocalAnalyticsHost(host), false)
  const g = guard(false)
  assert.equal((await g.skip(request('tp_vid=local-test-browser', 'Mozilla/5.0', 'http://localhost:3000/api/analytics/page-view')))?.status, 204)
  assert.equal((await g.skip(request('tp_vid=local-test-browser'), 'http://localhost:3000/'))?.status, 204)
  assert.equal((await g.skip(request('tp_vid=automated-browser', 'Ziyou-Autonomy-Health/1.0')))?.status, 204)
  assert.equal(g.writes(), 0)
})

test('all metrics exclude every page of a verified browser, preserve customers and retain original events', async () => {
  const db = new PGlite()
  try {
    await db.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE site_visit_events (id text PRIMARY KEY, "visitorId" text, "referrerHost" text, "pageType" text);')
    await db.exec(readFileSync(new URL('../prisma/migrations/20261006_internal_analytics/migration.sql', import.meta.url), 'utf8'))
    await db.exec(`INSERT INTO site_visit_events VALUES
      ('1','admin-browser',null,'home'), ('2','admin-browser','search.yahoo.co.jp','listing_detail'),
      ('3','admin-browser',null,'contact_click'), ('4','buyer-browser','search.yahoo.co.jp','home'),
      ('5','buyer-browser',null,'listing_detail'), ('6','local-browser','localhost','home');
      INSERT INTO site_analytics_exclusions ("visitorId",reason) VALUES ('admin-browser','administrator');`)
    assert.equal((await db.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM external_site_visit_events')).rows[0].count, 2)
    assert.equal((await db.query<{ count: number }>('SELECT COUNT(*)::int AS count FROM site_visit_events')).rows[0].count, 6)
    await db.exec('SET ROLE anon;')
    await assert.rejects(db.query('SELECT * FROM site_analytics_exclusions'))
    await assert.rejects(db.query('SELECT * FROM external_site_visit_events'))
    await db.exec('RESET ROLE; SET ROLE authenticated;')
    await assert.rejects(db.query(`INSERT INTO site_analytics_exclusions ("visitorId",reason) VALUES ('buyer-browser','administrator')`))
  } finally { await db.close() }
})
