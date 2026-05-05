-- Add adConsentRequired column
-- 広告掲載に際し売主承諾が必要な場合にtrueを設定
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "adConsentRequired" BOOLEAN DEFAULT false;
