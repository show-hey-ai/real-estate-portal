/** Fills a "{done} of {total}" style template; templates stay plain strings so client components can receive them. */
export function formatProgress(template: string, done: number, total: number): string {
  return template.replace('{done}', String(done)).replace('{total}', String(total))
}
