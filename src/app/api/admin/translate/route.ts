import { NextRequest, NextResponse } from 'next/server'
import { translateDescription } from '@/lib/openai'
import { requireAdminUser } from '@/lib/admin-auth'
import { adminTranslateRequestSchema } from '@/lib/admin-validation'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const body = await request.json().catch(() => null)
    const parsed = adminTranslateRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid request body' },
        { status: 400 }
      )
    }

    const translations = await translateDescription(parsed.data.text)

    return NextResponse.json(translations)
  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    )
  }
}
