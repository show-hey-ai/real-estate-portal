import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ReviewForm } from '@/components/admin/review-form'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params
  const supabase = await createClient()

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

  const serializedListing = {
    ...listing,
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
