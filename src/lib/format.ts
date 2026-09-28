export function formatPrice(price: bigint | number, locale: string = 'ja'): string {
  const num = typeof price === 'bigint' ? Number(price) : price

  if (locale === 'en') {
    if (num >= 1_000_000_000) {
      if (num % 1_000_000 === 0) {
        return `¥${(num / 1_000_000_000).toLocaleString('en', { maximumFractionDigits: 3 })}B`
      }
      return `¥${num.toLocaleString('en')}`
    }
    if (num >= 1_000_000) {
      if (num % 1_000 === 0) {
        return `¥${(num / 1_000_000).toLocaleString('en', { maximumFractionDigits: 3 })}M`
      }
      return `¥${num.toLocaleString('en')}`
    }
    return `¥${num.toLocaleString('en')}`
  }

  // ja, zh-TW, zh-CN all use 億/万 without rounding the advertised price.
  if (num >= 100000000) {
    const oku = Math.floor(num / 100000000)
    const remainder = num % 100000000
    const man = Math.floor(remainder / 10000)
    const yen = remainder % 10000
    return `¥${oku}億${man ? `${man.toLocaleString()}万` : ''}${yen ? `${yen.toLocaleString()}円` : ''}`
  }

  if (num >= 10000) {
    const man = Math.floor(num / 10000)
    const yen = num % 10000
    return `¥${man.toLocaleString()}万${yen ? `${yen.toLocaleString()}円` : ''}`
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
