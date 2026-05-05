'use client'

import { useState } from 'react'
import Link from 'next/link'
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
import { Heart, Hotel, Menu } from 'lucide-react'

interface HeaderProps {
  user?: {
    email: string
    role: string
  } | null
}

export function Header({ user }: HeaderProps) {
  const t = useTranslations()
  const [isOpen, setIsOpen] = useState(false)

  const closeMenu = () => setIsOpen(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#ded6c4] bg-[#fffdf8]/92 backdrop-blur supports-[backdrop-filter]:bg-[#fffdf8]/78">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-[#16251f]">
            <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#10231e] text-[#d8a64a]">
              <Hotel className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">{t('common.appName')}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/listings"
              className="text-sm font-medium text-[#5f6b65] transition-colors hover:text-[#16251f]"
            >
              {t('nav.listings')}
            </Link>
            <Link
              href="/guides"
              className="text-sm font-medium text-[#5f6b65] transition-colors hover:text-[#16251f]"
            >
              {t('nav.guides')}
            </Link>
          </nav>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          <LocaleSwitcher />

          {user ? (
            <>
              <Link href="/favorites">
                <Button variant="ghost" size="icon">
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
                  <Button size="sm" className="rounded-[8px] bg-[#2f6d58] hover:bg-[#265746]">
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
                  <Hotel className="h-5 w-5" />
                  {t('common.appName')}
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
                  href="/guides"
                  onClick={closeMenu}
                  className="text-lg font-medium hover:text-primary transition-colors"
                >
                  {t('nav.guides')}
                </Link>

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
