'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react'

interface FileResult {
  filename: string
  status: 'pending' | 'uploading' | 'success' | 'skipped' | 'error'
  message?: string
  listingId?: string
}

export default function AdminImportPage() {
  const t = useTranslations('admin.import')
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<FileResult[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleUploadMultiple(files)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleUploadMultiple(Array.from(files))
    }
    // Reset input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUploadMultiple = async (files: File[]) => {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    const validFiles = files.filter(f => {
      if (!validTypes.includes(f.type)) {
        toast.error(`${f.name}: 対応していないファイル形式です`)
        return false
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name}: ファイルサイズが大きすぎます（50MB上限）`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setIsProcessing(true)
    const initialResults: FileResult[] = validFiles.map(f => ({
      filename: f.name,
      status: 'pending',
    }))
    setResults(initialResults)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i]

      setResults(prev => prev.map((r, idx) =>
        idx === i ? { ...r, status: 'uploading' } : r
      ))

      try {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/admin/import', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.details || data.error || 'Upload failed')
        }

        if (data.skipped) {
          skipCount++
          setResults(prev => prev.map((r, idx) =>
            idx === i ? { ...r, status: 'skipped', message: data.reason || '広告不可のためスキップ' } : r
          ))
        } else {
          successCount++
          setResults(prev => prev.map((r, idx) =>
            idx === i ? { ...r, status: 'success', listingId: data.listingId } : r
          ))
        }
      } catch (err) {
        errorCount++
        const errorMsg = err instanceof Error ? err.message : 'エラー'
        setResults(prev => prev.map((r, idx) =>
          idx === i ? { ...r, status: 'error', message: errorMsg } : r
        ))
      }
    }

    setIsProcessing(false)

    const parts: string[] = []
    if (successCount > 0) parts.push(`${successCount}件取り込み`)
    if (skipCount > 0) parts.push(`${skipCount}件スキップ`)
    if (errorCount > 0) parts.push(`${errorCount}件エラー`)

    if (successCount > 0) {
      toast.success(parts.join('、'))
    } else if (skipCount > 0) {
      toast.info(parts.join('、'))
    } else {
      toast.error(parts.join('、'))
    }
  }

  const getStatusIcon = (status: FileResult['status']) => {
    switch (status) {
      case 'pending': return <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
      case 'uploading': return <Loader2 className="h-5 w-5 text-primary animate-spin" />
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'skipped': return <AlertTriangle className="h-5 w-5 text-amber-500" />
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const successResults = results.filter(r => r.status === 'success')

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
              ${isProcessing ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              disabled={isProcessing}
            />

            <div className="flex flex-col items-center gap-4">
              <Upload className="h-12 w-12 text-muted-foreground" />
              <div>
                <p className="text-lg font-medium">
                  PDFをドラッグ＆ドロップ（複数OK）
                </p>
                <Button variant="link" className="mt-2">
                  {t('selectFile')}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                PDF / PNG / JPG（50MBまで）・広告不可の物件は自動スキップ
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 処理結果 */}
      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                処理結果（{results.length}件）
              </span>
              {!isProcessing && successResults.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => router.push('/admin/listings')}
                >
                  物件一覧を確認
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-md text-sm ${
                    r.status === 'success' ? 'bg-green-50' :
                    r.status === 'skipped' ? 'bg-amber-50' :
                    r.status === 'error' ? 'bg-red-50' :
                    'bg-muted/30'
                  }`}
                >
                  {getStatusIcon(r.status)}
                  <span className="font-mono text-xs truncate max-w-[300px]">
                    {r.filename}
                  </span>
                  {r.status === 'success' && (
                    <span className="text-green-600 font-medium">取り込み完了</span>
                  )}
                  {r.status === 'skipped' && (
                    <span className="text-amber-600">{r.message}</span>
                  )}
                  {r.status === 'error' && (
                    <span className="text-red-600">{r.message}</span>
                  )}
                  {r.status === 'uploading' && (
                    <span className="text-muted-foreground">処理中...</span>
                  )}
                  {r.status === 'success' && r.listingId && (
                    <Button
                      variant="link"
                      size="sm"
                      className="ml-auto text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/listings/${r.listingId}/review`)
                      }}
                    >
                      レビュー
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {!isProcessing && (
              <div className="mt-4 pt-4 border-t flex gap-4 text-sm">
                <span className="text-green-600">
                  取り込み: {results.filter(r => r.status === 'success').length}件
                </span>
                <span className="text-amber-600">
                  スキップ: {results.filter(r => r.status === 'skipped').length}件
                </span>
                <span className="text-red-600">
                  エラー: {results.filter(r => r.status === 'error').length}件
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
