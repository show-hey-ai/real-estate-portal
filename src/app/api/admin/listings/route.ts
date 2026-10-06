import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatPublicAddress } from '@/lib/address'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminListingCreateSchema } from '@/lib/admin-validation'
import { PORTAL_VENTURE_ID, AUTONOMY_VERSION } from '@/lib/autonomy/policy'

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
    const addressResult = formatPublicAddress(input.addressPublic, input)

    if (input.status === 'PUBLISHED' && (input.adAllowed !== true || input.adConsentRequired === true)) {
      return NextResponse.json({ error: '広告不可・広告未確認・承諾待ちの物件は一般公開できません。非公開で保存してください。' }, { status: 400 })
    }

    if (input.status === 'PUBLISHED' && addressResult.isBlocked) {
      return NextResponse.json(
        { error: '公開許可と公開用住所の内容を確認してください。' },
        { status: 400 }
      )
    }

    const manualImages = input.images || []
    const listing = await prisma.listing.create({
      data: {
        propertyType: input.propertyType,
        hospitalityCategory: input.hospitalityCategory ?? null,
        price: BigInt(Math.trunc(input.price)),
        addressPublic: addressResult.publicAddress || input.addressPublic,
        addressPrivate: input.addressPrivate,
        addressBlocked: addressResult.isBlocked,
        adAllowed: input.adAllowed ?? false,
        adConsentRequired: input.adConsentRequired ?? false,
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
      await tx.$queryRaw`SELECT id FROM autonomy_policies WHERE id=${PORTAL_VENTURE_ID} FOR UPDATE`
      const sources = await tx.listing.findMany({ where: { id: { in: ids }, sourcePropertyId: { not: null } }, select: { id: true, sourcePropertyId: true } })
      for (const source of sources) await tx.autonomyRecord.upsert({ where: { ventureId_dedupeKey: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `source-override:${source.sourcePropertyId}` } }, create: { ventureId: PORTAL_VENTURE_ID, dedupeKey: `source-override:${source.sourcePropertyId}`, recordType: 'operator_override', title: 'Bulk-deleted source listing will not be recreated automatically', content: { listingId: source.id, actorId: auth.user.id }, sources: [source.sourcePropertyId!], verification: 'verified', version: AUTONOMY_VERSION }, update: {} })
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
