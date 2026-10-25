import { translateCityName } from './translate-fields'

// Tokyo's 23 wards on a rough north-to-south grid; the footer lists wards in this order.
// The area map itself draws real outlines (see ward-shapes.ts).
export const WARD_TILES = [
  { ward: '練馬区', row: 0, col: 1 }, { ward: '板橋区', row: 0, col: 2 }, { ward: '北区', row: 0, col: 3 }, { ward: '足立区', row: 0, col: 4 },
  { ward: '杉並区', row: 1, col: 0 }, { ward: '中野区', row: 1, col: 1 }, { ward: '豊島区', row: 1, col: 2 }, { ward: '文京区', row: 1, col: 3 }, { ward: '荒川区', row: 1, col: 4 }, { ward: '葛飾区', row: 1, col: 5 },
  { ward: '世田谷区', row: 2, col: 0 }, { ward: '渋谷区', row: 2, col: 1 }, { ward: '新宿区', row: 2, col: 2 }, { ward: '千代田区', row: 2, col: 3 }, { ward: '台東区', row: 2, col: 4 }, { ward: '墨田区', row: 2, col: 5 }, { ward: '江戸川区', row: 2, col: 6 },
  { ward: '目黒区', row: 3, col: 1 }, { ward: '港区', row: 3, col: 2 }, { ward: '中央区', row: 3, col: 3 }, { ward: '江東区', row: 3, col: 4 },
  { ward: '大田区', row: 4, col: 1 }, { ward: '品川区', row: 4, col: 2 },
] as const

/** URL slugs for ward pages and ward articles. */
export const WARD_SLUGS: Record<string, string> = {
  '千代田区': 'chiyoda', '中央区': 'chuo', '港区': 'minato', '新宿区': 'shinjuku', '文京区': 'bunkyo', '台東区': 'taito', '墨田区': 'sumida', '江東区': 'koto', '品川区': 'shinagawa', '目黒区': 'meguro', '大田区': 'ota', '世田谷区': 'setagaya', '渋谷区': 'shibuya', '中野区': 'nakano', '杉並区': 'suginami', '豊島区': 'toshima', '北区': 'kita', '荒川区': 'arakawa', '板橋区': 'itabashi', '練馬区': 'nerima', '足立区': 'adachi', '葛飾区': 'katsushika', '江戸川区': 'edogawa',
}

export const WARD_GRID = { rows: 5, cols: 7 } as const

/** The 23 wards in English, Traditional and Simplified Chinese; other cities stay as written. */
export const WARD_NAMES: Record<string, [string, string, string]> = {
  千代田区: ['Chiyoda', '千代田區', '千代田区'], 中央区: ['Chuo', '中央區', '中央区'], 港区: ['Minato', '港區', '港区'],
  新宿区: ['Shinjuku', '新宿區', '新宿区'], 文京区: ['Bunkyo', '文京區', '文京区'], 台東区: ['Taito', '台東區', '台东区'],
  墨田区: ['Sumida', '墨田區', '墨田区'], 江東区: ['Koto', '江東區', '江东区'], 品川区: ['Shinagawa', '品川區', '品川区'],
  目黒区: ['Meguro', '目黑區', '目黑区'], 大田区: ['Ota', '大田區', '大田区'], 世田谷区: ['Setagaya', '世田谷區', '世田谷区'],
  渋谷区: ['Shibuya', '澀谷區', '涩谷区'], 中野区: ['Nakano', '中野區', '中野区'], 杉並区: ['Suginami', '杉並區', '杉并区'],
  豊島区: ['Toshima', '豐島區', '丰岛区'], 北区: ['Kita', '北區', '北区'], 荒川区: ['Arakawa', '荒川區', '荒川区'],
  板橋区: ['Itabashi', '板橋區', '板桥区'], 練馬区: ['Nerima', '練馬區', '练马区'], 足立区: ['Adachi', '足立區', '足立区'],
  葛飾区: ['Katsushika', '葛飾區', '葛饰区'], 江戸川区: ['Edogawa', '江戶川區', '江户川区'],
}

export function wardLabel(ward: string, locale: string): string {
  if (locale === 'en') return translateCityName(ward, locale) || ward
  if (locale === 'zh-TW') return WARD_NAMES[ward]?.[1] ?? ward.replace('区', '區')
  if (locale === 'zh-CN') return WARD_NAMES[ward]?.[2] ?? ward
  return ward
}

export function countByWard(rows: { city: string | null }[]): Record<string, number> {
  return rows.reduce<Record<string, number>>((counts, row) => {
    if (row.city) counts[row.city] = (counts[row.city] ?? 0) + 1
    return counts
  }, {})
}

export function wardFromSlug(slug: string): string | null {
  return Object.entries(WARD_SLUGS).find(([, value]) => value === slug)?.[0] ?? null
}

export interface WardSummary {
  count: number
  minPrice: number | null
  maxPrice: number | null
  types: { type: string; count: number }[]
}

export function summarizeWard(rows: { propertyType: string | null; price: number | string | bigint | null }[]): WardSummary {
  const prices = rows.map((row) => Number(row.price)).filter((price) => Number.isFinite(price) && price > 0)
  const types = new Map<string, number>()
  for (const row of rows) if (row.propertyType) types.set(row.propertyType, (types.get(row.propertyType) ?? 0) + 1)
  return {
    count: rows.length,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    types: [...types].map(([type, count]) => ({ type, count })).sort((left, right) => right.count - left.count),
  }
}

/**
 * Average residential land price per ward (円/㎡), 令和8年地価公示 as of 2026-01-01, from the Tokyo
 * Metropolitan Government's 区市町村別用途別平均価格表 (住宅地). Update each March when the new
 * figures are published.
 */
export const WARD_LAND_PRICE = {
  year: 2026,
  source: 'https://www.zaimu.metro.tokyo.lg.jp/documents/d/zaimu/05_r8kouji_heikin-kakaku',
  yenPerSqm: {
    千代田区: 3_631_400, 中央区: 1_930_000, 港区: 3_013_700, 新宿区: 1_131_600, 渋谷区: 1_874_100, 文京区: 1_448_100,
    台東区: 1_320_800, 墨田区: 613_300, 江東区: 661_500, 品川区: 1_244_100, 目黒区: 1_404_500, 大田区: 647_600,
    世田谷区: 779_900, 中野区: 782_700, 杉並区: 703_200, 豊島区: 912_100, 北区: 742_000, 荒川区: 718_700,
    板橋区: 553_600, 練馬区: 480_500, 足立区: 410_800, 葛飾区: 387_500, 江戸川区: 441_100,
  } as Record<string, number>,
} as const

/** Three shades for the ward map: 0 = under ¥650,000/㎡, 1 = up to ¥1.2M, 2 = ¥1.2M and above. */
export function landPriceTier(ward: string): 0 | 1 | 2 {
  const price = WARD_LAND_PRICE.yenPerSqm[ward] ?? 0
  return price >= 1_200_000 ? 2 : price >= 650_000 ? 1 : 0
}
