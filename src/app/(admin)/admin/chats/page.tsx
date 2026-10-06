import { PrivateChatIndex } from '@/components/chat/private-chats'
import { getAdminUserFromSession } from '@/lib/admin-auth'
import { notFound } from 'next/navigation'
export default async function AdminChats() {
  if (!await getAdminUserFromSession()) notFound()
  return <PrivateChatIndex />
}
