'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { CheckCircle, XCircle, AlertTriangle, Save, Eye, Plus, Trash2, FileText, Languages, RefreshCw } from 'lucide-react'

interface Station {
  name: string
  line?: string | null
  walk_minutes?: number | null
}

interface Evidence {
  id: string
  fieldName: string
  rawText: string | null
  pageNumber: number | null
  confidence: string | null
  needsReview: boolean
}

interface Media {
  id: string
  url: string
  category: string
  isAdopted: boolean
  sortOrder: number
}

interface ListingData {
  id: string
  status: string
  propertyType: string | null
  price: string | null
  addressPublic: string | null
  addressPrivate: string | null
  addressBlocked: boolean
  prefecture: string | null
  city: string | null
  stations: Station[] | null
  landArea: string | null
  buildingArea: string | null
  floorCount: number | null
  builtYear: number | null
  builtMonth: number | null
  structure: string | null
  zoning: string | null
  currentStatus: string | null
  yieldGross: string | null
  yieldNet: string | null
  infoRegisteredAt: string | null
  infoUpdatedAt: string | null
  conditionsExpiry: string | null
  deliveryDate: string | null
  warnings: string[] | null
  features: string[] | null
  descriptionJa: string | null
  descriptionEn: string | null
  descriptionZhTw: string | null
  descriptionZhCn: string | null
  extractionConfidence: string | null
  adAllowed: boolean
  sourcePdfUrl: string | null
  sourcePdfPages: number | null
  managementId: string | null
  media: Media[]
  evidences: Evidence[]
}

interface ReviewFormProps {
  listing: ListingData
}

const propertyTypes = [
  '区分マンション',
  '一棟マンション',
  '一棟アパート',
  '戸建',
  '土地',
  '店舗・事務所',
  'その他',
]

const structures = ['RC', 'SRC', 'S', '木造', '軽量鉄骨', 'その他']

