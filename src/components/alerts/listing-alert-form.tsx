'use client'

import { useId, useState } from 'react'
import { useLocale } from 'next-intl'
import { BellRing, CheckCircle2, Loader2 } from 'lucide-react'
import type { BudgetSlug, TypeSlug } from '@/lib/collections'

const copy = {
  ja: { title: '新着物件をメールで受け取る', subtitle: (scope: string | null) => scope ? `「${scope}」の新着物件を週1回お届けします。登録は不要です。` : '東京23区の新着物件を週1回お届けします。登録は不要です。', email: 'メールアドレス', submit: '受け取る', consent: '新着物件のお知らせメールを受け取ることに同意します（いつでも配信停止できます）', sent: '確認メールを送ります。メール内のリンクから登録を完了してください（数分ほどかかります）。', error: '送信できませんでした。メールアドレスをご確認のうえ、もう一度お試しください。' },
  en: { title: 'Get new listings by email', subtitle: (scope: string | null) => scope ? `New listings for “${scope}”, once a week. No account needed.` : "New listings in Tokyo's 23 wards, once a week. No account needed.", email: 'Email address', submit: 'Get alerts', consent: 'I agree to receive new-listing emails (unsubscribe any time)', sent: 'We will send a confirmation email within a few minutes. Open the link in it to finish.', error: 'We could not sign you up. Check the address and try again.' },
  'zh-TW': { title: '以郵件接收新物件', subtitle: (scope: string | null) => scope ? `每週一次寄送「${scope}」的新物件，免註冊。` : '每週一次寄送東京23區的新物件，免註冊。', email: '電子郵件', submit: '接收通知', consent: '我同意接收新物件通知郵件（可隨時取消）', sent: '確認郵件將於數分鐘內寄出，請從郵件中的連結完成登記。', error: '無法送出，請確認電子郵件後再試一次。' },
  'zh-CN': { title: '通过邮件接收新房源', subtitle: (scope: string | null) => scope ? `每周一次发送“${scope}”的新房源，无需注册。` : '每周一次发送东京23区的新房源，无需注册。', email: '电子邮箱', submit: '接收通知', consent: '我同意接收新房源通知邮件（可随时取消）', sent: '确认邮件将在几分钟内发出，请通过邮件中的链接完成订阅。', error: '无法提交，请确认邮箱后再试一次。' },
} as const

interface ListingAlertFormProps {
  /** Japanese ward name, as stored on listings (e.g. 港区). */
  ward?: string
  type?: TypeSlug
  budget?: BudgetSlug
  /** Shown to the visitor, e.g. 「港区」 or 「中古マンション」. */
  scopeLabel?: string
}

type State = 'idle' | 'sending' | 'sent' | 'error'

export function ListingAlertForm({ ward, type, budget, scopeLabel }: ListingAlertFormProps) {
  const locale = useLocale()
  const text = copy[locale as keyof typeof copy] ?? copy.en
  const id = useId()
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(false)
  const [state, setState] = useState<State>('idle')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setState('sending')
    try {
      const response = await fetch('/api/alerts/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, ward, type, budget, consent, website: '' }),
      })
      setState(response.ok ? 'sent' : 'error')
    } catch {
      setState('error')
    }
  }

  return <section className="mt-10 rounded-xl border border-[#dbe2e9] bg-[#f4f7fb] p-5 md:p-6" aria-labelledby={`${id}-title`} data-testid="listing-alert-form">
    <h2 id={`${id}-title`} className="flex items-center gap-2 text-lg font-semibold"><BellRing aria-hidden="true" className="h-5 w-5 text-[#274d7d]" />{text.title}</h2>
    <p className="mt-1 text-sm leading-6 text-[#536274]">{text.subtitle(scopeLabel ?? null)}</p>
    {state === 'sent'
      ? <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-[#3f5f39]" role="status"><CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />{text.sent}</p>
      : <form onSubmit={submit} className="mt-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor={`${id}-email`} className="sr-only">{text.email}</label>
          <input id={`${id}-email`} type="email" required autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder={text.email} className="h-11 min-w-0 flex-1 rounded-lg border border-[#cfd9e3] bg-white px-3 text-sm focus:border-[#274d7d] focus:outline-none focus:ring-2 focus:ring-[#274d7d]/15" />
          <button type="submit" disabled={state === 'sending' || !consent} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#274d7d] px-5 text-sm font-semibold text-white hover:bg-[#18375f] disabled:opacity-60">{state === 'sending' && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}{text.submit}</button>
        </div>
        <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#536274]">
          <input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#274d7d]" />
          {text.consent}
        </label>
        {state === 'error' && <p className="mt-2 text-sm text-[#b42318]" role="alert">{text.error}</p>}
      </form>}
  </section>
}
