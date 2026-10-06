import test from 'node:test'
import assert from 'node:assert/strict'
import Module, { createRequire } from 'node:module'
import { authCallbackUrl, emailLoginRequest, parseLoginMethods, selectLoginMethods, socialLoginRequest } from '../src/lib/login-methods'
import { getLoginMethodsCopy, socialButtonLabel } from '../src/lib/login-methods-copy'

test('only the three selected configured providers are public; unselected and unfinished methods fail closed', () => {
  const settings = { external: { email: true, google: true, apple: false, facebook: true, github: true, azure: true, line: true, wechat: true }, client_secret: 'never-public' }
  assert.deepEqual(selectLoginMethods(settings), { providers: ['google', 'facebook'], emailLink: true })
  assert.deepEqual(selectLoginMethods({ external: { google: 'true', apple: true, facebook: true } }), { providers: ['apple', 'facebook'], emailLink: false })
  assert.deepEqual(selectLoginMethods(null), { providers: [], emailLink: false })
  assert.deepEqual(parseLoginMethods({ providers: ['github', 'google', 'google', '//foreign.invalid', 'wechat', 'custom:line', 'azure'], emailLink: 'true' }), { providers: ['google'], emailLink: false })
  assert.doesNotMatch(JSON.stringify(selectLoginMethods(settings)), /secret|never-public|wechat|line|github|azure/)
})

test('selected social logins use the existing safe PKCE callback without extra data scopes', () => {
  const target = '/chats?listing=fixture&start=1'
  for (const id of ['google', 'apple', 'facebook']) {
    const request = socialLoginRequest(id, 'https://portal.ziyou-fudosan.com', target, 'fixture-assignment')
    const url = new URL(request.options.redirectTo)
    assert.equal(url.pathname, '/api/auth/callback')
    assert.equal(url.searchParams.get('next'), target)
    assert.equal(url.searchParams.get('funnel_assignment'), 'fixture-assignment')
    assert.equal(request.provider, id)
    assert.equal(Object.hasOwn(request.options, 'scopes'), false)
  }
  for (const id of ['wechat', 'line', 'azure', 'github']) assert.throws(() => socialLoginRequest(id, 'https://portal.ziyou-fudosan.com', '/match'), /Unsupported/)
})

test('email link supports new and existing accounts without exposing criteria or accepting external return URLs', () => {
  const request = emailLoginRequest(' buyer@example.test ', 'https://portal.ziyou-fudosan.com', '/match?purpose=residential')
  assert.equal(request.email, 'buyer@example.test')
  assert.equal(request.options.shouldCreateUser, true)
  assert.equal(new URL(request.options.emailRedirectTo).searchParams.get('next'), '/match?purpose=residential')
  for (const invalid of ['https://foreign.invalid', '//foreign.invalid', '/\\foreign.invalid', '/%2f%2fforeign.invalid']) {
    assert.equal(new URL(authCallbackUrl('https://portal.ziyou-fudosan.com', invalid, 'x&token=secret')).searchParams.get('next'), '/')
    assert.equal(new URL(authCallbackUrl('https://portal.ziyou-fudosan.com', invalid, 'x&token=secret')).searchParams.has('funnel_assignment'), false)
  }
})

test('four languages include sign-in feedback without provider diagnostics or passwords', () => {
  for (const locale of ['ja', 'en', 'zh-TW', 'zh-CN']) {
    const copy = getLoginMethodsCopy(locale)
    for (const value of [copy.emailLink, copy.send, copy.sent, copy.failed, copy.operatorNote, copy.selected, copy.callbackNote, ...Object.values(copy.requirements)]) assert(value.length > 4)
    assert(socialButtonLabel('Google', locale).includes('Google'))
  }
})

const require = createRequire(import.meta.url)
type Loader = { _load: (id: string, parent: { filename?: string } | undefined, ...args: unknown[]) => unknown }
const loader = Module as unknown as Loader
const originalLoad = loader._load

