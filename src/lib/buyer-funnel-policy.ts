import { z } from 'zod'

export const funnelVersion = 'buyer-funnel-v1'
export const day = 86_400_000
export const variantSchema = z.enum(['original', 'criteria', 'question'])
export type FunnelVariant = z.infer<typeof variantSchema>
export const stateSchema = z.object({
  revision: z.number().int().nonnegative(), enabled: z.boolean(), manual: variantSchema.nullable(),
  id: z.string().uuid(), hash: z.string().regex(/^[a-f0-9]{64}$/),
  incumbent: variantSchema, challenger: variantSchema.nullable(), remaining: z.array(variantSchema).max(2),
  startedAt: z.string().datetime(), closedAt: z.string().datetime().nullable(),
}).strict()
export type FunnelState = z.infer<typeof stateSchema>
export type FunnelEvent = { assignment: string; variant: FunnelVariant; event: string; at: number; surface: string; campaign: string }
export type ArmMetrics = { visitors: number; clicks: number; submissions: number; registrations: number; consultations: number }
export function summarize(events: FunnelEvent[], now: number, mature = false) {
  const result: Record<FunnelVariant, ArmMetrics> = Object.fromEntries(['original','criteria','question'].map(v => [v, { visitors:0, clicks:0, submissions:0, registrations:0, consultations:0 }])) as Record<FunnelVariant, ArmMetrics>
  const exposures = new Map<string, FunnelEvent>()
  for (const e of events) if (e.event === 'exposure' && (!exposures.has(e.assignment) || exposures.get(e.assignment)!.at > e.at)) exposures.set(e.assignment,e)
  const byAssignment = new Map<string, FunnelEvent[]>()
  for (const e of events) { const list=byAssignment.get(e.assignment)||[]; list.push(e); byAssignment.set(e.assignment,list) }
  for (const exposure of exposures.values()) {
    if (exposure.at > now || (mature && exposure.at > now-day)) continue
    const arm = result[exposure.variant]
    arm.visitors++
    const outcomes = new Set((byAssignment.get(exposure.assignment)||[]).filter(e => e.variant===exposure.variant && e.at>=exposure.at && e.at<=Math.min(now,exposure.at+day)).map(e=>e.event))
    arm.clicks += Number(outcomes.has('click'))
    arm.submissions += Number(outcomes.has('submit'))
    arm.registrations += Number(outcomes.has('registration'))
    arm.consultations += Number(outcomes.has('consultation'))
  }
  return result
}
// One fixed-cohort decision, after every participant's 24-hour outcome window.
// Conservative 99% Wilson intervals; neither clicks nor unconfirmed signups select a winner.
export function interval(successes: number, total: number): [number, number] {
  if (!total) return [0,1]
  const z=2.576, p=successes/total, d=1+z*z/total
  const middle=(p+z*z/(2*total))/d, radius=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d
  return [middle-radius,middle+radius]
}
export function decide(a: ArmMetrics, b: ArmMetrics): 'incumbent'|'challenger'|'inconclusive' {
  if (a.visitors<200 || b.visitors<200 || a.consultations+b.consultations<10) return 'inconclusive'
  const ai=interval(a.consultations,a.visitors), bi=interval(b.consultations,b.visitors)
  if (bi[0]>ai[1] && b.consultations/b.visitors-a.consultations/a.visitors>=0.01) return 'challenger'
  if (ai[0]>bi[1] && a.consultations/a.visitors-b.consultations/b.visitors>=0.01) return 'incumbent'
  return 'inconclusive'
}

export function campaignSummary(events:FunnelEvent[],now:number) {
  const first=new Map<string,FunnelEvent>()
  for(const e of events) if(e.event==='exposure'&&(!first.has(e.assignment)||first.get(e.assignment)!.at>e.at))first.set(e.assignment,e)
  return [...new Set([...first.values()].map(e=>e.campaign))].slice(0,30).map(campaign=>{
    const ids=new Set([...first.values()].filter(e=>e.campaign===campaign).map(e=>e.assignment))
    return {campaign:campaign||'直接・未指定',metrics:summarize(events.filter(e=>ids.has(e.assignment)),now)}
  })
}
