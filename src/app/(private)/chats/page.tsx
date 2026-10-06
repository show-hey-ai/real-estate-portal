import { redirect } from 'next/navigation'
import { chatViewer } from '@/lib/private-chat-server'
import { PrivateChatIndex } from '@/components/chat/private-chats'

export default async function ChatsPage({ searchParams }: { searchParams: Promise<{ listing?: string; start?: string }> }) {
  const query = await searchParams
  const params = new URLSearchParams()
  if (query.listing) params.set('listing', query.listing)
  if (query.start === '1') params.set('start', '1')
  try { await chatViewer() } catch { redirect(`/login?redirect=${encodeURIComponent(`/chats?${params}`)}`) }
  return <PrivateChatIndex listingId={query.listing} start={query.start === '1'} />
}
