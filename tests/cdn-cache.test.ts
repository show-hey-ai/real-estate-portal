import assert from 'node:assert/strict'
import test from 'node:test'
import { publicCachePlan } from '../src/lib/cdn-cache'

const visit = (overrides: Partial<Parameters<typeof publicCachePlan>[0]> = {}) =>
  publicCachePlan({ method: 'GET', pathname: '/listings', search: '', cookieNames: [], localeCookie: null, ...overrides })

test('anonymous public pages in a URL-fixed language are cached at the CDN', () => {
  assert.deepEqual(visit(), { action: 'cache' })
  assert.deepEqual(visit({ search: '?lang=ja', localeCookie: 'zh-CN' }), { action: 'cache' })
  assert.deepEqual(visit({ pathname: '/', localeCookie: 'en' }), { action: 'cache' })
  assert.deepEqual(visit({ pathname: '/listings/abc', method: 'HEAD' }), { action: 'cache' })
})

test('a remembered language on a plain URL redirects to that language URL instead of varying the page', () => {
  assert.deepEqual(visit({ localeCookie: 'ja' }), { action: 'redirect', location: '/listings?lang=ja' })
  assert.deepEqual(visit({ pathname: '/listings', search: '?ward=港区', localeCookie: 'zh-TW' }), { action: 'redirect', location: '/listings?ward=%E6%B8%AF%E5%8C%BA&lang=zh-TW' })
  assert.deepEqual(visit({ localeCookie: 'xx' }), { action: 'cache' })
})

test('signed-in visitors, personal pages and non-GET requests are never cached', () => {
  assert.deepEqual(visit({ cookieNames: ['sb-abc-auth-token'] }), { action: 'none' })
  assert.deepEqual(visit({ cookieNames: ['sb-abc-auth-token'], localeCookie: 'ja' }), { action: 'none' })
  for (const pathname of ['/match', '/alerts', '/login', '/register', '/compare', '/preview/x', '/favorites']) {
    assert.deepEqual(visit({ pathname }), { action: 'none' }, pathname)
  }
  assert.deepEqual(visit({ method: 'POST' }), { action: 'none' })
})
