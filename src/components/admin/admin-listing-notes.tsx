'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquarePlus, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface AdminListingNotesProps {
  listingId: string
  initialNotes: string | null
}

export function AdminListingNotes({ listingId, initialNotes }: AdminListingNotesProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [notes, setNotes] = useState(initialNotes || '')
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.selectionStart = textareaRef.current.value.length
    }
  }, [isEditing])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes: notes || null }),
      })
      if (!res.ok) throw new Error('保存に失敗しました')
      toast.success('メモを保存しました')
      setIsEditing(false)
      router.refresh()
    } catch {
      toast.error('メモの保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setNotes(initialNotes || '')
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="flex items-start gap-1 min-w-0">
        {initialNotes ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-left text-xs text-muted-foreground hover:text-foreground truncate max-w-[200px] cursor-pointer"
            title={initialNotes}
          >
            {initialNotes}
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-start gap-1">
      <textarea
        ref={textareaRef}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="text-xs border rounded px-2 py-1 w-[200px] h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="メモを入力..."
        disabled={isSaving}
      />
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
        >
          {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
