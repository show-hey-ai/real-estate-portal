import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminLeadUpdateSchema } from '@/lib/admin-validation'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const { id } = await params
    const existingLead = await prisma.lead.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => null)
    const parsed = adminLeadUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.adminNotes !== undefined && { adminNotes: parsed.data.adminNotes }),
      },
    })

    return NextResponse.json(lead)
  } catch (error) {
    console.error('Lead update error:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    )
  }
}
