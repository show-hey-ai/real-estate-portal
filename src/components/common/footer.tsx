'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { getHelpCopy } from '@/content/help'
import { Separator } from '@/components/ui/separator'
import { WARD_SLUGS, WARD_TILES, wardLabel } from '@/lib/ward-tile-map'
import { BUDGET_SLUGS, TYPE_COLLECTIONS, budgetBand, type TypeSlug } from '@/lib/collections'
import { priceBandRange } from '@/lib/price-bands'
import { LINE_ADD_URL, LINE_ID, WECHAT_DEEP_LINK, WECHAT_ID, WHATSAPP_NUMBER } from '@/lib/contact-channels'

const OVERSEAS_LABEL: Record<string, string> = { ja: '海外から買う（お金の流れ）', en: 'Buying from overseas', 'zh-TW': '從海外購屋', 'zh-CN': '从海外买房' }
const INTL_LABEL: Record<string, string> = { ja: '外国人の購入ガイド', en: 'Buying in Tokyo as a foreigner', 'zh-TW': '外國人東京買房指南', 'zh-CN': '外国人东京买房指南' }
const ABOUT_LABEL: Record<string, string> = { ja: '運営会社・監修者', en: 'About us', 'zh-TW': '營運公司與監修者', 'zh-CN': '运营公司与审校者' }

interface FooterProps {
  /** Guide links rendered on the server (see FooterGuides). */
  guides?: React.ReactNode
}

export function Footer({ guides }: FooterProps) {
  const t = useTranslations()
  const locale = useLocale()
  const help = getHelpCopy(locale)
  const privacyPath = locale === 'ja' ? '/ja/privacy.html'
    : locale === 'zh-TW' ? '/zh-tw/privacy.html'
    : locale === 'zh-CN' ? '/zh-cn/privacy.html'
    : '/privacy.html'
  const currentYear = new Date().getFullYear()
  const company = {
    ja: { name: '自由不動産合同会社', license: '宅地建物取引業 東京都知事（1）第108831号', address: '〒111-0052 東京都台東区柳橋1丁目11番5号 柳橋ビル305号室', wards: '東京23区から探す', types: '種類から探す', budget: '予算から探す' },
    en: { name: 'Ziyou Real Estate LLC', license: 'Real estate brokerage licence: Tokyo Governor (1) No. 108831', address: 'Yanagibashi Bldg. 305, 1-11-5 Yanagibashi, Taito-ku, Tokyo 111-0052, Japan', wards: "Browse Tokyo's 23 wards", types: 'Browse by property type', budget: 'Browse by budget' },
    'zh-TW': { name: '自由不動產合同會社', license: '宅地建物交易業 東京都知事（1）第108831號', address: '〒111-0052 東京都台東區柳橋1丁目11番5號 柳橋大樓305號室', wards: '依東京23區尋找', types: '依類型尋找', budget: '依預算尋找' },
    'zh-CN': { name: '自由不动产合同会社', license: '宅地建物交易业 东京都知事（1）第108831号', address: '〒111-0052 东京都台东区柳桥1丁目11番5号 柳桥大楼305号室', wards: '按东京23区查找', types: '按类型查找', budget: '按预算查找' },
  }[locale] ?? { name: 'Ziyou Real Estate LLC', license: 'Real estate brokerage licence: Tokyo Governor (1) No. 108831', address: 'Yanagibashi Bldg. 305, 1-11-5 Yanagibashi, Taito-ku, Tokyo 111-0052, Japan', wards: "Browse Tokyo's 23 wards", types: 'Browse by property type', budget: 'Browse by budget' }

  return (
    <footer className="border-t border-[#dbe2e9] bg-[#142337] text-white">
      <div className="container py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-end gap-3">
              <span className="text-2xl font-semibold tracking-[0.08em]">WELCOME HOME</span>
              <span className="pb-1 text-xs font-semibold tracking-[0.16em] text-white/60">TOKYO</span>
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
              <li><Link href="/buy-property-in-tokyo" className="text-white/65 hover:text-white transition-colors">{INTL_LABEL[locale] ?? INTL_LABEL.en}</Link></li>
              <li><Link href="/buy-from-overseas" className="text-white/65 hover:text-white transition-colors">{OVERSEAS_LABEL[locale] ?? OVERSEAS_LABEL.en}</Link></li>
              <li><Link href="/about" className="text-white/65 hover:text-white transition-colors">{ABOUT_LABEL[locale] ?? ABOUT_LABEL.en}</Link></li>
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
              <p><a href="mailto:admin@ziyou-fudosan.com" className="hover:text-white">admin@ziyou-fudosan.com</a></p>
              <p className="flex flex-wrap gap-x-4 gap-y-1">
                <a href={LINE_ADD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">LINE {LINE_ID}</a>
                <a href={WECHAT_DEEP_LINK} className="hover:text-white">WeChat {WECHAT_ID}</a>
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp</a>
              </p>
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

        {guides}

        <nav aria-label={company.wards} className="mt-10">
          <h2 className="mb-3 text-sm font-semibold"><Link href="/areas" className="hover:underline">{company.wards}</Link></h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {WARD_TILES.map(({ ward }) => <li key={ward}><Link href={`/areas/${WARD_SLUGS[ward]}`} className="text-white/65 transition-colors hover:text-white">{wardLabel(ward, locale)}</Link></li>)}
          </ul>
        </nav>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <nav aria-label={company.types}>
            <h2 className="mb-3 text-sm font-semibold">{company.types}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{(Object.keys(TYPE_COLLECTIONS) as TypeSlug[]).map((slug) => <li key={slug}><Link href={`/types/${slug}`} className="text-white/65 transition-colors hover:text-white">{TYPE_COLLECTIONS[slug].label[locale as keyof (typeof TYPE_COLLECTIONS)[TypeSlug]['label']] ?? TYPE_COLLECTIONS[slug].label.en}</Link></li>)}</ul>
          </nav>
          <nav aria-label={company.budget}>
            <h2 className="mb-3 text-sm font-semibold">{company.budget}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">{BUDGET_SLUGS.map((slug) => <li key={slug}><Link href={`/budget/${slug}`} className="text-white/65 transition-colors hover:text-white">{priceBandRange(budgetBand(slug)!, locale)}</Link></li>)}</ul>
          </nav>
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
