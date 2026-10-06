import 'server-only'
import { selectLoginMethods, type LoginMethods } from './login-methods'

const closed: LoginMethods = { providers: [], emailLink: false }
let cached: { value: LoginMethods; until: number } | undefined
let pending: Promise<LoginMethods> | undefined

async function readMethods(): Promise<LoginMethods> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !key) return closed
  try {
    const response = await fetch(`${base}/auth/v1/settings`, { headers: { apikey: key }, cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (!response.ok) return closed
    const settings: unknown = await response.json()
    return selectLoginMethods(settings)
  } catch { return closed }
}

export async function getLoginMethods(): Promise<LoginMethods> {
  if (cached && cached.until > Date.now()) return cached.value
  if (!pending) pending = readMethods().then(value => {
    cached = { value, until: Date.now() + 60000 }
    return value
  }).finally(() => { pending = undefined })
  return pending
}
