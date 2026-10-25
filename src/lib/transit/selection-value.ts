// Kept free of the station data so client code (saved searches, the search bar) can check values.
export const MAX_SELECTED = 40
const SELECTION_VALUE = new RegExp(`^[a-z0-9-]+(?:,[a-z0-9-]+){0,${MAX_SELECTED - 1}}$`, 'u')

/** A `stations` or `lines` search value: comma-separated slugs or line ids. */
export function isSelectionValue(value: string): boolean {
  return value.length <= 800 && SELECTION_VALUE.test(value)
}
