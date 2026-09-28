import assert from 'node:assert/strict'
import test from 'node:test'
import { translateStructure } from '../src/lib/translate-fields'

test('structure translations preserve the construction type', () => {
  assert.equal(translateStructure('S', 'en'), 'Steel Frame (S)')
  assert.equal(translateStructure('S', 'zh-CN'), '钢骨结构 (S)')
  assert.equal(translateStructure('SRC造', 'en'), 'Steel Reinforced Concrete (SRC)')
  assert.equal(translateStructure('RC造', 'en'), 'Reinforced Concrete (RC)')
  assert.equal(translateStructure('鉄骨鉄筋コンクリート造', 'en'), 'Steel Reinforced Concrete (SRC)')
})
