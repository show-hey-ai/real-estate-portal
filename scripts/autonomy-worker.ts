import { resolve } from 'node:path'
import { config } from 'dotenv'

config({ path: resolve(process.cwd(), '.env') })

async function main() {
  // Load the database only after the environment is configured.
  const { runAutonomyTick } = await import('../src/lib/autonomy/runner')
  const { prisma } = await import('../src/lib/db')
  const { reinsIntake, maisokuImport } = await import('../src/lib/autonomy/intake')
  const once = process.argv.includes('--once')
  let stopped = false
  process.on('SIGTERM', () => { stopped = true })
  process.on('SIGINT', () => { stopped = true })
  try {
    do {
      try { console.log(JSON.stringify(await runAutonomyTick(5, { reins_intake: reinsIntake, maisoku_import: maisokuImport }))) }
      catch { console.error('Autonomy runtime unavailable; the durable queue is retained.') }
      if (!once && !stopped) await new Promise((resolveWait) => setTimeout(resolveWait, 30_000))
    } while (!once && !stopped)
  } finally { await prisma.$disconnect() }
}

main().catch(() => { process.exitCode = 1 })
