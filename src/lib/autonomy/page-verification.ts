const blocksIndexing = (value: string) => /\b(?:noindex|none)\b/i.test(value)

export function isPageIndexable(body: string, robotsHeader: string | null) {
  if (robotsHeader && blocksIndexing(robotsHeader)) return false
  for (const tag of body.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = new Map([...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)]
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4]]))
    if (/^(?:robots|googlebot|bingbot)$/i.test(attributes.get('name') ?? '') && blocksIndexing(attributes.get('content') ?? '')) return false
  }
  return true
}
