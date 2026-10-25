import assert from 'node:assert/strict'
import test from 'node:test'
import { isProfileComplete, parseStoredProfile, profileText } from '../src/lib/buyer-profile'

const full = { buyer: 'company-foreign', nationality: 'foreign', residence: 'overseas', funding: 'cash', purpose: 'invest' }

test('an enquiry can be sent only when every buyer question is answered', () => {
  assert.equal(isProfileComplete(full), true)
  assert.equal(isProfileComplete({ ...full, funding: undefined }), false)
  assert.equal(isProfileComplete({ ...full, buyer: 'alien' }), false)
})

test('the answers are written into the message in the visitor language', () => {
  assert.equal(profileText(full, 'ja'), '【購入者情報】\n購入名義：外国法人\n国籍（法人は代表者）：外国人\nお住まい（法人は所在地）：海外\n資金：現金（ローンなし）\n目的：賃貸・投資')
  assert.match(profileText(full, 'en'), /Buying as: A foreign company\n/)
})

test('saved answers keep only known choices', () => {
  assert.deepEqual(parseStoredProfile(JSON.stringify({ ...full, buyer: 'x', extra: 'y' })), { nationality: 'foreign', residence: 'overseas', funding: 'cash', purpose: 'invest' })
  assert.deepEqual(parseStoredProfile('not json'), {})
  assert.deepEqual(parseStoredProfile(null), {})
})
