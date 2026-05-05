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
      template: '%s | Ziyou Hospitality',
    },
    description: siteCopy.description,
    applicationName: 'Ziyou Hospitality',
    keywords: [
      'Japan hospitality property',
      'Japan hotel acquisition',
      'Tokyo hotel property',
      'Japan ryokan for sale',
      'Japan minpaku property',
      'foreign investors Japan real estate',
      'Japan property for sale',
      '東京 ホテル 物件',
      '旅館業 物件',
      '民泊 物件',
    ],
    alternates: {
      canonical: absoluteUrl('/'),
    },
    openGraph: {
      type: 'website',
      url: absoluteUrl('/'),
      siteName: 'Ziyou Hospitality',
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
          {children}
          <Toaster />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
