// Full asking prices in each language's natural units: 3億8,500万円 / 3億8,500萬日圓 / JPY 385,000,000.
const UNITS = {
  ja: { oku: '億', man: '万', yen: '円' },
  'zh-TW': { oku: '億', man: '萬', yen: '日圓' },
  'zh-CN': { oku: '亿', man: '万', yen: '日元' },
} as const

export function formatYenWords(value: number, locale: string): string {
  const units = UNITS[locale as keyof typeof UNITS]
  if (!units) return `JPY ${Math.round(value).toLocaleString('en-US')}`
  const total = Math.round(value)
  const oku = Math.floor(total / 100_000_000)
  const man = Math.floor((total % 100_000_000) / 10_000)
  const rest = total % 10_000
  if (rest !== 0) return `${total.toLocaleString('ja-JP')}${units.yen}`
  const parts = [oku ? `${oku.toLocaleString('ja-JP')}${units.oku}` : '', man ? `${man.toLocaleString('ja-JP')}${units.man}` : '']
  return `${parts.join('') || '0'}${units.yen}`
}
