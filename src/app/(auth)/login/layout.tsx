import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'

// The page itself is a client component, so its title is set here (it used to show the site title).
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common')
  return { title: t('login') }
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
