'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function AdminImportPage() {
  const t = useTranslations('admin.import')
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleUpload(files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUpload(files[0])
    }
  }

  const handleUpload = async (file: File) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      toast.error(t('invalidFileType'))
      return
    }

    if (file.size > 20 * 1024 * 1024) {
      toast.error(t('fileTooLarge'))
      return
    }

    setIsUploading(true)
    setUploadStatus('idle')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        console.error('Import error:', data)
        throw new Error(data.details || data.error || 'Upload failed')
      }

      setUploadStatus('success')
      toast.success(t('success'))

      // レビュー画面へ遷移
      setTimeout(() => {
        router.push(`/admin/listings/${data.listingId}/review`)
      }, 1000)
    } catch (err) {
      setUploadStatus('error')
      const errorMsg = err instanceof Error ? err.message : t('failed')
      toast.error(errorMsg)
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

      <Card>
        <CardHeader>
          <CardTitle>{t('uploadFile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-12 text-center transition-colors
              ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-lg font-medium">{t('processing')}</p>
              </div>
            ) : uploadStatus === 'success' ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <p className="text-lg font-medium text-green-600">{t('success')}</p>
              </div>
            ) : uploadStatus === 'error' ? (
              <div className="flex flex-col items-center gap-4">
                <XCircle className="h-12 w-12 text-red-500" />
                <p className="text-lg font-medium text-red-600">{t('failed')}</p>
                <Button variant="outline" onClick={() => setUploadStatus('idle')}>
                  {t('retry')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">{t('dropzone')}</p>
                  <Button variant="link" className="mt-2">
                    {t('selectFile')}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('supportedFormats')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 最近の取り込み履歴 */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>{t('recentImports')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {t('noImportHistory')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
