'use client'

import { useTranslations } from 'next-intl'
import { House, ShieldCheck, Sparkles } from 'lucide-react'

const benefitItems = [
  { icon: ShieldCheck, labelKey: 'checks' },
  { icon: Sparkles, labelKey: 'sourcing' },
  { icon: House, labelKey: 'focus' },
]

export function AuthBrandPanel() {
  const t = useTranslations()

  return (
    <aside data-testid="auth-brand" className="relative hidden min-h-screen overflow-hidden bg-[#10231e] text-white lg:block">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(216,166,74,0.2),transparent_42%),linear-gradient(135deg,#10231e,#235542)]" />
      <div className="relative flex min-h-screen flex-col justify-between p-10 xl:p-16">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#d8a64a] text-[#10231e]">
              <House className="h-6 w-6" />
            </span>
            <span className="text-xl font-semibold tracking-[-0.02em]">{t('common.appName')}</span>
          </div>
          <div className="mt-24 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d8a64a]">{t('auth.brandEyebrow')}</p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-[-0.03em] xl:text-6xl">
              {t('auth.brandTitle')}
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-white/70">
              {t('auth.brandDescription')}
            </p>
          </div>
        </div>
        <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
          {benefitItems.map(({ icon: Icon, labelKey }) => (
            <div key={labelKey} className="rounded-[10px] border border-white/15 bg-white/[0.08] p-4 backdrop-blur-md">
              <Icon className="h-5 w-5 text-[#d8a64a]" />
              <p className="mt-3 text-sm font-medium text-white/85">{t(`auth.brandBenefits.${labelKey}`)}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
