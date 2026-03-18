import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// import { prisma } from '@/lib/db' // Removed to bypass firewall
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin')
  }

  // Prisma -> Supabase Client
  const { data: dbUser, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', authUser.email!)
    .single()

  if (error || !dbUser || dbUser.role !== 'ADMIN') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
