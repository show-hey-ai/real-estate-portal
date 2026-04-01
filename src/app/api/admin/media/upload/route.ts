
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { requireAdminUser } from '@/lib/admin-auth'
import { validateAdminMediaUploadFile } from '@/lib/admin-validation'

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdminUser()
    if (!auth.ok) return auth.response

    const supabase = await createClient()
    const formData = await req.formData()
    const fileValue = formData.get('file')
    const file = fileValue instanceof File ? fileValue : null
    const validationError = validateAdminMediaUploadFile(file)

    if (validationError || !file) {
      return NextResponse.json(
        { error: validationError || 'No file provided' },
        { status: 400 }
      )
    }

    const fileExt = file.name.includes('.') ? file.name.split('.').pop()?.toLowerCase() : 'bin'
    const fileName = `${uuidv4()}.${fileExt || 'bin'}`
    const filePath = `listings/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('listings')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('listings').getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      path: filePath,
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
