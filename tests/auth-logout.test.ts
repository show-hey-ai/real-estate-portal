import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../src/app/api/auth/logout/route.ts', import.meta.url), 'utf8')
function route(staleAppUrl?: string) {
  let signOutCalls = 0
  const exports: { POST?: (request: Request) => Promise<Response> } = {}
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  runInNewContext(compiled, {
    exports, Request, URL, process: { env: { NEXT_PUBLIC_APP_URL: staleAppUrl } },
    require: (name: string) => name === 'next/server' ? require('next/server') : {
      createClient: async () => ({ auth: { signOut: async () => { signOutCalls++; return { error: null } } } }),
    },
  })
  return { POST: exports.POST!, signOutCalls: () => signOutCalls }
}

test('logout remains on the requesting portal and follows POST with GET despite obsolete deployment settings', async () => {
  for (const appUrl of [undefined, 'https://real-estate-portal-show-hey-ais-projects.vercel.app', 'https://other.example']) {
    const r = route(appUrl)
    const response = await r.POST(new Request('https://portal.ziyou-fudosan.com/api/auth/logout', { method: 'POST', headers: { Origin: 'https://portal.ziyou-fudosan.com' } }))
    assert.equal(response.status, 303)
    assert.equal(new URL(response.headers.get('location')!, 'https://portal.ziyou-fudosan.com').href, 'https://portal.ziyou-fudosan.com/')
    assert.equal(response.headers.get('cache-control'), 'private, no-store')
    assert.equal(r.signOutCalls(), 1)
  }
})

test('cross-origin and originless logout requests cannot revoke a session', async () => {
  for (const origin of [null, 'null', 'https://outside.example', 'https://portal.ziyou-fudosan.com.outside.example']) {
    const r = route()
    const response = await r.POST(new Request('https://portal.ziyou-fudosan.com/api/auth/logout', { method: 'POST', headers: origin ? { Origin: origin } : {} }))
    assert.equal(response.status, 403)
    assert.equal(response.headers.get('location'), null)
    assert.equal(r.signOutCalls(), 0)
  }
})
