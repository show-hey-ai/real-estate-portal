import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'
import { day, variantSchema } from './buyer-funnel-policy'

export const funnelCookie='ziyou_funnel'
export const tokenSchema=z.object({ id:z.string().uuid(), experiment:z.string().uuid(), variant:variantSchema, hash:z.string().regex(/^[a-f0-9]{64}$/), issued:z.number().int().positive() }).strict()
export type FunnelToken=z.infer<typeof tokenSchema>
function signature(payload:string,secret:string) { return createHmac('sha256',secret).update('ziyou-funnel-v1:'+payload).digest('base64url') }
export function signToken(token:FunnelToken, secret:string) { if(secret.length<32) throw new Error('Missing funnel signing secret'); const payload=Buffer.from(JSON.stringify(tokenSchema.parse(token))).toString('base64url'); return payload+'.'+signature(payload,secret) }
export function readToken(raw:string|undefined,secret:string,now=Date.now()):FunnelToken|null {
  if(!raw || raw.length>1200 || secret.length<32) return null
  try {
    const [payload,sig,...extra]=raw.split('.'), expected=signature(payload,secret)
    if(extra.length || !sig || sig.length!==expected.length || !timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null
    const t=tokenSchema.parse(JSON.parse(Buffer.from(payload,'base64url').toString()))
    return t.issued<=now && t.issued>=now-30*day ? t : null
  } catch { return null }
}
export function excludedVisitor(headers:Headers) {
  return headers.get('dnt')==='1' || headers.get('sec-gpc')==='1' || /bot|crawler|spider|headless|playwright|autonomy-health|vercel-screenshot/i.test(headers.get('user-agent')||'')
}
