import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: listings } = await supabase.from('listings').select('id, sourcePdfUrl, addressPublic, price').eq('status', 'PUBLISHED')
  const { data: media } = await supabase.from('media').select('listingId').eq('isAdopted', true)
  const mediaSet = new Set(media!.map(m => m.listingId))
  const noImg = listings!.filter(l => !mediaSet.has(l.id))
  console.log(`画像なし: ${noImg.length}件`)
  noImg.forEach(l => console.log(l.id, l.price, l.addressPublic || 'no-addr', l.sourcePdfUrl ? 'has-pdf' : 'no-pdf'))
}
main()
