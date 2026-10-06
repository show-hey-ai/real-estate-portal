import { test } from 'node:test'
import assert from 'node:assert/strict'
import { databasePoolConfig } from '../src/lib/database-pool'

const pooler = 'postgresql://fixture:fake-password@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?sslmode=require'
test('serverless Supabase session connections become bounded transaction connections', () => {
  const config = databasePoolConfig({ DATABASE_URL: pooler, VERCEL: '1' })
  const url = new URL(config.connectionString!)
  assert.equal(url.port, '6543')
  assert.equal(url.username, 'fixture')
  assert.equal(url.password, 'fake-password')
  assert.equal(url.searchParams.get('sslmode'), 'require')
  assert.equal(config.max, 2)
  assert.equal(config.idleTimeoutMillis, 1000)
  assert.equal(config.connectionTimeoutMillis, 10000)
})
test('local sessions, direct hosts and existing transaction connections keep their mode', () => {
  assert.equal(new URL(databasePoolConfig({ DATABASE_URL: pooler }).connectionString!).port, '5432')
  for (const input of [pooler.replace(':5432', ':6543'), pooler.replace('.pooler.supabase.com', '.example.test'), pooler.replace(':5432', ':5444')]) {
    assert.equal(new URL(databasePoolConfig({ DATABASE_URL: input, VERCEL: '1' }).connectionString!).port, new URL(input).port)
  }
})
test('trusted CA verification overrides URL SSL flags without weakening TLS', () => {
  const config = databasePoolConfig({ DATABASE_URL: pooler + '&sslkey=unused&uselibpqcompat=true', DATABASE_SSL_CA: 'fixture-ca', VERCEL: '1' })
  const url = new URL(config.connectionString!)
  assert.equal(url.searchParams.has('sslmode'), false)
  assert.equal(url.searchParams.has('sslkey'), false)
  assert.equal(url.searchParams.has('uselibpqcompat'), false)
  assert.deepEqual(config.ssl, { ca: 'fixture-ca', rejectUnauthorized: true })
  assert.throws(() => databasePoolConfig({}), /DATABASE_URL is required/)
})
test('invalid connection URLs never expose credentials in error objects', () => {
  assert.throws(() => databasePoolConfig({ DATABASE_URL: pooler.replace(':5432', ':invalid') }), (error: unknown) => {
    assert(error instanceof Error)
    assert.equal(error.message, 'DATABASE_URL is invalid')
    assert.equal('input' in error, false)
    assert.equal('cause' in error, false)
    assert.equal(JSON.stringify(error).includes('fake-password'), false)
    return true
  })
})
