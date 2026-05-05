const INTERNAL_WARNING_PATTERNS = [
  /広告.*(掲載|転載|可否|承諾|許可|申請|有効期限|厳禁|不可|可能|要連絡|要確認|確認)/u,
  /承諾(確認|必要)/u,
  /(REINS|レインズ)/iu,
  /(SUUMO|楽待|健美家|SNS|ポータル)/iu,
  /(自社HP|自社ホームページ|御社HP|自社媒体|ネット広告)/u,
]

function normalizeWarningText(warning: string) {
  return warning.replace(/\s+/g, '')
}

export function isInternalListingWarning(warning: string | null | undefined): boolean {
  if (!warning) return false

  const normalized = normalizeWarningText(warning)
  return INTERNAL_WARNING_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function sanitizeListingWarnings(
  warnings: string[] | null | undefined
): string[] {
  if (!Array.isArray(warnings)) {
    return []
  }

  const seen = new Set<string>()

  return warnings
    .map((warning) => warning.trim())
    .filter((warning) => warning.length > 0)
    .filter((warning) => !isInternalListingWarning(warning))
    .filter((warning) => {
      const key = normalizeWarningText(warning)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}
