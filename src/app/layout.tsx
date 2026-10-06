import type { Metadata } from 'next'
import { Noto_Sans_JP } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { JsonLd } from '@/components/common/json-ld'
import { Toaster } from '@/components/ui/sonner'
import {
  absoluteUrl,
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  getOpenGraphLocale,
  getSiteCopy,
  getSiteUrl,
} from '@/lib/site-config'
import { BuyerFunnelProvider } from '@/components/analytics/buyer-funnel'
import './globals.css'

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const siteCopy = getSiteCopy(locale)

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: siteCopy.title,
      template: '%s | Ziyou Real Estate',
    },
    description: siteCopy.description,
    applicationName: 'Ziyou Real Estate',
    keywords: [
      'Tokyo property for sale',
      'Tokyo condominium for sale',
      'Tokyo house for sale',
      'buy property in Tokyo',
      '東京 中古マンション 購入',
      '東京 戸建て 購入',
      '東京 投資 住宅 土地 物件',
    ],
    alternates: {
      canonical: absoluteUrl('/'),
    },
    openGraph: {
      type: 'website',
      url: absoluteUrl('/'),
      siteName: 'Ziyou Real Estate',
      title: siteCopy.title,
      description: siteCopy.description,
      locale: getOpenGraphLocale(locale),
    },
    twitter: {
      card: 'summary_large_image',
      title: siteCopy.title,
      description: siteCopy.description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    category: 'real estate',
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const organizationJsonLd = buildOrganizationJsonLd(locale)
  const websiteJsonLd = buildWebsiteJsonLd(locale)

  return (
    <html lang={locale}>
      <body className={`${notoSansJP.variable} font-sans antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <JsonLd data={organizationJsonLd} />
          <JsonLd data={websiteJsonLd} />
          <BuyerFunnelProvider>{children}</BuyerFunnelProvider>
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
