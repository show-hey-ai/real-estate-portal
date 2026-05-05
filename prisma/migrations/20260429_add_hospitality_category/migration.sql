-- AlterTable: add hospitality category for hospitality-focused property classification
ALTER TABLE "listings" ADD COLUMN "hospitalityCategory" TEXT;

-- Optional index for filtering performance
CREATE INDEX IF NOT EXISTS "listings_hospitalityCategory_idx" ON "listings"("hospitalityCategory");

-- Mark all existing listings as CONVERSION_CANDIDATE (transitional state).
-- These are pre-pivot residential/general listings; treat them as conversion candidates
-- pending pre-purchase feasibility review. Replace as new hospitality-source listings
-- come in via REINS sourcing.
UPDATE "listings"
SET "hospitalityCategory" = 'CONVERSION_CANDIDATE'
WHERE "hospitalityCategory" IS NULL;
