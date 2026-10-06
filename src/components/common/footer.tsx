'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { getHelpCopy } from '@/content/help'
import { Separator } from '@/components/ui/separator'
import { WARD_SLUGS, WARD_TILES, wardLabel } from '@/lib/ward-tile-map'

export function Footer() {
  const t = useTranslations()
  const locale = useLocale()
  const help = getHelpCopy(locale)
  const privacyPath = locale === 'ja' ? '/ja/privacy.html'
    : locale === 'zh-TW' ? '/zh-tw/privacy.html'
    : locale === 'zh-CN' ? '/zh-cn/privacy.html'
    : '/privacy.html'
  const currentYear = new Date().getFullYear()
  const company = {
    ja: { name: '自由不動産合同会社', license: '宅地建物取引業 東京都知事（1）第108831号', address: '〒111-0052 東京都台東区柳橋1丁目11番5号 柳橋ビル305号室', wards: '東京23区から探す' },
    en: { name: 'Ziyou Real Estate LLC', license: 'Real estate brokerage licence: Tokyo Governor (1) No. 108831', address: 'Yanagibashi Bldg. 305, 1-11-5 Yanagibashi, Taito-ku, Tokyo 111-0052, Japan', wards: "Browse Tokyo's 23 wards" },
    'zh-TW': { name: '自由不動產合同會社', license: '宅地建物交易業 東京都知事（1）第108831號', address: '〒111-0052 東京都台東區柳橋1丁目11番5號 柳橋大樓305號室', wards: '依東京23區尋找' },
    'zh-CN': { name: '自由不动产合同会社', license: '宅地建物交易业 东京都知事（1）第108831号', address: '〒111-0052 东京都台东区柳桥1丁目11番5号 柳桥大楼305号室', wards: '按东京23区查找' },
  }[locale] ?? { name: 'Ziyou Real Estate LLC', license: 'Real estate brokerage licence: Tokyo Governor (1) No. 108831', address: 'Yanagibashi Bldg. 305, 1-11-5 Yanagibashi, Taito-ku, Tokyo 111-0052, Japan', wards: "Browse Tokyo's 23 wards" }

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
            <address className="mb-4 space-y-1.5 text-sm not-italic leading-6 text-white/75">
              <p className="font-medium text-white">{company.name}</p>
              <p>{company.license}</p>
              <p>{company.address}</p>
              <p><a href="tel:+81356877120" className="hover:text-white">TEL 03-5687-7120</a></p>
              <p><a href="mailto:admin@ziyou-fudosan.com" className="hover:text-white">admin@ziyou-fudosan.com</a></p>
            </address>
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

        <nav aria-label={company.wards} className="mt-10">
          <h2 className="mb-3 text-sm font-semibold">{company.wards}</h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {WARD_TILES.map(({ ward }) => <li key={ward}><Link href={`/areas/${WARD_SLUGS[ward]}`} className="text-white/65 transition-colors hover:text-white">{wardLabel(ward, locale)}</Link></li>)}
          </ul>
        </nav>

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
