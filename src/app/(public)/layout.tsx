import { Header } from '@/components/common/header'
import { Footer } from '@/components/common/footer'
import { PublicPageviewTracker } from '@/components/analytics/public-pageview-tracker'
import { createClient } from '@/lib/supabase/server'
// import { prisma } from '@/lib/db' // Removed to bypass firewall

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  let user = null
  if (authUser) {
    // Prisma -> Supabase Client
    const { data: dbUser } = await supabase
      .from('users')
      .select('email, role')
      .eq('email', authUser.email!)
      .single()

    // Header expects a user object. Prisma types are optional if shape matches.
    user = dbUser
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicPageviewTracker />
      <Header user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
