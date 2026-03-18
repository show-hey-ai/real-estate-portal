-- Add missing columns to listings table
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "priceCurrency" TEXT NOT NULL DEFAULT 'JPY';
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "addressFull" TEXT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(10,8);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(11,8);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "unitCount" INTEGER;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "landRights" TEXT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "buildingCoverageRatio" DECIMAL(5,2);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "floorAreaRatio" DECIMAL(5,2);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "annualIncome" BIGINT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "annualExpenses" BIGINT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "occupancyRate" DECIMAL(5,2);
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "vacantUnits" INTEGER;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "currentRentRoll" JSONB;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "features" JSONB;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "fetchedAt" TIMESTAMP(3);

-- Update ListingStatus enum to include IN_REVIEW and SOLD if missing
DO $$ BEGIN
    ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'IN_REVIEW';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "ListingStatus" ADD VALUE IF NOT EXISTS 'SOLD';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update ContactMethod enum to include PHONE if missing
DO $$ BEGIN
    ALTER TYPE "ContactMethod" ADD VALUE IF NOT EXISTS 'PHONE';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update LeadStatus enum if necessary
DO $$ BEGIN
    ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'CONVERTED';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update MediaCategory enum
DO $$ BEGIN
    ALTER TYPE "MediaCategory" ADD VALUE IF NOT EXISTS 'DOCUMENT';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add caption to media table
ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "caption" TEXT;
