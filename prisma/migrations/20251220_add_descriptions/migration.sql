-- Add description columns for multi-language support
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "descriptionJa" TEXT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "descriptionZhTw" TEXT;
ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "descriptionZhCn" TEXT;
