-- Add adAllowed column
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "adAllowed" BOOLEAN DEFAULT false;

-- Add managementId column with UNIQUE constraint
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "managementId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listings_managementId_unique'
      AND conrelid = 'listings'::regclass
  ) THEN
    ALTER TABLE "listings"
      ADD CONSTRAINT "listings_managementId_unique" UNIQUE ("managementId");
  END IF;
END $$;
