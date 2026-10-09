import assert from 'node:assert/strict'
import test from 'node:test'
import { contactClickPath } from '../src/lib/contact-click-path'

test('a listing click is recorded on the listing page', () => {
  assert.equal(contactClickPath({ listingId: 'abc12345-0000', path: '/guides/x' }), '/listings/abc12345-0000')
})

test('guide and ward pages record their own path', () => {
  assert.equal(contactClickPath({ path: '/guides/japan-property-purchase-taxes-registration' }), '/guides/japan-property-purchase-taxes-registration')
  assert.equal(contactClickPath({ path: '/areas/minato' }), '/areas/minato')
})

test('anything else falls back to /match, the old default', () => {
  assert.equal(contactClickPath({}), '/match')
  assert.equal(contactClickPath({ path: 'https://evil.example/' }), '/match')
  assert.equal(contactClickPath({ path: '/guides/<script>' }), '/match')
  assert.equal(contactClickPath({ path: `/${'a'.repeat(300)}` }), '/match')
})
