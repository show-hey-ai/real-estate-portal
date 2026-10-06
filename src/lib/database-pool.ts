import type { PoolConfig } from 'pg'

export function databasePoolConfig(env: Record<string, string | undefined>): PoolConfig {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required')
  let url: URL
  try { url = new URL(env.DATABASE_URL) }
  catch { throw new Error('DATABASE_URL is invalid') }
  const serverless = env.VERCEL === '1'
  // Supavisor transaction mode releases the database connection between transactions.
  // Local workers and migration connections retain their existing connection mode.
  if (serverless && url.hostname.endsWith('.pooler.supabase.com') && url.port === '5432') {
    url.port = '6543'
  }
  const ca = env.DATABASE_SSL_CA
  if (ca) {
    // pg URL options otherwise override the explicit trusted certificate.
    for (const key of ['ssl', 'sslmode', 'sslrootcert', 'sslcert', 'sslkey', 'uselibpqcompat']) {
      url.searchParams.delete(key)
    }
  }
  return {
    connectionString: url.href,
    ...(ca ? { ssl: { ca, rejectUnauthorized: true } } : {}),
    ...(serverless ? { max: 2, min: 0, idleTimeoutMillis: 1000, connectionTimeoutMillis: 10000 } : {}),
  }
}
