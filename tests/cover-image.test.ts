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

const shot = (name: string, category: string, sortOrder = 0) => ({ url: `https://x/media/123/${name}.jpg`, category, sortOrder })

test('a full facade beats a partial or odd exterior shot even when listed first', () => {
  assert.equal(pickCoverImage([shot('upper-facade', 'EXTERIOR', 1), shot('facade', 'EXTERIOR', 2)])?.url, shot('facade', 'EXTERIOR').url)
  assert.equal(pickCoverImage([shot('view', 'EXTERIOR', 1), shot('entrance', 'EXTERIOR', 2)])?.url, shot('entrance', 'EXTERIOR').url)
})

test('without a full exterior, the living room comes before odd exterior views and wet rooms', () => {
  assert.equal(pickCoverImage([shot('balcony', 'EXTERIOR'), shot('bath', 'INTERIOR'), shot('living', 'INTERIOR')])?.url, shot('living', 'INTERIOR').url)
  assert.equal(pickCoverImage([shot('kitchen', 'INTERIOR', 1), shot('room', 'INTERIOR', 2)])?.url, shot('room', 'INTERIOR').url)
  assert.equal(pickCoverImage([shot('toilet', 'INTERIOR'), shot('plan', 'FLOORPLAN')])?.url, shot('toilet', 'INTERIOR').url)
})

test('unnamed uploads keep the category order', () => {
  assert.equal(pickCoverImage([shot('3f9a1c', 'INTERIOR'), shot('9b2e77', 'EXTERIOR')])?.url, shot('9b2e77', 'EXTERIOR').url)
})