test('server availability fails closed, dedupes reads and never sends provider configuration to the client', async () => {
  const originalFetch = globalThis.fetch
  const oldBase = process.env.NEXT_PUBLIC_SUPABASE_URL, oldKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, oldAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.invalid'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'fixture-anon'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'fixture-server-secret'
  let calls = 0, failed = false
  globalThis.fetch = async input => {
    calls++
    if (failed) throw new Error('network unavailable fixture')
    return Response.json(String(input).endsWith('/settings') ? { external: { email: true, google: true } } : { providers: [{ identifier: 'custom:line', enabled: true, email_optional: false, client_secret: 'fixture-private' }] })
  }
  loader._load = function(id, parent, ...args) {
    if (id === 'server-only' && parent?.filename?.endsWith('login-methods-server.ts')) return {}
    return originalLoad.call(this, id, parent, ...args)
  }
  const path = require.resolve('../src/lib/login-methods-server')
  try {
    delete require.cache[path]
    const server = require(path) as typeof import('../src/lib/login-methods-server')
    const [a, b] = await Promise.all([server.getLoginMethods(), server.getLoginMethods()])
    assert.deepEqual(a, { providers: ['google'], emailLink: true })
    assert.deepEqual(b, a)
    assert.equal(calls, 1)
    await server.getLoginMethods()
    assert.equal(calls, 1)
    assert.doesNotMatch(JSON.stringify(a), /secret|private|fixture/)
    failed = true; delete require.cache[path]
    const closed = require(path) as typeof import('../src/lib/login-methods-server')
    assert.deepEqual(await closed.getLoginMethods(), { providers: [], emailLink: false })
  } finally {
    globalThis.fetch = originalFetch; loader._load = originalLoad; delete require.cache[path]
    for (const [key, value] of [['NEXT_PUBLIC_SUPABASE_URL', oldBase], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', oldKey], ['SUPABASE_SERVICE_ROLE_KEY', oldAdmin]]) {
      if (value === undefined) delete process.env[key!]; else process.env[key!] = value
    }
  }
})

test('callback preserves roles and profiles, rejects invalid codes and external destinations, and keeps recovery errors', async () => {
  let upserts = 0, signedOut = 0, failProfile = false, userEmail: string | undefined = 'buyer@example.test'
  const oldBase = process.env.NEXT_PUBLIC_SUPABASE_URL
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://fixture.supabase.invalid'
  let logoutMode = '', cleared: string[] = []
  const cookieStore = {
    getAll: () => ['sb-fixture-auth-token.0', 'sb-fixture-auth-token.1', 'sb-fixture-auth-token-code-verifier', 'sb-other-auth-token', 'locale', 'buyer-funnel'].map(name => ({ name, value: 'fixture' })),
    set: (name: string, value: string, options: { path: string; maxAge: number }) => { cleared.push(name); assert.equal(value, ''); assert.equal(options.maxAge, 0); assert.equal(options.path, '/') },
  }
  const db = { user: { upsert: async (request: { create: Record<string, unknown>; update: Record<string, unknown> }) => {
    upserts++; assert.deepEqual(request.update, {}); assert.deepEqual(Object.keys(request.create).sort(), ['email', 'name'])
    if (failProfile) throw new Error('private database message')
    return { role: 'ADMIN', name: 'preserved' }
  } } }
  const auth = {
    exchangeCodeForSession: async (code: string) => ({ data: { user: code === 'valid' ? { id: 'confirmed-user-id', email: userEmail, user_metadata: { role: 'ADMIN', name: { forged: true } } } : null }, error: code === 'valid' ? null : { message: 'private invalid code details' } }),
    signOut: async (options: { scope: string }) => { signedOut++; assert.equal(options.scope, 'local'); if (logoutMode === 'throw') throw new Error('fixture remote unavailable'); return { error: logoutMode === 'error' ? { status: 503 } : null } },
  }
  let confirmedId = ''
  loader._load = function(id, parent, ...args) {
    if (parent?.filename?.endsWith('/api/auth/callback/route.ts')) {
      if (id === '@/lib/supabase/server') return { createClient: async () => ({ auth }) }
      if (id === '@/lib/db') return { prisma: db }
      if (id === '@/lib/auth-redirect') return require('../src/lib/auth-redirect')
      if (id === '@/lib/buyer-funnel-server') return { confirmedFunnelEvent: async (user: { id: string }) => { confirmedId = user.id } }
      if (id === 'next/headers') return { cookies: async () => cookieStore }
    }
    return originalLoad.call(this, id, parent, ...args)
  }
  try {
    const route = require('../src/app/api/auth/callback/route') as typeof import('../src/app/api/auth/callback/route')
    const request = (query: string) => new Request(`https://portal.ziyou-fudosan.com/api/auth/callback?${query}`)
    const success = await route.GET(request('code=valid&next=%2Fchats%3Flisting%3Dfixture'))
    assert.equal(success.headers.get('location'), 'https://portal.ziyou-fudosan.com/chats?listing=fixture')
    assert.equal(confirmedId, 'confirmed-user-id'); assert.equal(upserts, 1)
    const external = await route.GET(request('code=valid&next=https%3A%2F%2Fforeign.invalid'))
    assert.equal(external.headers.get('location'), 'https://portal.ziyou-fudosan.com/')
    const failed = await route.GET(request('code=invalid&next=%2Fmatch'))
    assert.equal(failed.headers.get('location'), 'https://portal.ziyou-fudosan.com/login?error=auth_failed&redirect=%2Fmatch')
    const recover = await route.GET(request('code=invalid&next=%2Freset-password'))
    assert.equal(recover.headers.get('location'), 'https://portal.ziyou-fudosan.com/forgot-password?error=auth_failed')
    userEmail = undefined
    await route.GET(request('code=valid&next=%2Fmatch')); assert.equal(signedOut, 1)
    assert.deepEqual(cleared.sort(), ['sb-fixture-auth-token-code-verifier', 'sb-fixture-auth-token.0', 'sb-fixture-auth-token.1'].sort())
    userEmail = 'buyer@example.test'; failProfile = true
    const originalConsole = console.error; console.error = () => {}
    try {
      const dbFailed = await route.GET(request('code=valid&next=%2Freset-password'))
      assert.equal(dbFailed.headers.get('location'), 'https://portal.ziyou-fudosan.com/forgot-password?error=auth_failed')
      assert.equal(signedOut, 2)
      for (const mode of ['error', 'throw']) {
        logoutMode = mode; cleared = []
        const failedLogout = await route.GET(request('code=valid&next=%2Fmatch'))
        assert.equal(failedLogout.headers.get('location'), 'https://portal.ziyou-fudosan.com/login?error=auth_failed&redirect=%2Fmatch')
        assert.deepEqual(cleared.sort(), ['sb-fixture-auth-token-code-verifier', 'sb-fixture-auth-token.0', 'sb-fixture-auth-token.1'].sort())
      }
    } finally { console.error = originalConsole }
  } finally { loader._load = originalLoad; if (oldBase === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL; else process.env.NEXT_PUBLIC_SUPABASE_URL = oldBase }
})