export function ReviewForm({ listing }: ReviewFormProps) {
  const t = useTranslations('admin.review')
  const router = useRouter()

  const [formData, setFormData] = useState({
    propertyType: listing.propertyType || '',
    price: listing.price || '',
    addressPublic: listing.addressPublic || '',
    addressPrivate: listing.addressPrivate || '',
    prefecture: listing.prefecture || '',
    city: listing.city || '',
    landArea: listing.landArea || '',
    buildingArea: listing.buildingArea || '',
    floorCount: listing.floorCount?.toString() || '',
    builtYear: listing.builtYear?.toString() || '',
    builtMonth: listing.builtMonth?.toString() || '',
    structure: listing.structure || '',
    zoning: listing.zoning || '',
    currentStatus: listing.currentStatus || '',
    yieldGross: listing.yieldGross || '',
    yieldNet: listing.yieldNet || '',
    infoRegisteredAt: listing.infoRegisteredAt ? listing.infoRegisteredAt.slice(0, 10) : '',
    infoUpdatedAt: listing.infoUpdatedAt ? listing.infoUpdatedAt.slice(0, 10) : '',
    conditionsExpiry: listing.conditionsExpiry ? listing.conditionsExpiry.slice(0, 10) : '',
    deliveryDate: listing.deliveryDate || '',
    descriptionJa: listing.descriptionJa || '',
    descriptionEn: listing.descriptionEn || '',
    descriptionZhTw: listing.descriptionZhTw || '',
    descriptionZhCn: listing.descriptionZhCn || '',
    adAllowed: listing.adAllowed,
  })

  const [stations, setStations] = useState<Station[]>(
    (listing.stations as Station[]) || [{ name: '', line: '', walk_minutes: null }]
  )

  const [adoptedMedia, setAdoptedMedia] = useState<Set<string>>(
    new Set(listing.media.filter(m => m.isAdopted).map(m => m.id))
  )

  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [showEvidence, setShowEvidence] = useState(false)

  // 日本語から他言語を再翻訳
  const handleRetranslate = async () => {
    if (!formData.descriptionJa) {
      toast.error('日本語テキストを入力してください')
      return
    }

    setIsTranslating(true)
    try {
      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formData.descriptionJa }),
      })

      if (!res.ok) throw new Error()

      const data = await res.json()
      setFormData(prev => ({
        ...prev,
        descriptionEn: data.descriptionEn,
        descriptionZhTw: data.descriptionZhTw,
        descriptionZhCn: data.descriptionZhCn,
      }))
      toast.success('翻訳が完了しました')
    } catch {
      toast.error('翻訳に失敗しました')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleStationChange = (index: number, field: keyof Station, value: string | number | null) => {
    setStations(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addStation = () => {
    setStations(prev => [...prev, { name: '', line: '', walk_minutes: null }])
  }

  const removeStation = (index: number) => {
    setStations(prev => prev.filter((_, i) => i !== index))
  }

  const toggleMediaAdoption = (mediaId: string) => {
    setAdoptedMedia(prev => {
      const next = new Set(prev)
      if (next.has(mediaId)) {
        next.delete(mediaId)
      } else {
        next.add(mediaId)
      }
      return next
    })
  }

  const getConfidenceColor = (confidence: string | null) => {
    if (!confidence) return 'bg-gray-200'
    const value = parseFloat(confidence)
    if (value >= 0.8) return 'bg-green-500'
    if (value >= 0.5) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const publishChecks = [
    {
      key: 'price',
      label: t('checks.price'),
      passed: !!formData.price && formData.price !== '0',
    },
    {
      key: 'address',
      label: t('checks.address'),
      passed: !!formData.addressPublic,
    },
    {
      key: 'propertyType',
      label: t('checks.propertyType'),
      passed: !!formData.propertyType,
    },
    {
      key: 'images',
      label: t('checks.images'),
      passed: adoptedMedia.size >= 1,
    },
    {
      key: 'noFullAddress',
      label: t('checks.noFullAddress'),
      passed: !listing.addressBlocked || !!formData.addressPublic?.match(/^.+?\d+丁目$/),
    },
  ]

  const canPublish = publishChecks.every(check => check.passed)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const validStations = stations.filter(s => s.name.trim() !== '')
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stations: validStations,
          adoptedMediaIds: Array.from(adoptedMedia),
          status: 'REVIEWED',
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(t('saveSuccess'))
      router.refresh()
    } catch {
      toast.error(t('saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!canPublish) return

    setIsPublishing(true)
    try {
      const validStations = stations.filter(s => s.name.trim() !== '')
      const res = await fetch(`/api/admin/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stations: validStations,
          adoptedMediaIds: Array.from(adoptedMedia),
          status: 'PUBLISHED',
        }),
      })

      if (!res.ok) throw new Error()
      toast.success(t('publishSuccess'))
      router.push('/admin/listings')
    } catch {
      toast.error(t('publishFailed'))
    } finally {
      setIsPublishing(false)
    }
  }

  // エビデンスをフィールド名でグループ化
  const evidenceByField = listing.evidences.reduce((acc, ev) => {
    if (!acc[ev.fieldName]) acc[ev.fieldName] = []
    acc[ev.fieldName].push(ev)
    return acc
  }, {} as Record<string, Evidence[]>)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            {listing.managementId && (
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {listing.managementId}
              </span>
            )}
          </div>
          {listing.sourcePdfPages && listing.sourcePdfPages > 1 && (
            <p className="text-sm text-muted-foreground mt-1">
              PDF: {listing.sourcePdfPages}ページ
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowEvidence(!showEvidence)}
          >
            <FileText className="mr-2 h-4 w-4" />
            {showEvidence ? 'エビデンス非表示' : 'エビデンス表示'}
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {t('saveDraft')}
          </Button>
          <Button onClick={handlePublish} disabled={!canPublish || isPublishing}>
            <Eye className="mr-2 h-4 w-4" />
            {t('publish')}
          </Button>
        </div>
      </div>

      {/* 住所ブロック警告 */}
      {listing.addressBlocked && (
        <Card className="border-red-200 bg-red-50 mb-6">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                番地パターンが検出されました。公開住所を丁目までに修正してください。
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 左: PDFプレビュー */}
        <Card>
          <CardHeader>
            <CardTitle>{t('pdfPreview')}</CardTitle>
          </CardHeader>
          <CardContent>
            {listing.sourcePdfUrl ? (
              <iframe
                src={listing.sourcePdfUrl}
                className="w-full h-[600px] border rounded"
              />
            ) : (
              <div className="w-full h-[600px] bg-muted rounded flex items-center justify-center text-muted-foreground">
                PDFなし
              </div>
            )}
          </CardContent>
        </Card>

        {/* 右: 抽出データフォーム */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t('extractedData')}
                {listing.extractionConfidence && (
                  <Badge className={getConfidenceColor(listing.extractionConfidence)}>
                    {t('confidence')}: {(parseFloat(listing.extractionConfidence) * 100).toFixed(0)}%
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>物件種別</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(v) => handleChange('propertyType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showEvidence && evidenceByField['property_type'] && (
                    <EvidenceDisplay evidences={evidenceByField['property_type']} />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>価格（円）</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                  />
                  {showEvidence && evidenceByField['price'] && (
                    <EvidenceDisplay evidences={evidenceByField['price']} />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
                <Checkbox
                  id="adAllowed"
                  checked={formData.adAllowed}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, adAllowed: checked === true }))
                  }
                />
                <Label htmlFor="adAllowed" className="cursor-pointer flex items-center gap-2">
                  広告掲載可
                  {formData.adAllowed ? (
                    <Badge className="bg-emerald-500 text-white text-xs">可</Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">不可</Badge>
                  )}
                </Label>
              </div>

              <div className="space-y-2">
                <Label>
                  住所（公開用・丁目まで）
                  {listing.addressBlocked && (
                    <Badge variant="destructive" className="ml-2">要修正</Badge>
                  )}
                </Label>
                <Input
                  value={formData.addressPublic}
                  onChange={(e) => handleChange('addressPublic', e.target.value)}
                  className={listing.addressBlocked ? 'border-red-500' : ''}
                />
              </div>

              <div className="space-y-2">
                <Label>住所（管理用・フル）</Label>
                <Input
                  value={formData.addressPrivate}
                  onChange={(e) => handleChange('addressPrivate', e.target.value)}
                />
                {showEvidence && evidenceByField['address'] && (
                  <EvidenceDisplay evidences={evidenceByField['address']} />
                )}
              </div>

              {/* 最寄駅（複数対応） */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>最寄駅</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addStation}>
                    <Plus className="h-4 w-4 mr-1" />
                    駅を追加
                  </Button>
                </div>
                {stations.map((station, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="駅名"
                        value={station.name}
                        onChange={(e) => handleStationChange(index, 'name', e.target.value)}
                      />
                      <Input
                        placeholder="路線名"
                        value={station.line || ''}
                        onChange={(e) => handleStationChange(index, 'line', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="徒歩分"
                        value={station.walk_minutes || ''}
                        onChange={(e) => handleStationChange(index, 'walk_minutes', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    {stations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStation(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {showEvidence && evidenceByField['stations'] && (
                  <EvidenceDisplay evidences={evidenceByField['stations']} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>土地面積（㎡）</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.landArea}
                    onChange={(e) => handleChange('landArea', e.target.value)}
                  />
                  {showEvidence && evidenceByField['land_area'] && (
                    <EvidenceDisplay evidences={evidenceByField['land_area']} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>建物面積（㎡）</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.buildingArea}
                    onChange={(e) => handleChange('buildingArea', e.target.value)}
                  />
                  {showEvidence && evidenceByField['building_area'] && (
                    <EvidenceDisplay evidences={evidenceByField['building_area']} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>築年</Label>
                  <Input
                    type="number"
                    value={formData.builtYear}
                    onChange={(e) => handleChange('builtYear', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>築月</Label>
                  <Select
                    value={formData.builtMonth || 'none'}
                    onValueChange={(v) => handleChange('builtMonth', v === 'none' ? '' : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {m}月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>構造</Label>
                  <Select
                    value={formData.structure}
                    onValueChange={(v) => handleChange('structure', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {structures.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>階数</Label>
                  <Input
                    type="number"
                    value={formData.floorCount}
                    onChange={(e) => handleChange('floorCount', e.target.value)}
                  />
                </div>
              </div>
              {showEvidence && evidenceByField['built_year'] && (
                <EvidenceDisplay evidences={evidenceByField['built_year']} />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>表面利回り（%）</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.yieldGross}
                    onChange={(e) => handleChange('yieldGross', e.target.value)}
                  />
                  {showEvidence && evidenceByField['yield_gross'] && (
                    <EvidenceDisplay evidences={evidenceByField['yield_gross']} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>実質利回り（%）</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.yieldNet}
                    onChange={(e) => handleChange('yieldNet', e.target.value)}
                  />
                  {showEvidence && evidenceByField['yield_net'] && (
                    <EvidenceDisplay evidences={evidenceByField['yield_net']} />
                  )}
                </div>
              </div>

              {/* 表示規約必須項目 */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold text-orange-700">表示規約必須項目（2022年改正）</Label>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>情報登録日</Label>
                    <Input
                      type="date"
                      value={formData.infoRegisteredAt}
                      onChange={(e) => handleChange('infoRegisteredAt', e.target.value)}
                    />
                    {showEvidence && evidenceByField['info_registered_at'] && (
                      <EvidenceDisplay evidences={evidenceByField['info_registered_at']} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>情報更新日</Label>
                    <Input
                      type="date"
                      value={formData.infoUpdatedAt}
                      onChange={(e) => handleChange('infoUpdatedAt', e.target.value)}
                    />
                    {showEvidence && evidenceByField['info_updated_at'] && (
                      <EvidenceDisplay evidences={evidenceByField['info_updated_at']} />
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div className="space-y-2">
                    <Label>取引条件の有効期限</Label>
                    <Input
                      type="date"
                      value={formData.conditionsExpiry}
                      onChange={(e) => handleChange('conditionsExpiry', e.target.value)}
                    />
                    {showEvidence && evidenceByField['conditions_expiry'] && (
                      <EvidenceDisplay evidences={evidenceByField['conditions_expiry']} />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>引渡し可能時期</Label>
                    <Input
                      value={formData.deliveryDate}
                      onChange={(e) => handleChange('deliveryDate', e.target.value)}
                      placeholder="即時、相談、2026年4月 等"
                    />
                    {showEvidence && evidenceByField['delivery_date'] && (
                      <EvidenceDisplay evidences={evidenceByField['delivery_date']} />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 画像候補 */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t('images')} ({adoptedMedia.size}件採用)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {listing.media.length > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  {listing.media.map((media) => (
                    <div
                      key={media.id}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 ${
                        adoptedMedia.has(media.id)
                          ? 'border-primary'
                          : 'border-transparent'
                      }`}
                      onClick={() => toggleMediaAdoption(media.id)}
                    >
                      <img
                        src={media.url}
                        alt=""
                        className="w-full aspect-square object-cover"
                      />
                      <div className="absolute top-2 left-2">
                        <Checkbox checked={adoptedMedia.has(media.id)} />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                        {media.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  画像がありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* 公開チェック */}
          <Card>
            <CardHeader>
              <CardTitle>{t('publishCheck')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {publishChecks.map((check) => (
                  <li key={check.key} className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className={check.passed ? '' : 'text-red-500'}>
                      {check.label}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* 警告 */}
          {listing.warnings && listing.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  警告
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-yellow-800">
                  {(listing.warnings as string[]).map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* アピールポイント（4言語） */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  物件アピールポイント（4言語）
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetranslate}
                  disabled={isTranslating || !formData.descriptionJa}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${isTranslating ? 'animate-spin' : ''}`} />
                  {isTranslating ? '翻訳中...' : '再翻訳'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="ja" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="ja">🇯🇵 日本語</TabsTrigger>
                  <TabsTrigger value="en">🇺🇸 English</TabsTrigger>
                  <TabsTrigger value="zh-tw">🇹🇼 繁體中文</TabsTrigger>
                  <TabsTrigger value="zh-cn">🇨🇳 简体中文</TabsTrigger>
                </TabsList>
                <TabsContent value="ja" className="mt-4">
                  <Textarea
                    value={formData.descriptionJa}
                    onChange={(e) => handleChange('descriptionJa', e.target.value)}
                    placeholder="マイソクから抽出されたアピールポイント・物件紹介文"
                    rows={6}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    ※日本語を編集後「再翻訳」ボタンで他言語を更新できます
                  </p>
                </TabsContent>
                <TabsContent value="en" className="mt-4">
                  <Textarea
                    value={formData.descriptionEn}
                    onChange={(e) => handleChange('descriptionEn', e.target.value)}
                    placeholder="Property description in English"
                    rows={6}
                    className="resize-none"
                  />
                </TabsContent>
                <TabsContent value="zh-tw" className="mt-4">
                  <Textarea
                    value={formData.descriptionZhTw}
                    onChange={(e) => handleChange('descriptionZhTw', e.target.value)}
                    placeholder="繁體中文物件介紹"
                    rows={6}
                    className="resize-none"
                  />
                </TabsContent>
                <TabsContent value="zh-cn" className="mt-4">
                  <Textarea
                    value={formData.descriptionZhCn}
                    onChange={(e) => handleChange('descriptionZhCn', e.target.value)}
                    placeholder="简体中文房源介绍"
                    rows={6}
                    className="resize-none"
                  />
                </TabsContent>
              </Tabs>

              {/* アピールポイント（箇条書き） */}
              {listing.features && listing.features.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Label className="text-sm font-medium">抽出されたセールスポイント</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {listing.features.map((feature, i) => (
                      <Badge key={i} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// エビデンス表示コンポーネント
function EvidenceDisplay({ evidences }: { evidences: Evidence[] }) {
  return (
    <div className="text-xs bg-muted p-2 rounded space-y-1">
      {evidences.map((ev) => (
        <div key={ev.id} className="flex items-start gap-2">
          <Badge variant="outline" className="shrink-0">
            {ev.pageNumber ? `P${ev.pageNumber}` : '-'}
          </Badge>
          <span className="text-muted-foreground break-all">{ev.rawText}</span>
          {ev.confidence && (
            <Badge
              variant="secondary"
              className={`shrink-0 ${
                parseFloat(ev.confidence) >= 0.8
                  ? 'bg-green-100'
                  : parseFloat(ev.confidence) >= 0.5
                  ? 'bg-yellow-100'
                  : 'bg-red-100'
              }`}
            >
              {(parseFloat(ev.confidence) * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}
