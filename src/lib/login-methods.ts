import { safeAuthRedirect } from './auth-redirect'

export const socialMethods = [
  { id: 'google', name: 'Google', sdkProvider: 'google', guide: 'https://supabase.com/docs/guides/auth/social-login/auth-google' },
  { id: 'apple', name: 'Apple', sdkProvider: 'apple', guide: 'https://supabase.com/docs/guides/auth/social-login/auth-apple' },
  { id: 'facebook', name: 'Facebook', sdkProvider: 'facebook', guide: 'https://supabase.com/docs/guides/auth/social-login/auth-facebook' },
] as const

export type SocialMethodId = typeof socialMethods[number]['id']
export type LoginMethods = { providers: SocialMethodId[]; emailLink: boolean }

/** Only known, enabled providers can enter the public login UI. Never return provider credentials. */
export function selectLoginMethods(settings: unknown): LoginMethods {
  const external = settings && typeof settings === 'object' && 'external' in settings
    && settings.external && typeof settings.external === 'object' ? settings.external as Record<string, unknown> : {}
  return {
    providers: socialMethods.filter(method => external[method.sdkProvider] === true).map(method => method.id),
    emailLink: external.email === true,
  }
}

export function authCallbackUrl(origin: string, next: string | null, assignment?: string): string {
  const url = new URL('/api/auth/callback', origin)
  url.searchParams.set('next', safeAuthRedirect(next))
  if (assignment && /^[A-Za-z0-9_.-]{1,4096}$/.test(assignment)) url.searchParams.set('funnel_assignment', assignment)
  return url.toString()
}

export function loginMethod(id: string) {
  return socialMethods.find(method => method.id === id)
}

export function parseLoginMethods(value: unknown): LoginMethods {
  if (!value || typeof value !== 'object') return { providers: [], emailLink: false }
  const data = value as Record<string, unknown>
  return {
    providers: socialMethods.filter(method => Array.isArray(data.providers) && data.providers.includes(method.id)).map(method => method.id),
    emailLink: data.emailLink === true,
  }
}

export function socialLoginRequest(id: string, origin: string, next: string | null, assignment?: string) {
  const method = loginMethod(id)
  if (!method) throw new Error('Unsupported login method')
  return {
    provider: method.sdkProvider,
    options: {
      redirectTo: authCallbackUrl(origin, next, assignment),
    },
  }
}

export function emailLoginRequest(email: string, origin: string, next: string | null, assignment?: string) {
  return { email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: authCallbackUrl(origin, next, assignment) } }
}
