import { NextRequest, NextResponse } from 'next/server'
import { hasSchedulerAuthorization } from '@/lib/autonomy/auth'
import { runAutonomyTick } from '@/lib/autonomy/runner'

export const runtime = 'nodejs'
export const maxDuration = 120
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasSchedulerAuthorization(request.headers.get('authorization'))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try { return NextResponse.json(await runAutonomyTick()) }
  catch { return NextResponse.json({ error: 'Autonomy runtime is unavailable. Check the database migration and connection.' }, { status: 503 }) }
}
