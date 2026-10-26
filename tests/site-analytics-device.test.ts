import assert from 'node:assert/strict'
import test from 'node:test'
import { deviceTypeFromUserAgent } from '../src/lib/site-analytics'

test('device type comes from the browser User-Agent', () => {
  assert.equal(deviceTypeFromUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'), 'mobile')
  assert.equal(deviceTypeFromUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'), 'mobile')
  assert.equal(deviceTypeFromUserAgent('Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'), 'tablet')
  assert.equal(deviceTypeFromUserAgent('Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'), 'tablet')
  assert.equal(deviceTypeFromUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'), 'desktop')
  assert.equal(deviceTypeFromUserAgent(null), null)
})
