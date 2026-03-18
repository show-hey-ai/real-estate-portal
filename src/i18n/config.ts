export const locales = ['ja', 'en', 'zh-TW', 'zh-CN'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ja'

export const localeNames: Record<Locale, string> = {
  ja: '日本語',
  en: 'English',
  'zh-TW': '繁體中文',
  'zh-CN': '简体中文',
}
