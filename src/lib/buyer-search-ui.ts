export function buyerSearchReturnPath(initialPurpose: string): string {
  return ['investment', 'residential', 'land'].includes(initialPurpose)
    ? `/match?purpose=${initialPurpose}`
    : '/match'
}

/** A refreshed feed can withdraw properties; withdrawn IDs must not occupy comparison slots. */
export function currentComparisonIds(selected: string[], available: string[]): string[] {
  const current = new Set(available)
  return [...new Set(selected)].filter(id => current.has(id)).slice(0, 3)
}

export function toggleComparison(selected: string[], available: string[], id: string, checked: boolean): string[] {
  const current = currentComparisonIds(selected, available)
  if (!checked) return current.filter(value => value !== id)
  return available.includes(id) ? [...new Set([...current, id])].slice(0, 3) : current
}
