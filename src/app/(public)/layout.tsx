import { Header } from '@/components/common/header'
import { Footer } from '@/components/common/footer'
import { FooterGuides } from '@/components/common/footer-guides'
import { CompareBar } from '@/components/listing/browser-lists-client'
import { PublicPageviewTracker } from '@/components/analytics/public-pageview-tracker'
import { getOptionalPublicViewer } from '@/lib/public-viewer'
import { getJpyRates } from '@/lib/fx'
import { FxRatesProvider } from '@/components/fx/fx-rates-context'
import { LanguageSuggestion } from '@/components/common/language-suggestion'
import { Suspense } from 'react'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, rates] = await Promise.all([getOptionalPublicViewer(), getJpyRates()])

  return (
    <FxRatesProvider rates={rates}>
      <div className="flex min-h-screen flex-col">
        <PublicPageviewTracker />
        <Header user={user} />
        <Suspense fallback={null}><LanguageSuggestion /></Suspense>
        <main className="flex-1">{children}</main>
        <Footer guides={<FooterGuides />} />
        <CompareBar />
      </div>
    </FxRatesProvider>
  )
}
