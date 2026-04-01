import { Header } from '@/components/common/header'
import { Footer } from '@/components/common/footer'
import { PublicPageviewTracker } from '@/components/analytics/public-pageview-tracker'
import { getOptionalPublicViewer } from '@/lib/public-viewer'

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getOptionalPublicViewer()

  return (
    <div className="flex min-h-screen flex-col">
      <PublicPageviewTracker />
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
