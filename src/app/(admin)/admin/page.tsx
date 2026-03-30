import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { Building2, Eye, FileText, Users, ArrowRight, Mail, MessageSquare, BarChart3 } from 'lucide-react'
import { formatDistanceToNow } from '@/lib/format'

export default async function AdminDashboardPage() {
  const t = await getTranslations('admin')
  const supabase = await createClient()

  // Helper to get count safely
  const getCount = async (table: string, filter?: { column: string, value: string }) => {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter) {
      query = query.eq(filter.column, filter.value)
    }
    const { count, error } = await query
    if (error) {
      console.error(`Error counting ${table}:`, error)
      return 0
    }
    return count || 0
  }

  const [totalListings, publishedListings, draftListings, newLeads] = await Promise.all([
    getCount('listings'),
    getCount('listings', { column: 'status', value: 'PUBLISHED' }),
    getCount('listings', { column: 'status', value: 'DRAFT' }),
    getCount('leads', { column: 'status', value: 'NEW' }),
  ])

  // 総閲覧数を取得
  const { data: viewsData } = await supabase
    .from('listings')
    .select('viewCount')
  const totalViews = (viewsData || []).reduce((sum, l) => sum + (l.viewCount || 0), 0)

  // 最近のリードを取得
  const { data: recentLeadsRaw } = await supabase
    .from('leads')
    .select(`
      id,
      contact_method,
      message,
      status,
      created_at,
      users!leads_user_id_fkey (
        email,
        name
      ),
      listings!leads_listing_id_fkey (
        id,
        address_public,
        property_type
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5)

  // 型を整形
  const recentLeads = (recentLeadsRaw || []).map(lead => {
    const user = Array.isArray(lead.users) ? lead.users[0] : lead.users
    const listing = Array.isArray(lead.listings) ? lead.listings[0] : lead.listings
    return {
      id: lead.id,
      contactMethod: lead.contact_method,
      message: lead.message,
      status: lead.status,
      createdAt: lead.created_at,
      user: user ? { email: user.email, name: user.name } : null,
      listing: listing ? {
        id: listing.id,
        addressPublic: listing.address_public,
        propertyType: listing.property_type,
      } : null,
    }
  })

  const stats = [
    {
      title: t('stats.totalListings'),
      value: totalListings,
      icon: Building2,
      href: '/admin/listings',
    },
    {
      title: t('stats.publishedListings'),
      value: publishedListings,
      icon: Eye,
      href: '/admin/listings?status=published',
    },
    {
      title: t('stats.draftListings'),
      value: draftListings,
      icon: FileText,
      href: '/admin/listings?status=draft',
    },
    {
      title: t('stats.newLeads'),
      value: newLeads,
      icon: Users,
      href: '/admin/leads?status=new',
    },
    {
      title: t('stats.totalViews'),
      value: totalViews.toLocaleString(),
      icon: BarChart3,
      href: '/admin/analytics',
    },
  ]

  const getContactIcon = (method: string) => {
    switch (method) {
      case 'EMAIL':
        return <Mail className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="default">{t('lead.new')}</Badge>
      case 'CONTACTED':
        return <Badge variant="secondary">{t('lead.contacted')}</Badge>
      case 'CLOSED':
        return <Badge variant="outline">{t('lead.closed')}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('dashboard')}</h1>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('recentLeads')}</CardTitle>
          <Link href="/admin/leads">
            <Button variant="ghost" size="sm" className="gap-2">
              {t('viewAllLeads')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentLeads && recentLeads.length > 0 ? (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getContactIcon(lead.contactMethod)}
                      <span className="font-medium truncate">
                        {lead.user?.name || lead.user?.email || 'Unknown'}
                      </span>
                      {getStatusBadge(lead.status)}
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {lead.listing?.propertyType && `[${lead.listing.propertyType}] `}
                      {lead.listing?.addressPublic || 'Unknown property'}
                    </p>
                    {lead.message && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {lead.message}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(lead.createdAt))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {t('noLeads')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
