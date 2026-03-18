import { ListingForm } from '@/components/admin/listing-form'

export default function NewListingPage() {
    return (
        <div className="container mx-auto py-8">
            <ListingForm mode="create" />
        </div>
    )
}
