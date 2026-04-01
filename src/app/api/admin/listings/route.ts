import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatPublicAddress } from '@/lib/address'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminListingCreateSchema } from '@/lib/admin-validation'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const body = await req.json().catch(() => null)
    const parsed = adminListingCreateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const addressResult = formatPublicAddress(input.addressPublic)

    if (input.status === 'PUBLISHED' && addressResult.isBlocked) {
      return NextResponse.json(
        { error: '公開住所に番地パターンが含まれています。丁目までに修正してください。' },
        { status: 400 }
      )
    }

    const manualImages = input.images || []
    const listing = await prisma.listing.create({
      data: {
        propertyType: input.propertyType,
        price: BigInt(Math.trunc(input.price)),
        addressPublic: addressResult.publicAddress || input.addressPublic,
        addressPrivate: input.addressPrivate,
        addressBlocked: addressResult.isBlocked,
        prefecture: input.prefecture || null,
        city: input.city || null,
        stations: input.stations?.length ? input.stations : undefined,
        landArea: input.landArea ?? null,
        buildingArea: input.buildingArea ?? null,
        floorCount: input.floorCount ?? null,
        builtYear: input.builtYear ?? null,
        builtMonth: input.builtMonth ?? null,
        structure: input.structure || null,
        zoning: input.zoning || null,
        yieldGross: input.yieldGross ?? null,
        yieldNet: input.yieldNet ?? null,
        currentStatus: input.currentStatus || null,
        infoRegisteredAt: input.infoRegisteredAt ? new Date(input.infoRegisteredAt) : null,
        infoUpdatedAt: input.infoUpdatedAt ? new Date(input.infoUpdatedAt) : null,
        conditionsExpiry: input.conditionsExpiry ? new Date(input.conditionsExpiry) : null,
        deliveryDate: input.deliveryDate || null,
        descriptionJa: input.descriptionJa || null,
        descriptionEn: input.descriptionEn || null,
        descriptionZhTw: input.descriptionZhTw || null,
        descriptionZhCn: input.descriptionZhCn || null,
        status: input.status || 'DRAFT',
        publishedAt: input.status === 'PUBLISHED' ? new Date() : null,
        createdById: auth.user.id,
        media: {
          create: manualImages.map((url, index) => ({
            url,
            category: 'OTHER',
            source: 'MANUAL',
            isAdopted: true,
            sortOrder: index,
          })),
        },
      },
    })

    const responseData = JSON.parse(
      JSON.stringify(listing, (_key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    )

    return NextResponse.json(responseData)
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const body = await req.json().catch(() => null)
    const ids: string[] = body?.ids
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids is required' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.extractionEvidence.deleteMany({ where: { listingId: { in: ids } } })
      await tx.media.deleteMany({ where: { listingId: { in: ids } } })
      await tx.favorite.deleteMany({ where: { listingId: { in: ids } } })
      await tx.lead.deleteMany({ where: { listingId: { in: ids } } })
      await tx.listing.deleteMany({ where: { id: { in: ids } } })
    })

    await prisma.adminLog.create({
      data: {
        adminId: auth.user.id,
        action: 'bulk_delete',
        targetType: 'listing',
        targetId: ids.join(','),
      },
    })

    return NextResponse.json({ success: true, deleted: ids.length })
  } catch (err) {
    console.error('Bulk delete error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
