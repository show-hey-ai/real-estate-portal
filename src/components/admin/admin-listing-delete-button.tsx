'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AdminListingDeleteButtonProps {
  listingId: string
  managementId: string | null
}

export function AdminListingDeleteButton({
  listingId,
  managementId,
}: AdminListingDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    const label = managementId || listingId
    if (!window.confirm(`${label} を削除しますか？この操作は取り消せません。`)) {
      return
    }

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || '削除に失敗しました')
      }

      toast.success(`${label} を削除しました`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
