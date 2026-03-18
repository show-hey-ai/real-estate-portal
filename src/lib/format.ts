export function formatPrice(price: bigint | number, locale: string = 'ja'): string {
  const num = typeof price === 'bigint' ? Number(price) : price

  if (locale === 'en') {
    if (num >= 1_000_000_000) {
      const b = num / 1_000_000_000
      return `¥${b.toFixed(b % 1 === 0 ? 0 : 1)}B`
    }
    if (num >= 1_000_000) {
      const m = num / 1_000_000
      return `¥${m.toFixed(m % 1 === 0 ? 0 : 1)}M`
    }
    return `¥${num.toLocaleString('en')}`
  }

  // ja, zh-TW, zh-CN all use 億/万
  if (num >= 100000000) {
    const oku = num / 100000000
    return `¥${oku.toFixed(oku % 1 === 0 ? 0 : 1)}億`
  }

  if (num >= 10000) {
    const man = num / 10000
    return `¥${man.toLocaleString()}万`
  }

  return `¥${num.toLocaleString()}`
}

export function formatArea(area: number | null): string {
  if (!area) return '-'
  return `${area.toFixed(2)}㎡`
}

export function formatYear(year: number | null, locale: string = 'ja'): string {
  if (!year) return '-'
  const age = new Date().getFullYear() - year
  if (locale === 'en') {
    return `${year} (${age} yrs old)`
  }
  return `${year}年（築${age}年）`
}

export function formatDistanceToNow(date: Date, locale: string = 'ja'): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (locale === 'en') {
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    if (diffMinutes > 0) return `${diffMinutes}m ago`
    return 'Just now'
  }
  if (locale === 'zh-TW') {
    if (diffDays > 0) return `${diffDays}天前`
    if (diffHours > 0) return `${diffHours}小時前`
    if (diffMinutes > 0) return `${diffMinutes}分鐘前`
    return '剛剛'
  }
  if (locale === 'zh-CN') {
    if (diffDays > 0) return `${diffDays}天前`
    if (diffHours > 0) return `${diffHours}小时前`
    if (diffMinutes > 0) return `${diffMinutes}分钟前`
    return '刚刚'
  }
  // ja
  if (diffDays > 0) return `${diffDays}日前`
  if (diffHours > 0) return `${diffHours}時間前`
  if (diffMinutes > 0) return `${diffMinutes}分前`
  return 'たった今'
}

export function formatPriceLabel(value: number, locale: string = 'ja'): string {
  if (locale === 'en') {
    if (value >= 1_000_000_000) return `¥${(value / 1_000_000_000)}B`
    if (value >= 1_000_000) return `¥${(value / 1_000_000)}M`
    return `¥${value.toLocaleString('en')}`
  }
  if (value >= 100_000_000) return `¥${(value / 100_000_000)}億`
  if (value >= 10_000) return `¥${(value / 10_000).toLocaleString()}万`
  return `¥${value.toLocaleString()}`
}
