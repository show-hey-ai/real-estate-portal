import { resolve } from 'path'
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: resolve(process.cwd(), '.env') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const { data, error } = await supabase
    .from('listings')
    .select('managementId, price, adAllowed, sourcePdfUrl')
    .eq('adAllowed', true)
    .order('managementId', { ascending: true })

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  }

  console.log(`adAllowed=true の物件: ${data.length}件\n`)
  for (const l of data) {
    const price = l.price ? `¥${(l.price / 10000).toLocaleString()}万` : '未設定'
    console.log(`${l.managementId} | ${price} | ${l.sourcePdfUrl}`)
  }
}

main()
