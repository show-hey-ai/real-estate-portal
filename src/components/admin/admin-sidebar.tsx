'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileUp,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
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
  { href: '/admin/import', icon: FileUp, labelKey: 'admin.importNav' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  return (
    <aside className="w-64 border-r bg-muted/30 min-h-screen">
      <div className="p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Building2 className="h-6 w-6" />
          <span>Admin</span>
        </Link>
      </div>

      <nav className="px-4 space-y-1">
        {navItems.map((item: any) => { // Using any temporarily to bypass strict type check for the mixed structure
          if (item.children) {
            // Parent item with children
            return (
              <div key={item.titleKey || item.labelKey} className="space-y-1">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground">
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {/* Fallback to simple string if key not found (debugging) or use t() */}
                  {t(item.titleKey)}
                </div>
                <div className="pl-4 space-y-1">
                  {item.children.map((child: any) => {
                    const isActive = pathname === child.href
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {child.labelKey ? t(child.labelKey) : child.title}
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
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {item.icon && <item.icon className="h-4 w-4" />}
              {t(item.labelKey)}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 w-64 p-4 border-t">
        <form action="/api/auth/logout" method="POST">
          <Button variant="ghost" className="w-full justify-start" type="submit">
            <LogOut className="h-4 w-4 mr-2" />
            {t('common.logout')}
          </Button>
        </form>
      </div>
    </aside>
  )
}
