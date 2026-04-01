import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { LeadStatusSelect } from '@/components/admin/lead-status-select'

export default async function AdminLeadsPage() {
  const t = await getTranslations('admin')
  const supabase = await createClient()

  const { data: leadsData, error } = await supabase
    .from('leads')
    .select(`
      *,
      user:users (
        email,
        name
      ),
      listing:listings (
        addressPublic,
        propertyType
      )
    `)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('Error fetching leads:', error)
  }

  interface LeadData {
    id: string
    createdAt: string
    contactMethod: string
    contactValue: string | null
    message: string | null
    status: string
    user: { email: string; name: string } | { email: string; name: string }[] | null
    listing: { addressPublic: string; propertyType: string } | { addressPublic: string; propertyType: string }[] | null
  }

  const leads = (leadsData || []).map((lead: LeadData) => ({
    ...lead,
    user: Array.isArray(lead.user) ? lead.user[0] : lead.user,
    listing: Array.isArray(lead.listing) ? lead.listing[0] : lead.listing
  }))

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('leads')}</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.datetime')}</TableHead>
              <TableHead>{t('table.user')}</TableHead>
              <TableHead>{t('table.property')}</TableHead>
              <TableHead>{t('table.contactMethod')}</TableHead>
              <TableHead>{t('table.message')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {t('noLeads')}
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(lead.createdAt + "Z").toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.user?.name || '-'}</p>
                      <p className="text-sm text-muted-foreground">{lead.user?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lead.listing?.addressPublic || '-'}</p>
                      <p className="text-sm text-muted-foreground">
                        {lead.listing?.propertyType || '-'}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {lead.contactMethod}
                    </Badge>
                    {lead.contactValue && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {lead.contactValue}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate">{lead.message || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
