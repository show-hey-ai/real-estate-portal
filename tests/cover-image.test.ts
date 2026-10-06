import assert from 'node:assert/strict'
import test from 'node:test'
import { pickCoverImage } from '../src/lib/cover-image'

test('photos are preferred over the floor plan', () => {
  assert.equal(pickCoverImage([{ url: 'plan', category: 'FLOORPLAN' }, { url: 'room', category: 'INTERIOR' }])?.url, 'room')
  assert.equal(pickCoverImage([{ url: 'room', category: 'INTERIOR' }, { url: 'outside', category: 'EXTERIOR' }])?.url, 'outside')
})

test('the operator sort order decides within a category', () => {
  assert.equal(pickCoverImage([{ url: 'b', category: 'INTERIOR', sortOrder: 2 }, { url: 'a', category: 'INTERIOR', sortOrder: 1 }])?.url, 'a')
})

test('a floor plan is still used when it is the only image, and no media gives null', () => {
  assert.equal(pickCoverImage([{ url: 'plan', category: 'FLOORPLAN' }])?.url, 'plan')
  assert.equal(pickCoverImage([]), null)
})
