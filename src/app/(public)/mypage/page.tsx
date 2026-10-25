import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { getOptionalPublicViewer } from '@/lib/public-viewer'
import { getMemberCopy } from '@/lib/member-copy'
import { MyPage } from '@/components/member/my-page'

export async function generateMetadata(): Promise<Metadata> {
  return { title: getMemberCopy(await getLocale()).title, robots: { index: false, follow: false } }
}

export default async function MyPageRoute() {
  const viewer = await getOptionalPublicViewer()
  return <MyPage email={viewer?.email ?? null} userId={viewer?.id ?? null} />
}
