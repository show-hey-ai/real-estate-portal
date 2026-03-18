/**
 * 住所を丁目までに整形し、番地パターンを検出する
 */

// 番地パターン（公開NGとなるパターン）
const BANCHI_PATTERNS = [
  /\d+番地?(\d+号?)?/,        // 1番地、1番2号
  /\d+-\d+(-\d+)?/,           // 1-2-3
  /\d+丁目\d+/,               // 1丁目2（丁目の後に番地）
  /[一二三四五六七八九十]+番地?/, // 漢数字番地
]

// 丁目までのパターン
const CHOME_PATTERN = /^(.+?[都道府県].+?[市区町村].+?(?:\d+丁目|[一二三四五六七八九十]+丁目))/

// 町名までのパターン（丁目がない場合）
const TOWN_PATTERN = /^(.+?[都道府県].+?[市区町村].+?[町村丁])/

export interface AddressResult {
  publicAddress: string | null  // 公開用住所（丁目まで）
  isBlocked: boolean            // 番地が検出されたか
  hasFullAddress: boolean       // 完全な住所があるか
}

/**
 * 住所を公開用に整形する
 * @param fullAddress 完全な住所
 * @returns 整形結果
 */
export function formatPublicAddress(fullAddress: string | null | undefined): AddressResult {
  if (!fullAddress || fullAddress.trim() === '') {
    return {
      publicAddress: null,
      isBlocked: false,
      hasFullAddress: false,
    }
  }

  const address = fullAddress.trim()

  // 番地パターンが含まれているかチェック
  const hasBanchi = BANCHI_PATTERNS.some(pattern => pattern.test(address))

  // 丁目までを抽出
  let publicAddress: string | null = null

  const chomeMatch = address.match(CHOME_PATTERN)
  if (chomeMatch) {
    publicAddress = chomeMatch[1]
  } else {
    // 丁目がない場合は町名まで
    const townMatch = address.match(TOWN_PATTERN)
    if (townMatch) {
      publicAddress = townMatch[1]
    }
  }

  // 公開住所にも番地パターンが含まれていないか確認
  if (publicAddress && BANCHI_PATTERNS.some(pattern => pattern.test(publicAddress!))) {
    // 番地パターンを削除
    publicAddress = publicAddress.replace(/\d+-\d+.*$/, '').replace(/\d+番.*$/, '').trim()
  }

  return {
    publicAddress: publicAddress || null,
    isBlocked: hasBanchi,
    hasFullAddress: true,
  }
}

/**
 * 住所から都道府県を抽出
 */
export function extractPrefecture(address: string | null | undefined): string | null {
  if (!address) return null

  const prefectureMatch = address.match(/(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/)
  return prefectureMatch ? prefectureMatch[1] : null
}

/**
 * 住所から市区町村を抽出
 */
export function extractCity(address: string | null | undefined): string | null {
  if (!address) return null

  // 都道府県を除いた部分から市区町村を抽出
  const withoutPref = address.replace(/(東京都|北海道|(?:京都|大阪)府|.{2,3}県)/, '')
  const cityMatch = withoutPref.match(/^(.+?[市区町村])/)
  return cityMatch ? cityMatch[1] : null
}

/**
 * 築年月文字列をパース
 * @param builtStr "2020年3月"、"令和2年"、"平成15年12月" など
 */
export function parseBuiltDate(builtStr: string | null | undefined): { year: number | null; month: number | null } {
  if (!builtStr) return { year: null, month: null }

  let year: number | null = null
  let month: number | null = null

  // 西暦パターン
  const westernMatch = builtStr.match(/(\d{4})年/)
  if (westernMatch) {
    year = parseInt(westernMatch[1], 10)
  }

  // 和暦パターン
  if (!year) {
    const eraPatterns = [
      { pattern: /令和(\d+)年/, baseYear: 2018 },
      { pattern: /平成(\d+)年/, baseYear: 1988 },
      { pattern: /昭和(\d+)年/, baseYear: 1925 },
    ]

    for (const { pattern, baseYear } of eraPatterns) {
      const match = builtStr.match(pattern)
      if (match) {
        year = baseYear + parseInt(match[1], 10)
        break
      }
    }
  }

  // 月パターン
  const monthMatch = builtStr.match(/(\d{1,2})月/)
  if (monthMatch) {
    const m = parseInt(monthMatch[1], 10)
    if (m >= 1 && m <= 12) {
      month = m
    }
  }

  return { year, month }
}

/**
 * 築年月をフォーマット
 */
export function formatBuiltDate(year: number | null | undefined, month: number | null | undefined): string {
  if (!year) return '-'
  if (!month) return `${year}年`
  return `${year}年${month}月`
}
