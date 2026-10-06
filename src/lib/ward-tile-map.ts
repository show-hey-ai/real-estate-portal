import { translateCityName } from './translate-fields'

// A tile map of Tokyo's 23 wards: each ward keeps its rough geographic neighbours
// so buyers can find an area at a glance without a heavy map library.
export const WARD_TILES = [
  { ward: '練馬区', row: 0, col: 1 }, { ward: '板橋区', row: 0, col: 2 }, { ward: '北区', row: 0, col: 3 }, { ward: '足立区', row: 0, col: 4 },
  { ward: '杉並区', row: 1, col: 0 }, { ward: '中野区', row: 1, col: 1 }, { ward: '豊島区', row: 1, col: 2 }, { ward: '文京区', row: 1, col: 3 }, { ward: '荒川区', row: 1, col: 4 }, { ward: '葛飾区', row: 1, col: 5 },
  { ward: '世田谷区', row: 2, col: 0 }, { ward: '渋谷区', row: 2, col: 1 }, { ward: '新宿区', row: 2, col: 2 }, { ward: '千代田区', row: 2, col: 3 }, { ward: '台東区', row: 2, col: 4 }, { ward: '墨田区', row: 2, col: 5 }, { ward: '江戸川区', row: 2, col: 6 },
  { ward: '目黒区', row: 3, col: 1 }, { ward: '港区', row: 3, col: 2 }, { ward: '中央区', row: 3, col: 3 }, { ward: '江東区', row: 3, col: 4 },
  { ward: '大田区', row: 4, col: 1 }, { ward: '品川区', row: 4, col: 2 },
] as const

export const WARD_GRID = { rows: 5, cols: 7 } as const

export function wardLabel(ward: string, locale: string): string {
  if (locale === 'en') return translateCityName(ward, locale) || ward
  if (locale === 'zh-TW') return ward.replace('区', '區')
  return ward
}

export function countByWard(rows: { city: string | null }[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    if (row.city) counts[row.city] = (counts[row.city] ?? 0) + 1
    return counts
  }, {})
}
