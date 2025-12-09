-- Migration: Update locations table schema
-- Rename thumbnailUrl to imageUrl for consistency with characters

-- Rename thumbnail_url to image_url
ALTER TABLE "locations" RENAME COLUMN "thumbnail_url" TO "image_url";

