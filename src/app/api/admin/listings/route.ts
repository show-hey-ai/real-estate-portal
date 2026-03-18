import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
    try {
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

        const body = await req.json()

        // Create listing with media using Prisma
        const listing = await prisma.listing.create({
            data: {
                propertyType: body.propertyType,
                price: body.price ? BigInt(body.price) : null,
                addressPublic: body.addressPublic,
                addressPrivate: body.addressPrivate,
                addressBlocked: false, // Manual entry assumed valid
                prefecture: body.prefecture,
                city: body.city,
                stations: body.stations ? JSON.parse(JSON.stringify(body.stations)) : undefined, // Ensure JSON compatibility
                landArea: body.landArea ? parseFloat(body.landArea) : null,
                buildingArea: body.buildingArea ? parseFloat(body.buildingArea) : null,
                floorCount: body.floorCount ? parseInt(body.floorCount) : null,
                builtYear: body.builtYear ? parseInt(body.builtYear) : null,
                builtMonth: body.builtMonth ? parseInt(body.builtMonth) : null,
                structure: body.structure,
                zoning: body.zoning,
                yieldGross: body.yieldGross ? parseFloat(body.yieldGross) : null,
                yieldNet: body.yieldNet ? parseFloat(body.yieldNet) : null,
                currentStatus: body.currentStatus,
                status: body.status || 'DRAFT',
                createdById: dbUser.id,
                media: {
                    create: (body.images || []).map((url: string, index: number) => ({
                        url,
                        category: 'OTHER', // Default category
                        source: 'MANUAL',
                        isAdopted: true,
                        sortOrder: index,
                    }))
                }
            },
        })

        // Serialize BigInt for JSON response
        const responseData = JSON.parse(JSON.stringify(listing, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ))

        return NextResponse.json(responseData)
    } catch (err) {
        console.error('Unexpected error:', err)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
