/**
 * Listing descriptions are written during intake and name where each fact came from
 * ("最新REINS", "原資料"). REINS is the agents-only listing network and means nothing to buyers,
 * so public pages show the same facts with plain source names. The stored text is left as is.
 */

type Rewrite = [RegExp, string]

const JA_REWRITES: Rewrite[] = [
  [/(?:最新|現行)?REINS/g, '最新の物件情報'],
  [/原(?:現)?資料提供/g, '販売図面からの転載'],
  [/原(?:現)?資料|原図面/g, '販売図面'],
]

const ZH_TW_REWRITES: Rewrite[] = [[/(?:最新|現行)?REINS/g, '最新物件資訊']]
const ZH_CN_REWRITES: Rewrite[] = [[/(?:最新|现行|現行)?REINS/g, '最新物件信息']]

// Sentences that only record our own cross-checks between sources.
const JA_INTERNAL_SENTENCE = /[^。]*整合し[^。]*。/g

function rewriteEnglish(text: string): string {
  return text.replace(/\b(?:the )?(?:current |latest )?REINS\b/gi, (_match, offset: number) => {
    const startsSentence = /(?:^|[.!?])\s*$/.test(text.slice(0, offset))
    return `${startsSentence ? 'The' : 'the'} latest listing information`
  })
}

export function toPublicDescription(text: string | null | undefined, locale: string): string | null {
  if (!text) return null
  switch (locale) {
    case 'en':
      return rewriteEnglish(text)
    case 'zh-TW':
      return ZH_TW_REWRITES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text)
    case 'zh-CN':
      return ZH_CN_REWRITES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text)
    default:
      return JA_REWRITES.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), text.replace(JA_INTERNAL_SENTENCE, ''))
  }
}
