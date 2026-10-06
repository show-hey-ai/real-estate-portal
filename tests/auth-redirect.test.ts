import assert from 'node:assert/strict'
import test from 'node:test'
import { safeAuthRedirect } from '../src/lib/auth-redirect'

test('authentication preserves property chat and rejects external redirects', () => {
  const chat = '/chats?listing=d0be7e20-8cb1-4665-80b6-2093cb53a024&start=1'
  assert.equal(safeAuthRedirect(chat), chat)
  for (const input of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example', '/%2fevil.example', '/%5cevil.example', '/\nevil.example', '/%0aevil.example', '/%zz', '/safe/..//evil.example', '/.//evil.example', '/%2e//evil.example']) {
    assert.equal(safeAuthRedirect(input), '/')
  }
})
