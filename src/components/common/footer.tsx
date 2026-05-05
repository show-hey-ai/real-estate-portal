'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Hotel } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export function Footer() {
  const t = useTranslations()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-[#ded6c4] bg-[#10231e] text-white">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white/10 text-[#d8a64a]">
                <Hotel className="h-5 w-5" />
              </span>
              <span className="font-bold text-lg">{t('common.appName')}</span>
            </Link>
            <p className="text-sm leading-7 text-white/65 max-w-md">
              {t('home.heroDescription')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">{t('nav.listings')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/listings" className="text-white/65 hover:text-white transition-colors">
                  {t('home.viewListings')}
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-white/65 hover:text-white transition-colors">
                  {t('nav.guides')}
                </Link>
              </li>
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
            <h3 className="font-semibold mb-4">{t('common.contact')}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-white/65">
                  {t('common.privacyPolicy')}
                </span>
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
