'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Trash2, Save, Upload, X } from 'lucide-react'

// Zod Schema for Validation
const stationSchema = z.object({
    name: z.string().min(1, '駅名は必須です'),
    line: z.string().optional(),
    walk_minutes: z.coerce.number().min(0).optional().nullable(),
})

const listingSchema = z.object({
    propertyType: z.string().min(1, '物件種別を選択してください'),
    price: z.coerce.number().min(0, '価格は0以上で入力してください'),
    addressPublic: z.string().min(1, '公開住所は必須です'),
    addressPrivate: z.string().min(1, '管理用住所は必須です'),
    prefecture: z.string().optional(),
    city: z.string().optional(),
    stations: z.array(stationSchema).optional(),
    landArea: z.coerce.number().min(0).optional(),
    buildingArea: z.coerce.number().min(0).optional(),
    floorCount: z.coerce.number().int().min(1).optional(),
    builtYear: z.coerce.number().int().min(1900).optional(),
    builtMonth: z.coerce.number().int().min(1).max(12).optional(),
    structure: z.string().optional(),
    zoning: z.string().optional(),
    yieldGross: z.coerce.number().min(0).optional(),
    yieldNet: z.coerce.number().min(0).optional(),
    currentStatus: z.string().optional(),
    infoRegisteredAt: z.string().optional(),
    infoUpdatedAt: z.string().optional(),
    conditionsExpiry: z.string().optional(),
    deliveryDate: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'REVIEWED', 'ARCHIVED']).default('DRAFT'),
    images: z.array(z.string()).optional(),
})

export type ListingFormValues = z.infer<typeof listingSchema>

interface ListingFormProps {
    initialData?: Partial<ListingFormValues>
    mode?: 'create' | 'edit'
}

const PROPERTY_TYPES = [
    '区分マンション',
    '一棟マンション',
    '一棟アパート',
    '戸建',
    '土地',
    '店舗・事務所',
    'その他',
]

const STRUCTURES = ['RC', 'SRC', 'S', '木造', '軽量鉄骨', 'その他']

