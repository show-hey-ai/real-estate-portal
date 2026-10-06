import type { Metadata } from 'next'
import { Header } from '@/components/common/header'
import { getOptionalPublicViewer } from '@/lib/public-viewer'
import { chatViewer } from '@/lib/private-chat-server'

export const metadata: Metadata = { title: 'Private chats', robots: { index: false, follow: false, googleBot: { index: false, follow: false } }, alternates: { canonical: '/chats' } }
export const dynamic = 'force-dynamic'
export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const account = await getOptionalPublicViewer()
  const authUser = account ? null : await chatViewer().catch(() => null)
  const user = account || (authUser?.email ? { email: authUser.email, role: 'USER' } : null)
  return <div className="min-h-screen bg-[#f7f9fb]"><Header user={user} /><main>{children}</main></div>
}
