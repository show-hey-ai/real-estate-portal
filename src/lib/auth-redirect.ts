// Authentication returns only to a path on this portal.
export function safeAuthRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/'
  try {
    const decoded = decodeURIComponent(value)
    if (decoded.startsWith('//') || /[\\\u0000-\u0020]/.test(decoded)) return '/'
    const url = new URL(value, 'https://portal.invalid')
    const path = `${url.pathname}${url.search}${url.hash}`
    return url.origin === 'https://portal.invalid' && !path.startsWith('//') ? path : '/'
  } catch {
    return '/'
  }
}
