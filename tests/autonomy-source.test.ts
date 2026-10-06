import assert from 'node:assert/strict'
import test from 'node:test'
import { verifiedSourceId } from '../src/lib/autonomy/source-identity'

test('a stable REINS identity requires a full source-backed number with high-confidence evidence', () => {
  const evidence = [{ field: 'reins_property_id', raw_text: 'REINS物件番号１００１２３４５６７８９', confidence: 0.99 }]
  assert.equal(verifiedSourceId('100123456789', evidence), '100123456789')
  assert.equal(verifiedSourceId('100123456780', evidence), null)
  assert.equal(verifiedSourceId('100123456789', [{ ...evidence[0], confidence: 0.5 }]), null)
  assert.equal(verifiedSourceId('100123456789'), null)
})
