import { NextResponse } from 'next/server'
import { getLoginMethods } from '@/lib/login-methods-server'

export async function GET() {
  return NextResponse.json(await getLoginMethods(), { headers: { 'Cache-Control': 'public, max-age=60', 'X-Content-Type-Options': 'nosniff' } })
}
