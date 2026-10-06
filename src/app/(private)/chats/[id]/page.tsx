import { notFound, redirect } from 'next/navigation'
import { chatViewer, findRoom, ChatError } from '@/lib/private-chat-server'
import { chatId } from '@/lib/private-chat-policy'
import { PrivateChatRoom } from '@/components/chat/private-chats'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!chatId.safeParse(id).success) notFound()
  try { const viewer = await chatViewer(); await findRoom(id, viewer.id) }
  catch (error) { if (error instanceof ChatError && error.status === 401) redirect(`/login?redirect=${encodeURIComponent(`/chats/${id}`)}`); notFound() }
  return <PrivateChatRoom key={id} id={id} />
}
