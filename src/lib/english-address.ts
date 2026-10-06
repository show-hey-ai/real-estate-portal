import townRomaji from '@/data/tokyo-town-romaji.json'

/**
 * English form of a public Tokyo address, e.g.
 * 「中野5丁目24-16 211号室」 in 中野区 → "Unit 211, 5-24-16 Nakano".
 * Town names come from Japan Post's romanised postcode data (src/data/tokyo-town-romaji.json);
 * unknown towns keep their Japanese name so the address is never wrong.
 */

const TOWNS = townRomaji as Record<string, Record<string, string>>
const KANJI_DIGITS: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }

function toAscii(value: string): string {
  return value.replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0)).replace(/[－‐―ー]/g, '-')
}

/** 「三」→3, 「十二」→12, 「5」→5. */
export function parseChome(value: string): number | null {
  const ascii = toAscii(value)
  if (/^\d+$/.test(ascii)) return Number(ascii)
  if (!/^[一二三四五六七八九十]+$/.test(value)) return null
  if (!value.includes('十')) return KANJI_DIGITS[value] ?? null
  const [tens, ones] = value.split('十')
  return (tens ? KANJI_DIGITS[tens] ?? 0 : 1) * 10 + (ones ? KANJI_DIGITS[ones] ?? 0 : 0)
}

export function romanizeTown(ward: string, town: string): string {
  return TOWNS[ward]?.[town] ?? town
}

/** The street part after the ward, in English order; returns null when it cannot be parsed. */
export function englishStreet(ward: string, street: string): string | null {
  const text = toAscii(street.trim())
  // Town names can start with kanji numerals (三田, 九段北), so the town is the shortest prefix before 「N丁目」.
  const withChome = text.match(/^(.+?)(\d+|[一二三四五六七八九十]+)丁目\s*(\d+(?:-\d+)*)?\s*(.*)$/u)
  const withoutChome = withChome ? null : text.match(/^(\D+?)\s*(\d+(?:-\d+)*)\s*(.*)$/u)
  const townOnly = withChome || withoutChome ? null : text.match(/^(\D+)$/u)
  if (!withChome && !withoutChome && !townOnly) return null
  const town = (withChome?.[1] ?? withoutChome?.[1] ?? townOnly?.[1] ?? '').trim()
  const chome = withChome ? parseChome(withChome[2]) : null
  const block = withChome?.[3] ?? withoutChome?.[2] ?? null
  const rest = withChome?.[4] ?? withoutChome?.[3] ?? ''
  const unit = rest.match(/(\d+)号室/)?.[1]
  const floor = unit ? undefined : rest.match(/(\d+)階/)?.[1]
  const number = chome !== null ? (block ? `${chome}-${block}` : `${chome}-chome`) : block ?? ''
  const line = [number, romanizeTown(ward, town)].filter(Boolean).join(' ')
  return [unit ? `Unit ${unit}` : floor ? `${floor}F` : null, line].filter(Boolean).join(', ')
}
