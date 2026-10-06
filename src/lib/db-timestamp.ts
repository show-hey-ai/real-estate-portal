// Supabase REST returns Prisma `timestamp` columns without a zone; they are stored in UTC.
const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i

export function parseDbTimestamp(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(HAS_ZONE.test(value) || !value.includes('T') ? value : `${value}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}
