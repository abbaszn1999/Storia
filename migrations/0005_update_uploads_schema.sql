-- Migration: Update uploads table schema
-- Add name and description columns

-- Add name column (will be populated from file_name)
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Add description column
ALTER TABLE "uploads" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Populate name from file_name for existing records
UPDATE "uploads" SET "name" = "file_name" WHERE "name" IS NULL;

-- Make name NOT NULL after populating
ALTER TABLE "uploads" ALTER COLUMN "name" SET NOT NULL;

