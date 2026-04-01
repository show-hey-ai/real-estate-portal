import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatPublicAddress } from '@/lib/address'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminListingUpdateSchema } from '@/lib/admin-validation'

interface Media {
  id: string
  url: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const { id } = await params
    const existingListing = await prisma.listing.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        propertyType: true,
        price: true,
        addressPublic: true,
      },
    })

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const parsed = adminListingUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const input = parsed.data
    const hasField = (field: string) =>
      !!body &&
      typeof body === 'object' &&
      Object.prototype.hasOwnProperty.call(body, field)

    const effectiveStatus = input.status || existingListing.status
    const effectivePropertyType = hasField('propertyType')
      ? input.propertyType ?? null
      : existingListing.propertyType
    const effectivePrice = hasField('price')
      ? input.price ?? null
      : (existingListing.price !== null ? Number(existingListing.price) : null)
    const effectiveAddress = hasField('addressPublic')
      ? input.addressPublic ?? null
      : existingListing.addressPublic
    const addressResult = formatPublicAddress(effectiveAddress)

    if (effectiveStatus === 'PUBLISHED') {
      if (!effectivePropertyType || effectivePrice === null || !effectiveAddress) {
        return NextResponse.json(
          { error: '公開には物件種別・価格・公開住所が必要です。' },
          { status: 400 }
        )
      }

      if (addressResult.isBlocked) {
        return NextResponse.json(
          { error: '公開住所に番地パターンが含まれています。丁目までに修正してください。' },
          { status: 400 }
        )
      }
    }

    const listing = await prisma.$transaction(async (tx) => {
      const updated = await tx.listing.update({
        where: { id },
        data: {
          propertyType: hasField('propertyType') ? input.propertyType ?? null : undefined,
          price: hasField('price')
            ? (input.price !== undefined ? BigInt(Math.trunc(input.price)) : null)
            : undefined,
          addressPublic: hasField('addressPublic') ? addressResult.publicAddress || null : undefined,
          addressPrivate: hasField('addressPrivate') ? input.addressPrivate ?? null : undefined,
          addressBlocked: hasField('addressPublic') ? addressResult.isBlocked : undefined,
          prefecture: hasField('prefecture') ? input.prefecture ?? null : undefined,
          city: hasField('city') ? input.city ?? null : undefined,
          stations: hasField('stations') ? input.stations ?? [] : undefined,
          landArea: hasField('landArea') ? input.landArea ?? null : undefined,
          buildingArea: hasField('buildingArea') ? input.buildingArea ?? null : undefined,
          floorCount: hasField('floorCount') ? input.floorCount ?? null : undefined,
          builtYear: hasField('builtYear') ? input.builtYear ?? null : undefined,
          builtMonth: hasField('builtMonth') ? input.builtMonth ?? null : undefined,
          structure: hasField('structure') ? input.structure ?? null : undefined,
          zoning: hasField('zoning') ? input.zoning ?? null : undefined,
          currentStatus: hasField('currentStatus') ? input.currentStatus ?? null : undefined,
          infoRegisteredAt: hasField('infoRegisteredAt')
            ? (input.infoRegisteredAt ? new Date(input.infoRegisteredAt) : null)
            : undefined,
          infoUpdatedAt: hasField('infoUpdatedAt')
            ? (input.infoUpdatedAt ? new Date(input.infoUpdatedAt) : null)
            : undefined,
          conditionsExpiry: hasField('conditionsExpiry')
            ? (input.conditionsExpiry ? new Date(input.conditionsExpiry) : null)
            : undefined,
          deliveryDate: hasField('deliveryDate') ? input.deliveryDate ?? null : undefined,
          yieldGross: hasField('yieldGross') ? input.yieldGross ?? null : undefined,
          yieldNet: hasField('yieldNet') ? input.yieldNet ?? null : undefined,
          descriptionJa: hasField('descriptionJa') ? input.descriptionJa ?? null : undefined,
          descriptionEn: hasField('descriptionEn') ? input.descriptionEn ?? null : undefined,
          descriptionZhTw: hasField('descriptionZhTw') ? input.descriptionZhTw ?? null : undefined,
          descriptionZhCn: hasField('descriptionZhCn') ? input.descriptionZhCn ?? null : undefined,
          adminNotes: hasField('adminNotes') ? input.adminNotes ?? null : undefined,
          adAllowed: hasField('adAllowed') ? input.adAllowed ?? false : undefined,
          status: input.status || undefined,
          publishedAt: input.status === 'PUBLISHED' && existingListing.status !== 'PUBLISHED'
            ? new Date()
            : undefined,
        },
      })

      if (input.images) {
        const existingMedia = await tx.media.findMany({
          where: { listingId: id, source: 'MANUAL' },
        })

        const newUrls = new Set(input.images)
        const existingUrls = new Set(existingMedia.map((media) => media.url))
        const toCreate = input.images.filter((url) => !existingUrls.has(url))

        if (toCreate.length > 0) {
          await tx.media.createMany({
            data: toCreate.map((url, index) => ({
              listingId: id,
              url,
              category: 'OTHER',
              source: 'MANUAL',
              isAdopted: true,
              sortOrder: index,
            })),
          })
        }

        const toDelete = existingMedia.filter((media: Media) => !newUrls.has(media.url))
        if (toDelete.length > 0) {
          await tx.media.deleteMany({
            where: { id: { in: toDelete.map((media: Media) => media.id) } },
          })
        }
      }

      if (input.adoptedMediaIds) {
        await tx.media.updateMany({
          where: { listingId: id },
          data: { isAdopted: false },
        })

        if (input.adoptedMediaIds.length > 0) {
          await tx.media.updateMany({
            where: {
              id: { in: input.adoptedMediaIds },
              listingId: id,
            },
            data: { isAdopted: true },
          })
        }
      }

      return updated
    })

    await prisma.adminLog.create({
      data: {
        adminId: auth.user.id,
        action: input.status === 'PUBLISHED' ? 'publish' : 'update',
        targetType: 'listing',
        targetId: listing.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Listing update error:', error)
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const { id } = await params
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { id: true, managementId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.extractionEvidence.deleteMany({ where: { listingId: id } })
      await tx.media.deleteMany({ where: { listingId: id } })
      await tx.favorite.deleteMany({ where: { listingId: id } })
      await tx.lead.deleteMany({ where: { listingId: id } })
      await tx.listing.delete({ where: { id } })
    })

    await prisma.adminLog.create({
      data: {
        adminId: auth.user.id,
        action: 'delete',
        targetType: 'listing',
        targetId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Listing delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    )
  }
}
