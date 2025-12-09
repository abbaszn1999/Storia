ALTER TABLE "characters" DROP COLUMN "thumbnail_url";--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "characters" ADD COLUMN "reference_images" jsonb;--> statement-breakpoint
ALTER TABLE "characters" ALTER COLUMN "appearance" SET DATA TYPE text;

