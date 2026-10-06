import { helpArticles, helpLocale } from '../content/help'

export const HELP_QUERY_LIMIT = 600
const normalize = (value: string) =>
  value.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/gu, ' ').trim()

function matches(query: string, keyword: string) {
  if (/^[a-z ]+$/u.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')
    const plural = keyword.length > 2 ? '(?:s|es)?' : ''
    return new RegExp(`(?:^|[^a-z])${escaped}${plural}(?:$|[^a-z])`, 'u').test(
      query
    )
  }
  return query.includes(keyword)
}

/** Bounded retrieval over an explicit public corpus; never queries listing data. */
export function searchHelp(input: string, locale: string) {
  if (typeof input !== 'string' || input.length > HELP_QUERY_LIMIT) return []
  const query = normalize(input)
  if (!query) return []
  const language = helpLocale(locale)
  return helpArticles
    .map((article) => {
      const terms = [...new Set(article.keywords.map(normalize))]
      const weights = terms
        .filter((term) => matches(query, term))
        .map((term) => Math.min(12, term.length))
      const score =
        weights.reduce((total, weight) => total + weight, 0) +
        Math.max(0, ...weights) * 4
      return {
        id: article.id,
        href: article.href,
        ...article.text[language],
        score,
      }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
}