export function ListingForm({ initialData, mode = 'create' }: ListingFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const defaultValues: Partial<ListingFormValues> = {
        status: 'DRAFT',
        stations: [{ name: '', line: '', walk_minutes: null }],
        images: [],
        ...initialData,
    }

    const form = useForm<ListingFormValues>({
        resolver: zodResolver(listingSchema) as any, // Temporary casting to resolve strict type mismatch
        defaultValues,
    })

    const { fields: stationFields, append: appendStation, remove: removeStation } = useFieldArray({
        control: form.control,
        name: 'stations',
    })

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return

        const file = e.target.files[0]
        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/api/admin/media/upload', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) throw new Error('Upload failed')

            const { url } = await res.json()
            const currentImages = form.getValues('images') || []
            form.setValue('images', [...currentImages, url])
            toast.success('画像をアップロードしました')
        } catch (error) {
            console.error(error)
            toast.error('アップロードに失敗しました')
        }
    }

    const removeImage = (index: number) => {
        const currentImages = form.getValues('images') || []
        const newImages = currentImages.filter((_, i) => i !== index)
        form.setValue('images', newImages)
    }

    const onSubmit = async (data: ListingFormValues) => {
        setIsSubmitting(true)
        try {
            const endpoint = mode === 'create' ? '/api/admin/listings' : `/api/admin/listings/${(initialData as any)?.id}`
            const method = mode === 'create' ? 'POST' : 'PATCH'

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!res.ok) {
                throw new Error('Failed to save listing')
            }

            toast.success(mode === 'create' ? '物件を作成しました' : '物件を更新しました')
            if (mode === 'create') {
                router.push('/admin/listings')
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error(error)
            toast.error('保存に失敗しました')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">
                    {mode === 'create' ? '物件新規登録' : '物件編集'}
                </h1>
                <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    保存する
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* 基本情報 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>基本情報</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>物件種別 <span className="text-red-500">*</span></Label>
                                    <Select
                                        onValueChange={(val) => form.setValue('propertyType', val)}
                                        defaultValue={form.getValues('propertyType')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="選択してください" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROPERTY_TYPES.map((type) => (
                                                <SelectItem key={type} value={type}>{type}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.propertyType && (
                                        <p className="text-sm text-red-500">{form.formState.errors.propertyType.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>価格（円） <span className="text-red-500">*</span></Label>
                                    <Input type="number" {...form.register('price')} />
                                    {form.formState.errors.price && (
                                        <p className="text-sm text-red-500">{form.formState.errors.price.message}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>公開用住所（市町村・丁目まで） <span className="text-red-500">*</span></Label>
                                <Input {...form.register('addressPublic')} placeholder="東京都渋谷区神南1丁目" />
                                {form.formState.errors.addressPublic && (
                                    <p className="text-sm text-red-500">{form.formState.errors.addressPublic.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>管理用住所（詳細・番地/号） <span className="text-red-500">*</span></Label>
                                <Input {...form.register('addressPrivate')} placeholder="東京都渋谷区神南1-2-3 メゾン渋谷101" />
                                {form.formState.errors.addressPrivate && (
                                    <p className="text-sm text-red-500">{form.formState.errors.addressPrivate.message}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* スペック情報 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>スペック</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>土地面積（㎡）</Label>
                                    <Input type="number" step="0.01" {...form.register('landArea')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>建物面積（㎡）</Label>
                                    <Input type="number" step="0.01" {...form.register('buildingArea')} />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>築年 (西暦)</Label>
                                    <Input type="number" placeholder="1990" {...form.register('builtYear')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>築月</Label>
                                    <Select
                                        onValueChange={(val) => form.setValue('builtMonth', parseInt(val))}
                                        defaultValue={form.getValues('builtMonth')?.toString()}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="-" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                                <SelectItem key={m} value={m.toString()}>{m}月</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>構造</Label>
                                    <Select
                                        onValueChange={(val) => form.setValue('structure', val)}
                                        defaultValue={form.getValues('structure')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="-" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STRUCTURES.map((s) => (
                                                <SelectItem key={s} value={s}>{s}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>表面利回り (%)</Label>
                                    <Input type="number" step="0.01" {...form.register('yieldGross')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>実質利回り (%)</Label>
                                    <Input type="number" step="0.01" {...form.register('yieldNet')} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 表示規約必須項目 */}
                    <Card>
                        <CardHeader>
                            <CardTitle>表示規約必須項目</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>情報登録日</Label>
                                    <Input type="date" {...form.register('infoRegisteredAt')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>情報更新日</Label>
                                    <Input type="date" {...form.register('infoUpdatedAt')} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>取引条件の有効期限</Label>
                                    <Input type="date" {...form.register('conditionsExpiry')} />
                                </div>
                                <div className="space-y-2">
                                    <Label>引渡し可能時期</Label>
                                    <Input {...form.register('deliveryDate')} placeholder="即時、相談、2026年4月 等" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* 最寄駅 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>最寄駅</span>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => appendStation({ name: '', line: '', walk_minutes: null })}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {stationFields.map((field, index) => (
                                <div key={field.id} className="space-y-2 p-3 border rounded bg-muted/20 relative">
                                    <Input {...form.register(`stations.${index}.name`)} placeholder="駅名 (例: 渋谷)" />
                                    <Input {...form.register(`stations.${index}.line`)} placeholder="路線名 (例: 山手線)" />
                                    <div className="flex gap-2">
                                        <Input type="number" {...form.register(`stations.${index}.walk_minutes`)} placeholder="徒歩分" />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeStation(index)} className="shrink-0 text-red-500">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* 画像アップロード */}
                    <Card>
                        <CardHeader>
                            <CardTitle>画像</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                {form.watch('images')?.map((url, index) => (
                                    <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden border">
                                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <label className="flex flex-col items-center justify-center aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                                    <span className="text-sm text-muted-foreground">画像をアップロード</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                </label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ステータス */}
                    <Card>
                        <CardHeader>
                            <CardTitle>公開設定</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label>ステータス</Label>
                                <Select
                                    onValueChange={(val: any) => form.setValue('status', val)}
                                    defaultValue={form.getValues('status')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">下書き</SelectItem>
                                        <SelectItem value="PUBLISHED">公開中</SelectItem>
                                        <SelectItem value="ARCHIVED">アーカイブ</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </form>
    )
}
