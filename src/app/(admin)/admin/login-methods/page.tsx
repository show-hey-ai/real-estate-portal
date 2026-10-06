import { getLocale } from 'next-intl/server'
import { getLoginMethods } from '@/lib/login-methods-server'
import { getLoginMethodsCopy } from '@/lib/login-methods-copy'
import { socialMethods } from '@/lib/login-methods'

export default async function LoginMethodsPage() {
  const copy = getLoginMethodsCopy(await getLocale())
  const methods = await getLoginMethods()
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const project = base ? new URL(base).hostname.split('.')[0] : null
  const consoleUrl = project && /^[a-z0-9]+$/.test(project) ? `https://supabase.com/dashboard/project/${project}/auth/providers` : 'https://supabase.com/dashboard'
  return <div className="space-y-6" data-testid="admin-login-methods">
    <div><h1 className="text-2xl font-bold">{copy.adminTitle}</h1><p className="mt-2 font-medium">{copy.selected}</p><p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{copy.operatorNote}</p></div>
    <a href={consoleUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">{copy.console}</a>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {socialMethods.map(method => <section key={method.id} className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">{method.name}</h2>
        <p className={`mt-2 text-sm ${methods.providers.includes(method.id) ? 'text-primary' : 'text-muted-foreground'}`}>{methods.providers.includes(method.id) ? copy.active : copy.required}</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{copy.requirements[method.id]}</p>
        <a href={method.guide} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline">{copy.setup}</a>
      </section>)}
      <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{copy.wechat}</h2><p className="mt-2 text-sm text-muted-foreground">{copy.wechatPending}</p><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{copy.wechatNote}</p><a href="https://open.weixin.qq.com/" target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center text-sm text-primary underline">{copy.setup}</a></section>
    </div>
    {base && <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{copy.callback}</h2><p className="mt-2 break-all rounded-md bg-muted p-3 font-mono text-sm">{base}/auth/v1/callback</p><p className="mt-3 text-sm text-muted-foreground">{copy.callbackNote}</p></section>}
    <section className="rounded-xl border bg-card p-5"><h2 className="font-semibold">{copy.emailLink}</h2><p className="mt-2 text-sm text-muted-foreground">{methods.emailLink ? copy.active : copy.required}</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.emailNote}</p></section>
  </div>
}
