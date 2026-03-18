import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
// import { prisma } from '@/lib/db' // Removed to bypass firewall
import { ReviewForm } from '@/components/admin/review-form'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // Prisma -> Supabase Client
  // include: media, evidences
  const { data: listing, error } = await supabase
    .from('listings')
    .select(`
      *,
      media (*),
      evidences:extraction_evidences (*)
    `)
    .eq('id', id)
    .single()

  if (error || !listing) {
    if (error) console.error('Error fetching listing review:', error)
    notFound()
  }

  // Serialize BigInt and Decimal for client component
  // Note: Supabase returns numbers as numbers (if not BigInt in DB? BigInt in DB is returned as string or number depending on driver, supabase-js usually returns number or string for int8)
  // Check types. In Prisma schema price is BigInt. Postgres int8.
  // Supabase (PostgREST) returns int8 as number (if fits safe integer) or usually just number.
  // But wait, JS Max Safe Integer is 2^53. Price can fit. 
  // However, `serializedListing` expects strings for BigInts as per previous Prisma usage logic (Prisma returns BigInt object).
  // Supabase returns number or string? It returns number for numeric unless configured.
  // Actually, let's keep the .toString() logic SAFE by checking type.

  const serializedListing = {
    ...listing,
    // Supabase result properties are already primitives (number/string/null).
    // If they are numbers, toString() works. If strings, toString() works.
    price: listing.price ? listing.price.toString() : null,
    landArea: listing.landArea ? listing.landArea.toString() : null,
    buildingArea: listing.buildingArea ? listing.buildingArea.toString() : null,
    yieldGross: listing.yieldGross ? listing.yieldGross.toString() : null,
    yieldNet: listing.yieldNet ? listing.yieldNet.toString() : null,
    extractionConfidence: listing.extractionConfidence ? listing.extractionConfidence.toString() : null,
    warnings: (listing.warnings as string[] | null) || null,
    features: (listing.features as string[] | null) || null,
    descriptionJa: listing.descriptionJa || null,
    descriptionEn: listing.descriptionEn || null,
    descriptionZhTw: listing.descriptionZhTw || null,
    descriptionZhCn: listing.descriptionZhCn || null,
    // Stations JSON is already an object/array in Supabase result
    stations: listing.stations as { name: string; line?: string | null; walk_minutes?: number | null }[] | null,
    evidences: (listing.evidences || []).map((e: any) => ({
      ...e,
      confidence: e.confidence ? e.confidence.toString() : null,
    })),
  }

  return (
    <div>
      <ReviewForm listing={serializedListing} />
    </div>
  )
}
