CREATE TABLE "projects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"description" text,
	"settings" jsonb,
	"thumbnail_url" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_username_unique";--> statement-breakpoint
ALTER TABLE "stories" DROP CONSTRAINT "stories_voice_profile_id_voices_id_fk";
--> statement-breakpoint
ALTER TABLE "workspaces" DROP CONSTRAINT "workspaces_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "stories" ALTER COLUMN "aspect_ratio" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "narration_style" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "main_character_id" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "auto_shorts_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "shorts_per_video" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "shorts_hook_types" jsonb DEFAULT '["emotional","action","reveal","dramatic"]'::jsonb;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "shorts_min_confidence" integer DEFAULT 75;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "auto_publish_shorts" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "shorts_platforms" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "shorts_schedule_mode" text DEFAULT 'with_main';--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "shorts_stagger_hours" integer DEFAULT 4;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "image_custom_instructions" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "video_custom_instructions" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_template" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_template_type" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_topics" text[];--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_media_type" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_transition" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_voice_profile" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_background_music_track" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_voice_volume" integer DEFAULT 80;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "story_music_volume" integer DEFAULT 40;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "asmr_category" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "asmr_material" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "asmr_prompts" text[];--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "asmr_video_model" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "asmr_is_loopable" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "asmr_sound_intensity" integer DEFAULT 50;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_category" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_moods" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_animation_mode" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_voice_over_language" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_pacing" integer DEFAULT 30;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_segment_count" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_transition_style" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_variation_type" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_camera_motion" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_loop_mode" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_visual_rhythm" text;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD COLUMN "ambient_enable_parallax" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image_url" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider" varchar DEFAULT 'credentials';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provider_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "google_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verification_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "workspace_limit" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_completed_onboarding" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_data" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "template_type";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "script";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "image_model";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "voice_profile_id";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "voiceover_url";--> statement-breakpoint
ALTER TABLE "stories" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_google_id_unique" UNIQUE("google_id");