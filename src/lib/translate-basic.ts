// Translations small enough for browser code: property types, structures, zoning, status and
// ward names. Station, line and street names (large dictionaries) stay in translate-fields.ts.
import { isChineseLocale, toChineseScript } from './zh-script'

/**
 * DB上の日本語フィールド値を言語に応じて翻訳するマッピング
 */

const propertyTypeMap: Record<string, Record<string, string>> = {
  '区分マンション': { en: 'Condominium', 'zh-TW': '公寓', 'zh-CN': '公寓' },
  '一棟マンション': { en: 'Whole apartment building', 'zh-TW': '整棟公寓大樓', 'zh-CN': '整栋公寓楼' },
  '一棟アパート': { en: 'Small apartment building (apāto)', 'zh-TW': '整棟小型出租公寓', 'zh-CN': '整栋小型出租公寓' },
  '一棟ビル': { en: 'Whole commercial building', 'zh-TW': '整棟商業大樓', 'zh-CN': '整栋商业大楼' },
  '戸建': { en: 'House', 'zh-TW': '獨棟住宅', 'zh-CN': '独栋住宅' },
  '土地': { en: 'Land', 'zh-TW': '土地', 'zh-CN': '土地' },
  '店舗・事務所': { en: 'Commercial / Office', 'zh-TW': '商業/辦公', 'zh-CN': '商业/办公' },
  'その他': { en: 'Other', 'zh-TW': '其他', 'zh-CN': '其他' },
}

const structureMap: Record<string, Record<string, string>> = {
  'RC': { en: 'Reinforced Concrete (RC)', 'zh-TW': '鋼筋混凝土 (RC)', 'zh-CN': '钢筋混凝土 (RC)' },
  'SRC': { en: 'Steel Reinforced Concrete (SRC)', 'zh-TW': '鋼骨鋼筋混凝土 (SRC)', 'zh-CN': '钢骨钢筋混凝土 (SRC)' },
  'S': { en: 'Steel Frame (S)', 'zh-TW': '鋼骨結構 (S)', 'zh-CN': '钢骨结构 (S)' },
  'S造': { en: 'Steel Frame', 'zh-TW': '鋼骨結構', 'zh-CN': '钢骨结构' },
  '鉄骨造': { en: 'Steel Frame', 'zh-TW': '鋼骨結構', 'zh-CN': '钢骨结构' },
  '木造': { en: 'Wooden', 'zh-TW': '木造', 'zh-CN': '木造' },
  '軽量鉄骨': { en: 'Light Steel Frame', 'zh-TW': '輕鋼結構', 'zh-CN': '轻钢结构' },
  '鉄筋コンクリート造': { en: 'Reinforced Concrete (RC)', 'zh-TW': '鋼筋混凝土 (RC)', 'zh-CN': '钢筋混凝土 (RC)' },
  '鉄骨鉄筋コンクリート造': { en: 'Steel Reinforced Concrete (SRC)', 'zh-TW': '鋼骨鋼筋混凝土 (SRC)', 'zh-CN': '钢骨钢筋混凝土 (SRC)' },
}

const zoningMap: Record<string, Record<string, string>> = {
  '第1種低層住居専用地域': { en: 'Category I Exclusively Low-rise Residential', 'zh-TW': '第一種低層住居專用地域', 'zh-CN': '第一种低层住居专用地域' },
  '第2種低層住居専用地域': { en: 'Category II Exclusively Low-rise Residential', 'zh-TW': '第二種低層住居專用地域', 'zh-CN': '第二种低层住居专用地域' },
  '第1種中高層住居専用地域': { en: 'Category I Mid/High-rise Residential', 'zh-TW': '第一種中高層住居專用地域', 'zh-CN': '第一种中高层住居专用地域' },
  '第2種中高層住居専用地域': { en: 'Category II Mid/High-rise Residential', 'zh-TW': '第二種中高層住居專用地域', 'zh-CN': '第二种中高层住居专用地域' },
  '第1種住居地域': { en: 'Category I Residential', 'zh-TW': '第一種住居地域', 'zh-CN': '第一种住居地域' },
  '第2種住居地域': { en: 'Category II Residential', 'zh-TW': '第二種住居地域', 'zh-CN': '第二种住居地域' },
  '準住居地域': { en: 'Quasi-Residential', 'zh-TW': '準住居地域', 'zh-CN': '准住居地域' },
  '近隣商業地域': { en: 'Neighborhood Commercial', 'zh-TW': '近鄰商業地域', 'zh-CN': '近邻商业地域' },
  '商業地域': { en: 'Commercial', 'zh-TW': '商業地域', 'zh-CN': '商业地域' },
  '準工業地域': { en: 'Quasi-Industrial', 'zh-TW': '準工業地域', 'zh-CN': '准工业地域' },
  '工業地域': { en: 'Industrial', 'zh-TW': '工業地域', 'zh-CN': '工业地域' },
  '田園住居地域': { en: 'Rural Residential', 'zh-TW': '田園住居地域', 'zh-CN': '田园住居地域' },
  '工業専用地域': { en: 'Exclusively Industrial', 'zh-TW': '工業專用地域', 'zh-CN': '工业专用地域' },
}

