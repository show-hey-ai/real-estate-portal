// The funnel's page variants, without the validation library, so browser code can check them.
export const FUNNEL_VARIANTS = ['original', 'criteria', 'question'] as const
export type FunnelVariant = (typeof FUNNEL_VARIANTS)[number]

export function isFunnelVariant(value: unknown): value is FunnelVariant {
  return typeof value === 'string' && (FUNNEL_VARIANTS as readonly string[]).includes(value)
}
