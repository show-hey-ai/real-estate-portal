const PAGE_PATH = /^\/[A-Za-z0-9/_-]{0,200}$/

/** Where a contact click is recorded: the listing, else the page it came from (guides, ward pages). */
export function contactClickPath({ listingId, path }: { listingId?: string; path?: string }): string {
  if (listingId) return `/listings/${listingId}`
  return path && PAGE_PATH.test(path) ? path : '/match'
}
