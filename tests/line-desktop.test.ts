import assert from 'node:assert/strict'
import test from 'node:test'
import { canOpenLineChat, lineDesktopNote } from '../src/lib/line-desktop'

test('phones and tablets can open the LINE chat link', () => {
  assert.equal(canOpenLineChat({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148', maxTouchPoints: 5, platform: 'iPhone' }), true)
  assert.equal(canOpenLineChat({ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36', maxTouchPoints: 5, platform: 'Linux armv8l' }), true)
  // iPadOS reports a Mac but has a touch screen.
  assert.equal(canOpenLineChat({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15', maxTouchPoints: 5, platform: 'MacIntel' }), true)
})

test('computers cannot, so they are sent to the add-friend QR page instead', () => {
  assert.equal(canOpenLineChat({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', maxTouchPoints: 0, platform: 'MacIntel' }), false)
  assert.equal(canOpenLineChat({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36', maxTouchPoints: 0, platform: 'Win32' }), false)
})

test('the computer note exists in every language', () => {
  for (const locale of ['ja', 'en', 'zh-TW', 'zh-CN']) assert.ok(lineDesktopNote(locale).length > 20)
  assert.equal(lineDesktopNote('fr'), lineDesktopNote('en'))
})
