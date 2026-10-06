'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { getHelpCopy } from '@/content/help'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const t = useTranslations()
  const locale = useLocale()
  const help = getHelpCopy(locale)
  const privacyPath = locale === 'ja' ? '/ja/privacy.html'
    : locale === 'zh-TW' ? '/zh-tw/privacy.html'
    : locale === 'zh-CN' ? '/zh-cn/privacy.html'
    : '/privacy.html'
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#dbe2e9] bg-[#142337] text-white">
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-end gap-3">
              <span className="text-2xl font-semibold tracking-[0.12em]">ZIYOU</span>
              <span className="pb-1 text-xs text-white/60">{t('common.appName')}</span>
            </Link>
            <p className="text-sm leading-7 text-white/65 max-w-md">
              {t('home.heroDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="font-semibold mb-4">{t('nav.listings')}</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/listings" className="text-white/65 hover:text-white transition-colors">
                  {t('home.viewListings')}
                </Link>
              </li>
              <li>
                <Link href="/buying-guide" className="text-white/65 hover:text-white transition-colors">
                  {t('nav.guides')}
                </Link>
              </li>
              <li><Link href="/match" className="text-white/65 hover:text-white transition-colors">{t('nav.match')}</Link></li>
              <li><Link href="/articles" className="text-white/65 hover:text-white transition-colors">{t('nav.articles')}</Link></li>
              <li><Link href="/help" className="text-white/65 hover:text-white transition-colors">{help.nav}</Link></li>
              <li>
                <Link href="/register" className="text-white/65 hover:text-white transition-colors">
                  {t('common.register')}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-white/65 hover:text-white transition-colors">
                  {t('common.login')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h2 className="font-semibold mb-4">{t('common.contact')}</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href={`https://ziyou-fudosan.com${privacyPath}`} className="text-white/65 hover:text-white transition-colors">
                  {t('common.privacyPolicy')}
                </a>
              </li>
              <li>
                <span className="text-white/65">
                  {t('common.termsOfService')}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-white/12" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/56">
            {t('common.copyright', { year: currentYear })}
          </p>
        </div>
      </div>
    </footer>
  )
}
