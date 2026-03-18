'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface LeadStatusSelectProps {
  leadId: string
  currentStatus: string
}

export function LeadStatusSelect({ leadId, currentStatus }: LeadStatusSelectProps) {
  const t = useTranslations('admin.lead')
  const tCommon = useTranslations('common')
  const [status, setStatus] = useState(currentStatus)
  const [isLoading, setIsLoading] = useState(false)

  const statuses = [
    { value: 'NEW', labelKey: 'new' },
    { value: 'CONTACTED', labelKey: 'contacted' },
    { value: 'CLOSED', labelKey: 'closed' },
  ]

  const handleChange = async (newStatus: string) => {
    setIsLoading(true)
    setStatus(newStatus)

    try {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) throw new Error()
      toast.success(tCommon('success'))
    } catch {
      setStatus(currentStatus)
      toast.error(tCommon('error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isLoading}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {t(s.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
