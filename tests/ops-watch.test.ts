import assert from 'node:assert/strict'
import test from 'node:test'
import { INITIAL_UPTIME_STATE, backupFileName, backupsToDelete, describeFetchFailure, isHealthy, nextUptimeState, uptimePaths } from '../src/lib/ops-watch'

const SITE = 'https://portal.example.com'
const ok = [{ path: '/', status: 200 }, { path: '/listings', status: 200 }]
const bad = [{ path: '/', status: 500 }, { path: '/listings', status: null, error: 'timeout' }]
const at = (iso: string) => new Date(iso)

test('the site is healthy only when every page answers 200', () => {
  assert.equal(isHealthy(ok), true)
  assert.equal(isHealthy([{ path: '/', status: 200 }, { path: '/listings', status: 503 }]), false)
  assert.equal(isHealthy([]), false)
})

test('no mail while the site stays up', () => {
  const next = nextUptimeState(INITIAL_UPTIME_STATE, ok, at('2026-10-27T00:00:00Z'), SITE)
  assert.equal(next.mail, null)
  assert.deepEqual(next.state, INITIAL_UPTIME_STATE)
})

test('one failed run is a blip: no mail, and the next good run clears it', () => {
  const blip = nextUptimeState(INITIAL_UPTIME_STATE, bad, at('2026-10-27T09:13:00Z'), SITE)
  assert.equal(blip.mail, null)
  assert.equal(blip.state.down, false)
  assert.equal(blip.state.failedRuns, 1)

  const back = nextUptimeState(blip.state, ok, at('2026-10-27T09:23:00Z'), SITE)
  assert.equal(back.mail, null)
  assert.deepEqual(back.state, INITIAL_UPTIME_STATE)
})

test('two failed runs mail, then only every six hours, then once on recovery', () => {
  const first = nextUptimeState(INITIAL_UPTIME_STATE, bad, at('2026-10-27T00:00:00Z'), SITE)
  assert.equal(first.mail, null)

  const down = nextUptimeState(first.state, bad, at('2026-10-27T00:10:00Z'), SITE)
  assert.match(down.mail!.subject, /至急/)
  assert.match(down.mail!.text, /listings → 応答なし（timeout）/)
  assert.match(down.mail!.text, /10分おきの確認で2回続けて失敗/)
  assert.equal(down.state.since, '2026-10-27T00:00:00.000Z')

  const later = nextUptimeState(down.state, bad, at('2026-10-27T03:00:00Z'), SITE)
  assert.equal(later.mail, null)
  assert.equal(later.state.since, '2026-10-27T00:00:00.000Z')

  const reminder = nextUptimeState(later.state, bad, at('2026-10-27T06:10:00Z'), SITE)
  assert.match(reminder.mail!.subject, /継続中/)

  const back = nextUptimeState(reminder.state, ok, at('2026-10-27T06:30:00Z'), SITE)
  assert.match(back.mail!.subject, /復旧/)
  assert.match(back.mail!.text, /約390分/)
  assert.deepEqual(back.state, INITIAL_UPTIME_STATE)
})

test('the app-rendered page is opened hourly, and on every run while something fails', () => {
  const light = ['/robots.txt'], full = ['/robots.txt', '/']
  assert.deepEqual(uptimePaths(INITIAL_UPTIME_STATE, at('2026-10-28T00:00:00Z')), full)
  const checked = { ...INITIAL_UPTIME_STATE, lastFullAt: '2026-10-28T00:00:00.000Z' }
  assert.deepEqual(uptimePaths(checked, at('2026-10-28T00:50:00Z')), light)
  assert.deepEqual(uptimePaths(checked, at('2026-10-28T01:00:00Z')), full)
  assert.deepEqual(uptimePaths({ ...checked, failedRuns: 1 }, at('2026-10-28T00:10:00Z')), full)
  assert.deepEqual(uptimePaths({ ...checked, down: true }, at('2026-10-28T00:10:00Z')), full)
  // Clearing a blip keeps the time of the last full look.
  assert.equal(nextUptimeState({ ...checked, failedRuns: 1 }, ok, at('2026-10-28T00:10:00Z'), SITE).state.lastFullAt, checked.lastFullAt)
})

test('network failures are named by their cause', () => {
  const failed = (code?: string) => new TypeError('fetch failed', { cause: code ? Object.assign(new Error('x'), { code }) : undefined })
  assert.equal(describeFetchFailure(failed('UND_ERR_CONNECT_TIMEOUT')), '10秒以内につながらない')
  assert.equal(describeFetchFailure(failed('ENOTFOUND')), 'DNSでアドレスを引けない')
  assert.equal(describeFetchFailure(failed('EPROTO')), '接続できない（EPROTO）')
  assert.equal(describeFetchFailure(failed()), '接続できない')
  assert.equal(describeFetchFailure(new DOMException('slow', 'TimeoutError')), '20秒以内に応答なし')
})

test('backups keep the newest eight and ignore other files', () => {
  const names = Array.from({ length: 10 }, (_, i) => `portal-2026-${String(i + 1).padStart(2, '0')}-01.dump`)
  assert.deepEqual(backupsToDelete([...names, 'notes.txt', 'before-autonomy.json']), ['portal-2026-01-01.dump', 'portal-2026-02-01.dump'])
  assert.deepEqual(backupsToDelete(names.slice(0, 3)), [])
})

test('backup files are named by the Tokyo date', () => {
  assert.equal(backupFileName(at('2026-10-25T19:30:00Z')), 'portal-2026-10-26.dump')
})
