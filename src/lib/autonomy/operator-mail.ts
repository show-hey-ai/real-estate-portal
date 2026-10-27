import { readFile } from 'node:fs/promises'
import nodemailer from 'nodemailer'
import { normalizeAppPassword, readNotificationConfig } from './notification-policy'

export async function withPasswordFile(env: Record<string, string | undefined>): Promise<Record<string, string | undefined>> {
  if (env.SMTP_PASS || !env.SMTP_PASS_FILE) return env
  try {
    return { ...env, SMTP_PASS: normalizeAppPassword(await readFile(env.SMTP_PASS_FILE, 'utf8')) || undefined }
  } catch {
    return env
  }
}

/** Mails the owner without touching the database, for alerts about the database or the site itself. */
export async function sendOperatorMailDirect(subject: string, text: string, env: Record<string, string | undefined> = process.env) {
  const config = readNotificationConfig(await withPasswordFile(env))
  if (!config) return { state: 'not_configured' as const }
  const transport = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.port === 465, auth: { user: config.user, pass: config.pass } })
  await transport.sendMail({ from: config.from, to: config.to, subject, text })
  return { state: 'sent' as const }
}
