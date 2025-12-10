-- Migration: Update voices table schema
-- Simplify voices table: remove provider, voiceId, settings; add description

-- Remove unnecessary columns
ALTER TABLE "voices" DROP COLUMN IF EXISTS "provider";
ALTER TABLE "voices" DROP COLUMN IF EXISTS "voice_id";
ALTER TABLE "voices" DROP COLUMN IF EXISTS "settings";

-- Add description column
ALTER TABLE "voices" ADD COLUMN IF NOT EXISTS "description" TEXT;

