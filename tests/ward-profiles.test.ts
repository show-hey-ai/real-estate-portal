import assert from 'node:assert/strict'
import test from 'node:test'
import { wardProfiles, wardProfile } from '../src/content/ward-profiles'
import { WARD_SLUGS } from '../src/lib/ward-tile-map'

test('every ward page has a profile in all four languages', () => {
  for (const ward of Object.keys(WARD_SLUGS)) {
    const profile = wardProfiles[ward]
    assert.ok(profile, ward)
    for (const locale of ['ja', 'en', 'zh-TW', 'zh-CN'] as const) assert.ok(profile[locale].length > 20, `${ward}/${locale}`)
  }
  assert.equal(wardProfile('大阪市', 'ja'), null)
})