const currentStatusMap: Record<string, Record<string, string>> = {
  '空家': { en: 'Vacant', 'zh-TW': '空屋', 'zh-CN': '空房' },
  '空室': { en: 'Vacant', 'zh-TW': '空屋', 'zh-CN': '空房' },
  '賃貸中': { en: 'Tenanted', 'zh-TW': '出租中', 'zh-CN': '出租中' },
  '居住中': { en: 'Owner Occupied', 'zh-TW': '自住中', 'zh-CN': '自住中' },
  '使用中': { en: 'In Use', 'zh-TW': '使用中', 'zh-CN': '使用中' },
}

function lookupTranslation(
  value: string | null | undefined,
  map: Record<string, Record<string, string>>,
  locale: string
): string | null {
  if (!value) return null
  if (locale === 'ja') return value

  // 完全一致
  if (map[value]?.[locale]) return map[value][locale]

  // Longer names must win, for example SRC造 over RC and 鉄骨鉄筋コンクリート造 over 鉄筋コンクリート造.
  for (const [key, translations] of Object.entries(map).sort(([a], [b]) => b.length - a.length)) {
    if (value.includes(key)) {
      return translations[locale] || value
    }
  }

  return value
}

export function translatePropertyType(value: string | null, locale: string): string | null {
  return lookupTranslation(value, propertyTypeMap, locale)
}

export function translateStructure(value: string | null, locale: string): string | null {
  return lookupTranslation(value, structureMap, locale)
}

export function translateZoning(value: string | null, locale: string): string | null {
  // Listings write 第一種 as often as 第1種; the map uses Arabic numerals.
  const normalized = value?.replace(/第一種/g, '第1種').replace(/第二種/g, '第2種') ?? null
  return lookupTranslation(normalized, zoningMap, locale) ?? value
}

export function translateCurrentStatus(value: string | null, locale: string): string | null {
  return lookupTranslation(value, currentStatusMap, locale)
}

// 区市町村マッピング（主要なもの）
export const cityMap: Record<string, string> = {
  '新宿区': 'Shinjuku',
  '渋谷区': 'Shibuya',
  '港区': 'Minato',
  '中央区': 'Chuo',
  '千代田区': 'Chiyoda',
  '品川区': 'Shinagawa',
  '目黒区': 'Meguro',
  '大田区': 'Ota',
  '世田谷区': 'Setagaya',
  '杉並区': 'Suginami',
  '中野区': 'Nakano',
  '練馬区': 'Nerima',
  '板橋区': 'Itabashi',
  '豊島区': 'Toshima',
  '北区': 'Kita',
  '荒川区': 'Arakawa',
  '台東区': 'Taito',
  '墨田区': 'Sumida',
  '江東区': 'Koto',
  '江戸川区': 'Edogawa',
  '足立区': 'Adachi',
  '葛飾区': 'Katsushika',
  '文京区': 'Bunkyo',
  '八王子市': 'Hachioji',
  '立川市': 'Tachikawa',
  '武蔵野市': 'Musashino',
  '三鷹市': 'Mitaka',
  '町田市': 'Machida',
  '府中市': 'Fuchu',
  '調布市': 'Chofu',
  '西東京市': 'Nishi-Tokyo',
  '横浜市': 'Yokohama',
  '川崎市': 'Kawasaki',
  'さいたま市': 'Saitama City',
  '千葉市': 'Chiba City',
}

export function translateCityName(city: string | null | undefined, locale: string): string | null {
  if (!city || locale === 'ja') return city || null
  if (isChineseLocale(locale)) return toChineseScript(city, locale)
  return cityMap[city] || city
}
