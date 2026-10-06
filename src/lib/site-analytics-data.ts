import { prisma } from './db'

export async function getExternalAnalyticsWhere() {
  const excluded = await prisma.$queryRaw<{ visitorId: string }[]>`SELECT "visitorId" FROM site_analytics_exclusions`
  return {
    visitorId: { notIn: excluded.map(row => row.visitorId) },
    OR: [{ referrerHost: null }, { NOT: { referrerHost: { in: ['localhost', '127.0.0.1', '::1', '[::1]'] } } }],
  }
}
