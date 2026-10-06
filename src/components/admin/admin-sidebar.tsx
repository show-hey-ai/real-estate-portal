'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { getPrivateChatCopy } from '@/lib/private-chat-copy'
import { getLoginMethodsCopy } from '@/lib/login-methods-copy'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileUp,
  LogOut,
  BarChart3,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type AdminNavChild = {
  href: string
  labelKey: string
}

type AdminNavLeaf = {
  href: string
  icon: React.ComponentType<{ className?: string }>
  labelKey: string
}

type AdminNavGroup = {
  titleKey: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: AdminNavChild[]
}

type AdminNavItem = AdminNavLeaf | AdminNavGroup

function isNavGroup(item: AdminNavItem): item is AdminNavGroup {
  return 'children' in item
}

const navItems: AdminNavItem[] = [
  { href: '/admin', icon: LayoutDashboard, labelKey: 'admin.dashboard' },
  // The structure of this item has changed to support nested links.
  // The rendering logic in AdminSidebar will need to be updated to handle 'children'.
  {
    titleKey: 'admin.listings', // Use titleKey for the parent item's label
    href: '/admin/listings',
    icon: Building2, // Using Building2 as it's already imported
    children: [
      {
        href: '/admin/listings',
        labelKey: 'admin.listingsNav', // Assuming existing key for "All Listings"
      },
      {
        href: '/admin/listings/new',
        labelKey: 'admin.newListing', // TODO: Add i18n key 'admin.newListing'
      },
    ],
  },
  { href: '/admin/leads', icon: Users, labelKey: 'admin.leads' },
  { href: '/admin/analytics', icon: BarChart3, labelKey: 'admin.analyticsNav' },
  { href: '/admin/autonomy', icon: Activity, labelKey: 'admin.autonomyNav' },
  { href: '/admin/import', icon: FileUp, labelKey: 'admin.importNav' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations()
  const chat = getPrivateChatCopy(useLocale())
  const loginCopy = getLoginMethodsCopy(useLocale())

  return (
    <aside data-testid="admin-sidebar" className="sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r border-[#1f3b32] bg-[#10231e] text-white">
      <div className="border-b border-white/10 p-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#d8a64a] text-[#10231e]">
            <Building2 className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-[-0.02em]">Ziyou</span>
            <span className="block text-xs text-white/50">Hospitality admin</span>
          </span>
        </Link>
      </div>

      <nav aria-label="Admin" className="flex-1 space-y-2 px-4 py-6">
        <Link href="/admin/chats" className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10">{chat.title}</Link>
        <Link href="/admin/login-methods" className={cn('block rounded-lg px-3 py-2 text-sm font-medium', pathname === '/admin/login-methods' ? 'bg-[#d8a64a] text-[#10231e]' : 'text-white/80 hover:bg-white/10')}>{loginCopy.adminTitle}</Link>
        {navItems.map((item) => {
          if (isNavGroup(item)) {
            // Parent item with children
            return (
              <div key={item.titleKey} className="space-y-1">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-white/50">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {/* Fallback to simple string if key not found (debugging) or use t() */}
                  {t(item.titleKey)}
                </div>
                <div className="space-y-1 border-l border-white/10 pl-4">
                  {item.children.map((child) => {
                    const isActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[#d8a64a] text-[#10231e] shadow-sm'
                            : 'text-white/65 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        {t(child.labelKey)}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          }

          // Standard item
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#d8a64a] text-[#10231e] shadow-sm'
                  : 'text-white/65 hover:bg-white/10 hover:text-white'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" className="w-full justify-start text-white/70 hover:bg-white/10 hover:text-white" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            {t('common.logout')}
          </Button>
        </form>
      </div>
    </aside>
  )
}
