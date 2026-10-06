import { z } from 'zod'

export const PORTAL_VENTURE_ID = 'ziyou-portal'
export const AUTONOMY_VERSION = 'portal-loop-v1'
export const jobKinds = ['observe', 'health', 'strategy', 'publication_audit', 'verify_publication', 'rollback_publication', 'reins_intake', 'maisoku_import', 'generate_article', 'seo', 'verify_article', 'rollback_article'] as const
export type JobKind = typeof jobKinds[number]

export const policySchema = z.object({
  enabled: z.boolean(),
  objective: z.string().trim().min(10).max(500),
  intervalMinutes: z.number().int().min(15).max(1440),
  monthlyBudgetYen: z.number().int().min(0).max(1_000_000),
  aiCallReserveYen: z.number().int().min(1).max(10_000),
  allowAiStrategy: z.boolean(),
  allowPublication: z.boolean(),
  allowArchive: z.boolean(),
  allowReinsIntake: z.boolean(),
  allowArticles: z.boolean(),
  allowSeo: z.boolean(),
  reinsIntervalHours: z.number().int().min(1).max(168),
  reinsBatchReserveYen: z.number().int().min(100).max(10_000),
  maxAttempts: z.number().int().min(1).max(5),
}).strict()
export type AutonomyPolicy = z.infer<typeof policySchema>

export const defaultPolicy: AutonomyPolicy = {
  enabled: false,
  objective: 'Increase qualified Tokyo property purchase inquiries while maintaining accurate, permitted listings and reducing routine human work.',
  intervalMinutes: 60,
  monthlyBudgetYen: 0,
  aiCallReserveYen: 100,
  allowAiStrategy: false,
  allowPublication: false,
  allowArchive: false,
  allowReinsIntake: false,
  allowArticles: false,
  allowSeo: false,
  reinsIntervalHours: 24,
  reinsBatchReserveYen: 1000,
  maxAttempts: 3,
}

export function tokyoMonthStart(now: Date): Date {
  const tokyo = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return new Date(Date.UTC(tokyo.getUTCFullYear(), tokyo.getUTCMonth(), 1) - 9 * 60 * 60 * 1000)
}

export function scheduleKey(kind: JobKind, now: Date, intervalMinutes: number): string {
  return `${kind}:${Math.floor(now.getTime() / (intervalMinutes * 60_000))}`
}

export function retryTime(now: Date, attempt: number): Date {
  return new Date(now.getTime() + Math.min(3600, 60 * 2 ** Math.max(0, attempt - 1)) * 1000)
}

export function budgetAllows(budget: number, committed: number, reservation: number): boolean {
  return [budget, committed, reservation].every((value) => Number.isSafeInteger(value) && value >= 0) && committed + reservation <= budget
}

export function blockedReason(kind: JobKind, policy: AutonomyPolicy, hasAiKey: boolean): string | null {
  if (!policy.enabled) return 'Loop is paused.'
  if (kind === 'strategy' && policy.allowAiStrategy && !hasAiKey) return 'OpenAI connection is not configured.'
  if (kind === 'publication_audit' && !policy.allowPublication) return 'Automatic publication is not enabled in the operating policy.'
  return null
}
