'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Heart, Menu, Search } from 'lucide-react'
import { getHelpCopy } from '@/content/help'
import { getPrivateChatCopy } from '@/lib/private-chat-copy'
import { getMarketplaceCopy } from '@/lib/marketplace-copy'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LocaleSwitcher } from './locale-switcher'

interface HeaderProps { user?: { email: string; role: string } | null }

export function Header({ user }: HeaderProps) {
  const t = useTranslations()
  const locale = useLocale()
  const copy = getMarketplaceCopy(locale)
  const help = getHelpCopy(locale)
  const chat = getPrivateChatCopy(locale)
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const links = [
    { href: '/listings', label: copy.discover, active: pathname === '/' || pathname.startsWith('/listings') },
    { href: '/match', label: copy.recommendations, active: pathname.startsWith('/match') },
    { href: '/favorites', label: t('nav.favorites'), active: pathname.startsWith('/favorites') },
    { href: '/chats', label: chat.title, active: pathname.startsWith('/chats') },
    { href: '/buying-guide', label: t('nav.guides'), active: pathname.startsWith('/buying-guide') },
    { href: '/articles', label: copy.articles, active: pathname.startsWith('/articles') },
    { href: '/help', label: help.nav, active: pathname.startsWith('/help') },
  ]

  return <header data-testid="public-header" className="relative z-50 w-full border-b md:sticky md:top-0 border-[#dbe2e9] bg-white">
    <div className="container grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-x-5 md:py-4">
      <Link href="/" className="flex flex-col items-start gap-1 text-[#142337] sm:flex-row sm:items-center sm:gap-2">
        <span className="whitespace-nowrap text-[15px] font-semibold leading-none tracking-[0.08em] sm:text-lg md:text-[1.3rem]">WELCOME HOME</span>
        <span className="text-[9px] font-semibold leading-none tracking-[0.3em] text-[#64778b] sm:border-l sm:border-[#cbd5df] sm:pl-2 sm:text-[10px] sm:leading-4 sm:tracking-[0.16em]">TOKYO</span>
      </Link>
      <form role="search" aria-label={copy.search} data-testid="header-property-search" action="/listings" method="get" className="col-span-2 row-start-2 flex h-11 min-w-0 items-center rounded-lg border border-[#dbe2e9] bg-[#f5f7f9] focus-within:border-[#274d7d] focus-within:ring-2 focus-within:ring-[#274d7d]/15 md:col-span-1 md:col-start-2 md:row-start-1">
        <input type="search" name="q" maxLength={80} aria-label={copy.keyword} placeholder={copy.keyword} className="h-full w-full min-w-0 rounded-l-lg bg-transparent pl-4 text-sm text-[#1b293a] outline-none placeholder:text-[#728092]" />
        <button type="submit" aria-label={copy.search} className="flex h-11 w-12 shrink-0 items-center justify-center rounded-r-lg text-[#274d7d] hover:bg-[#e8eef5]"><Search aria-hidden="true" className="h-5 w-5" /></button>
      </form>
      <div className="col-start-2 row-start-1 flex items-center justify-end gap-1 md:col-start-3 md:gap-2">
        <div className="hidden items-center gap-1 lg:flex">
          {user ? <>
            {user.role === 'ADMIN' && <Button variant="outline" size="sm" asChild><Link href="/admin">{t('nav.admin')}</Link></Button>}
            <form action="/api/auth/logout" method="POST"><Button variant="ghost" size="sm" type="submit">{t('common.logout')}</Button></form>
          </> : <>
            <Button variant="ghost" size="sm" asChild><Link href="/login">{t('common.login')}</Link></Button>
            <Button size="sm" className="rounded-lg bg-[#274d7d] hover:bg-[#18375f]" asChild><Link href="/register">{t('common.register')}</Link></Button>
          </>}
        </div>
        <LocaleSwitcher />
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild><Button variant="ghost" size="icon" className="lg:hidden" aria-label={copy.menu}><Menu aria-hidden="true" className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="right" className="w-[280px] overflow-y-auto">
            <SheetHeader><SheetTitle>{t('common.appName')}</SheetTitle><SheetDescription className="sr-only">{copy.navigation}</SheetDescription></SheetHeader>
            <nav aria-label={copy.navigation} className="mt-3 flex flex-col gap-4 px-4 pb-6">
              {links.map(({ href, label, active }) => <Link key={href} href={href} onClick={() => setIsOpen(false)} aria-current={active ? 'page' : undefined} className="flex min-h-10 items-center gap-2 text-base font-medium hover:text-primary">{href === '/favorites' && <Heart aria-hidden="true" className="h-4 w-4" />}{label}</Link>)}
              {user ? <>
                {user.role === 'ADMIN' && <Link href="/admin" onClick={() => setIsOpen(false)} className="text-base font-medium">{t('nav.admin')}</Link>}
                <div className="mt-2 border-t pt-4"><p className="mb-3 break-all text-sm text-muted-foreground">{user.email}</p><form action="/api/auth/logout" method="POST"><Button variant="outline" className="w-full" type="submit">{t('common.logout')}</Button></form></div>
              </> : <div className="mt-2 flex flex-col gap-2 border-t pt-4">
                <Button variant="outline" asChild><Link href="/login" onClick={() => setIsOpen(false)}>{t('common.login')}</Link></Button>
                <Button asChild><Link href="/register" onClick={() => setIsOpen(false)}>{t('common.register')}</Link></Button>
              </div>}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </div>
    <div className="border-t border-[#edf0f4]"><nav aria-label={copy.navigation} className="container flex gap-6 overflow-x-auto whitespace-nowrap md:gap-8">
      {links.map(({ href, label, active }) => <Link key={href} href={href} aria-current={active ? 'page' : undefined} className={`flex min-h-12 shrink-0 items-center border-b-2 px-1 text-sm font-medium transition-colors ${active ? 'border-[#274d7d] text-[#274d7d]' : 'border-transparent text-[#657487] hover:text-[#274d7d]'}`}>{label}</Link>)}
    </nav></div>
  </header>
}
