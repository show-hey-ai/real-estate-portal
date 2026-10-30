/**
 * Mails the owner from an operator run (uses the existing SMTP settings in runtime.env; no database).
 *
 * Usage:
 *   npx tsx scripts/notify-operator.ts --subject "件名" --text "本文"
 *   npx tsx scripts/notify-operator.ts --subject "件名" --file <本文ファイル> [--dry-run]
 *
 * Use it only for: completed new publications, serious failures, or when the owner must act.
 * Quiet runs (nothing changed) must not mail.
 */
import { readFile } from 'node:fs/promises'
import { sendOperatorMailDirect } from '../src/lib/autonomy/operator-mail'

const ARGS = process.argv.slice(2)
function argValue(name: string) {
  const index = ARGS.indexOf(name)
  return index !== -1 ? ARGS[index + 1] : undefined
}

async function main() {
  const subject = argValue('--subject')
  const file = argValue('--file')
  const text = file ? await readFile(file, 'utf8') : argValue('--text')
  if (!subject || !text) {
    console.error('Usage: npx tsx scripts/notify-operator.ts --subject <件名> (--text <本文> | --file <path>) [--dry-run]')
    process.exitCode = 1
    return
  }
  const body = `${text.trim()}\n\n— Ziyou portal Claude operator (${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })} JST)`
  if (ARGS.includes('--dry-run')) {
    console.log(`[dry-run] ${subject}\n${body}`)
    return
  }
  const result = await sendOperatorMailDirect(`[Ziyou portal] ${subject}`, body)
  console.log(JSON.stringify(result))
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
