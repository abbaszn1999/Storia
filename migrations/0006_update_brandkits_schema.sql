-- Update brandkits table schema
-- Add description and logoUrl, remove logos column
ALTER TABLE "brandkits" DROP COLUMN IF EXISTS "logos";
ALTER TABLE "brandkits" ADD COLUMN IF NOT EXISTS "description" TEXT;

-- Add logo_url as TEXT column or convert from JSONB if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brandkits' AND column_name = 'logo_url' AND data_type = 'jsonb'
  ) THEN
    ALTER TABLE "brandkits" ALTER COLUMN "logo_url" TYPE TEXT USING "logo_url"::text;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'brandkits' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE "brandkits" ADD COLUMN "logo_url" TEXT;
  END IF;
END $$;

