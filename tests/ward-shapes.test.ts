import assert from 'node:assert/strict'
import test from 'node:test'
import { WARD_SHAPES, WARD_SHAPES_VIEWBOX } from '../src/lib/ward-shapes'
import { WARD_SLUGS } from '../src/lib/ward-tile-map'

test('the ward map draws each of the 23 wards once', () => {
  assert.equal(WARD_SHAPES.length, 23)
  assert.deepEqual(new Set(WARD_SHAPES.map((shape) => shape.ward)), new Set(Object.keys(WARD_SLUGS)))
})

test('every ward outline is a closed path and its label sits inside the map', () => {
  for (const { ward, d, label: [x, y] } of WARD_SHAPES) {
    assert.match(d, /^M[\d.]+ [\d.]+l/, ward)
    assert.ok(d.endsWith('z'), ward)
    assert.doesNotMatch(d, /NaN|Infinity/, ward)
    assert.ok(x > 0 && x < WARD_SHAPES_VIEWBOX.width, `${ward} label x`)
    assert.ok(y > 0 && y < WARD_SHAPES_VIEWBOX.height, `${ward} label y`)
  }
})
