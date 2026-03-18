import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'
import { formatPublicAddress } from '@/lib/address'

interface Station {
  name: string
  line?: string | null
  walk_minutes?: number | null
}

interface Media {
  id: string
  url: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: authUser.email! },
  })

  if (!dbUser || dbUser.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await request.json()

  const {
    propertyType,
    price,
    addressPublic,
    addressPrivate,
    prefecture,
    city,
    stations,
    landArea,
    buildingArea,
    floorCount,
    builtYear,
    builtMonth,
    structure,
    zoning,
    currentStatus,
    yieldGross,
    yieldNet,
    descriptionJa,
    descriptionEn,
    descriptionZhTw,
    descriptionZhCn,
    adoptedMediaIds,
    status,
    images,
  } = body

  // 公開住所のバリデーション（番地チェック）
  const addressResult = formatPublicAddress(addressPublic)
  if (status === 'PUBLISHED' && addressResult.isBlocked) {
    return NextResponse.json(
      { error: '公開住所に番地パターンが含まれています。丁目までに修正してください。' },
      { status: 400 }
    )
  }

  // トランザクションで更新
  const listing = await prisma.$transaction(async (tx) => {
    // 物件情報更新
    const updated = await tx.listing.update({
      where: { id },
      data: {
        propertyType: propertyType || null,
        price: price ? BigInt(price) : null,
        addressPublic: addressPublic || null,
        addressPrivate: addressPrivate || null,
        addressBlocked: addressResult.isBlocked,
        prefecture: prefecture || null,
        city: city || null,
        stations: JSON.parse(JSON.stringify(stations || [])),
        landArea: landArea ? parseFloat(landArea) : null,
        buildingArea: buildingArea ? parseFloat(buildingArea) : null,
        floorCount: floorCount ? parseInt(floorCount) : null,
        builtYear: builtYear ? parseInt(builtYear) : null,
        builtMonth: builtMonth ? parseInt(builtMonth) : null,
        structure: structure || null,
        zoning: zoning || null,
        currentStatus: currentStatus || null,
        yieldGross: yieldGross ? parseFloat(yieldGross) : null,
        yieldNet: yieldNet ? parseFloat(yieldNet) : null,
        descriptionJa: descriptionJa !== undefined ? descriptionJa || null : undefined,
        descriptionEn: descriptionEn !== undefined ? descriptionEn || null : undefined,
        descriptionZhTw: descriptionZhTw !== undefined ? descriptionZhTw || null : undefined,
        descriptionZhCn: descriptionZhCn !== undefined ? descriptionZhCn || null : undefined,
        status: status || undefined,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
      },
    })

    // 画像の処理 (manual update support)
    // ListingForm sends 'images' as array of URLs
    if (images && Array.isArray(images)) {
      // Get existing Manual Media
      const existingMedia = await tx.media.findMany({
        where: { listingId: id, source: 'MANUAL' }
      })

      const newUrls = new Set(images as string[])
      const existingUrls = new Set(existingMedia.map((m: Media) => m.url))

      // Create new
      const toCreate = (images as string[]).filter((url: string) => !existingUrls.has(url))
      if (toCreate.length > 0) {
        await tx.media.createMany({
          data: toCreate.map((url: string) => ({
            listingId: id,
            url,
            category: 'OTHER',
            source: 'MANUAL',
            isAdopted: true,
            sortOrder: 0
          }))
        })
      }

      // Delete removed
      const toDelete = existingMedia.filter((m: Media) => !newUrls.has(m.url))
      if (toDelete.length > 0) {
        await tx.media.deleteMany({
          where: { id: { in: toDelete.map((m: Media) => m.id) } }
        })
      }
    }

    // 画像の採用状態を更新 (ReviewForm support - legacy behavior for Extracted media)
    if (adoptedMediaIds) {
      // 全ての画像を未採用に
      await tx.media.updateMany({
        where: { listingId: id },
        data: { isAdopted: false },
      })

      // 選択された画像を採用に
      if (adoptedMediaIds.length > 0) {
        await tx.media.updateMany({
          where: {
            id: { in: adoptedMediaIds },
            listingId: id,
          },
          data: { isAdopted: true },
        })
      }
    }

    return updated
  })

  // 管理者ログ
  await prisma.adminLog.create({
    data: {
      adminId: dbUser.id,
      action: status === 'PUBLISHED' ? 'publish' : 'update',
      targetType: 'listing',
      targetId: listing.id,
    },
  })

  return NextResponse.json({ success: true })
}
