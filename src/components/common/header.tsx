'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { LocaleSwitcher } from './locale-switcher'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Heart, Menu } from 'lucide-react'

interface HeaderProps {
  user?: {
    email: string
    role: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <header data-testid="public-header" className="sticky top-0 z-50 w-full border-b border-[#dbe2e9] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="container flex h-[74px] items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="group flex items-center gap-3 text-[#142337]">
            <span className="text-[1.55rem] font-semibold tracking-[0.12em]">ZIYOU</span>
            <span className="hidden border-l border-[#cbd5df] pl-3 text-[11px] font-medium leading-4 tracking-[0.08em] text-[#64778b] sm:block">{t('common.appName')}<br />REAL ESTATE</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
            <Link
              href="/listings"
              className={`border-b-2 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/listings') ? 'border-[#274d7d] text-[#142337]' : 'border-transparent text-[#647487] hover:text-[#142337]'}`}
            >
              {t('nav.listings')}
            </Link>
            <Link
              href="/buying-guide"
              className={`border-b-2 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/buying-guide') ? 'border-[#274d7d] text-[#142337]' : 'border-transparent text-[#647487] hover:text-[#142337]'}`}
            >
              {t('nav.guides')}
            </Link>
            <Link href="/match" className={`border-b-2 py-2 text-sm font-medium transition-colors ${pathname.startsWith('/match') ? 'border-[#274d7d] text-[#142337]' : 'border-transparent text-[#647487] hover:text-[#142337]'}`}>{t('nav.match')}</Link>
          </nav>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <LocaleSwitcher />

          {user ? (
            <>
              <Link href="/favorites">
                  <Button variant="ghost" size="icon" aria-label={t('nav.favorites')}>
                  <Heart className="h-5 w-5" />
                </Button>
              </Link>
              {user.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm">
                    {t('nav.admin')}
                  </Button>
                </Link>
              )}
              <form action="/api/auth/logout" method="POST">
                <Button variant="ghost" size="sm" type="submit">
                  {t('common.logout')}
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  {t('common.login')}
                </Button>
              </Link>
              <Link href="/register">
                  <Button size="sm" className="rounded-[4px] bg-[#274d7d] hover:bg-[#18375f]">
                  {t('common.register')}
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden items-center gap-2">
          <LocaleSwitcher />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  ZIYOU <span className="text-xs font-normal text-[#647487]">{t('common.appName')}</span>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                <Link
                  href="/listings"
                  onClick={closeMenu}
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  {t('nav.listings')}
                </Link>
                <Link
                  href="/buying-guide"
                  onClick={closeMenu}
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  {t('nav.guides')}
                </Link>
                <Link href="/match" onClick={closeMenu} className="text-lg font-medium hover:text-primary transition-colors">{t('nav.match')}</Link>

                {user ? (
                  <>
                    <Link
                      href="/favorites"
                      onClick={closeMenu}
                      className="text-lg font-medium hover:text-primary transition-colors flex items-center gap-2"
                    >
                      <Heart className="h-5 w-5" />
                      {t('nav.favorites')}
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={closeMenu}
                        className="text-lg font-medium hover:text-primary transition-colors"
                      >
                        {t('nav.admin')}
                      </Link>
                    )}
                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm text-muted-foreground mb-2">{user.email}</p>
                      <form action="/api/auth/logout" method="POST">
                        <Button variant="outline" className="w-full" type="submit">
                          {t('common.logout')}
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-2 border-t pt-4 mt-4">
                    <Link href="/login" onClick={closeMenu}>
                      <Button variant="outline" className="w-full">
                        {t('common.login')}
                      </Button>
                    </Link>
                    <Link href="/register" onClick={closeMenu}>
                      <Button className="w-full">
                        {t('common.register')}
                      </Button>
                    </Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
