-- Align migration history with the current Prisma schema after rebuilding Supabase.

ALTER TABLE "listings" DROP COLUMN IF EXISTS "pricePerSqm";

ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "infoRegisteredAt" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "infoUpdatedAt" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "conditionsExpiry" TIMESTAMP(3);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featuresEn" JSONB;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featuresZhTw" JSONB;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "featuresZhCn" JSONB;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;

UPDATE "listings" SET "adAllowed" = false WHERE "adAllowed" IS NULL;
ALTER TABLE "listings" ALTER COLUMN "adAllowed" SET DEFAULT false;
ALTER TABLE "listings" ALTER COLUMN "adAllowed" SET NOT NULL;

UPDATE "listings" SET "adConsentRequired" = false WHERE "adConsentRequired" IS NULL;
ALTER TABLE "listings" ALTER COLUMN "adConsentRequired" SET DEFAULT false;
ALTER TABLE "listings" ALTER COLUMN "adConsentRequired" SET NOT NULL;

ALTER TABLE "media" DROP COLUMN IF EXISTS "thumbnailUrl";
ALTER TABLE "media" ALTER COLUMN "isAdopted" SET DEFAULT true;

DROP TABLE IF EXISTS "listing_translations";
