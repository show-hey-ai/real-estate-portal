import assert from 'node:assert/strict'
import test from 'node:test'
import { WARD_GRID, WARD_TILES, countByWard, wardLabel } from '../src/lib/ward-tile-map'

test('the tile map covers all 23 wards once, each in its own cell inside the grid', () => {
  assert.equal(WARD_TILES.length, 23)
  assert.equal(new Set(WARD_TILES.map((tile) => tile.ward)).size, 23)
  assert.equal(new Set(WARD_TILES.map((tile) => `${tile.row}:${tile.col}`)).size, 23)
  for (const tile of WARD_TILES) {
    assert.ok(tile.row >= 0 && tile.row < WARD_GRID.rows)
    assert.ok(tile.col >= 0 && tile.col < WARD_GRID.cols)
  }
})

test('ward labels follow the visitor language', () => {
  assert.equal(wardLabel('港区', 'ja'), '港区')
  assert.equal(wardLabel('港区', 'en'), 'Minato')
  assert.equal(wardLabel('港区', 'zh-TW'), '港區')
  assert.equal(wardLabel('港区', 'zh-CN'), '港区')
})

test('listings are counted per ward and rows without a ward are ignored', () => {
  assert.deepEqual(countByWard([{ city: '港区' }, { city: '港区' }, { city: '台東区' }, { city: null }]), { 港区: 2, 台東区: 1 })
})
