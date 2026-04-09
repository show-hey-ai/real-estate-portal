import dns from 'node:dns'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

// Supabase free tier resolves to IPv6 only (no IPv4 A record).
// Node.js defaults to preferring IPv4 which causes ENODATA → P1001.
// 'verbatim' returns addresses in resolver order so IPv6 AAAA records are used.
dns.setDefaultResultOrder('verbatim')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
