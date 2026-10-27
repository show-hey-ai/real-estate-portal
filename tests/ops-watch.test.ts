import assert from 'node:assert/strict'
import test from 'node:test'
import { INITIAL_UPTIME_STATE, backupFileName, backupsToDelete, isHealthy, nextUptimeState } from '../src/lib/ops-watch'

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

test('going down mails at once, then only every six hours, then once on recovery', () => {
  const down = nextUptimeState(INITIAL_UPTIME_STATE, bad, at('2026-10-27T00:00:00Z'), SITE)
  assert.match(down.mail!.subject, /至急/)
  assert.match(down.mail!.text, /listings → 応答なし（timeout）/)
  assert.equal(down.state.since, '2026-10-27T00:00:00.000Z')

  const later = nextUptimeState(down.state, bad, at('2026-10-27T03:00:00Z'), SITE)
  assert.equal(later.mail, null)
  assert.equal(later.state.since, '2026-10-27T00:00:00.000Z')

  const reminder = nextUptimeState(later.state, bad, at('2026-10-27T06:00:00Z'), SITE)
  assert.match(reminder.mail!.subject, /継続中/)

  const back = nextUptimeState(reminder.state, ok, at('2026-10-27T06:30:00Z'), SITE)
  assert.match(back.mail!.subject, /復旧/)
  assert.match(back.mail!.text, /約390分/)
  assert.deepEqual(back.state, INITIAL_UPTIME_STATE)
})

test('backups keep the newest eight and ignore other files', () => {
  const names = Array.from({ length: 10 }, (_, i) => `portal-2026-${String(i + 1).padStart(2, '0')}-01.dump`)
  assert.deepEqual(backupsToDelete([...names, 'notes.txt', 'before-autonomy.json']), ['portal-2026-01-01.dump', 'portal-2026-02-01.dump'])
  assert.deepEqual(backupsToDelete(names.slice(0, 3)), [])
})

test('backup files are named by the Tokyo date', () => {
  assert.equal(backupFileName(at('2026-10-25T19:30:00Z')), 'portal-2026-10-26.dump')
})
