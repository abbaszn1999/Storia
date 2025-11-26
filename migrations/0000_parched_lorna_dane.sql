CREATE TABLE "brandkits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" text NOT NULL,
	"colors" jsonb,
	"fonts" jsonb,
	"logos" jsonb,
	"guidelines" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_videos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"video_id" varchar,
	"title" text NOT NULL,
	"concept_description" text NOT NULL,
	"script" text,
	"order_index" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"generation_progress" integer DEFAULT 0 NOT NULL,
	"scheduled_publish_date" timestamp,
	"actual_publish_date" timestamp,
	"metadata" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"personality" text,
	"appearance" jsonb,
	"voice_settings" jsonb,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_calendar" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"video_id" varchar,
	"story_id" varchar,
	"title" text NOT NULL,
	"scheduled_date" timestamp NOT NULL,
	"platform" text NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"published_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "continuity_groups" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scene_id" varchar NOT NULL,
	"group_number" integer NOT NULL,
	"shot_ids" jsonb NOT NULL,
	"description" text,
	"transition_type" text,
	"status" text DEFAULT 'proposed' NOT NULL,
	"edited_by" text,
	"edited_at" timestamp,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"details" text,
	"thumbnail_url" text,
	"reference_images" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"story_ideas" text[] NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"automation_mode" text DEFAULT 'manual' NOT NULL,
	"video_mode" text DEFAULT 'narrative' NOT NULL,
	"narrative_mode" text NOT NULL,
	"aspect_ratio" text DEFAULT '16:9' NOT NULL,
	"duration" integer DEFAULT 60 NOT NULL,
	"language" text DEFAULT 'en' NOT NULL,
	"art_style" text,
	"style_reference_image_url" text,
	"tone" text NOT NULL,
	"genre" text NOT NULL,
	"target_audience" text,
	"resolution" text DEFAULT '1080p' NOT NULL,
	"animate_images" boolean DEFAULT true NOT NULL,
	"has_voice_over" boolean DEFAULT true NOT NULL,
	"has_sound_effects" boolean DEFAULT true NOT NULL,
	"has_background_music" boolean DEFAULT true NOT NULL,
	"schedule_start_date" timestamp,
	"schedule_end_date" timestamp,
	"preferred_publish_hours" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"max_videos_per_day" integer DEFAULT 1 NOT NULL,
	"distribution_pattern" text DEFAULT 'even' NOT NULL,
	"selected_platforms" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scripter_model" text,
	"image_model" text,
	"video_model" text,
	"voice_model" text,
	"voice_actor_id" text,
	"videos_generated" integer DEFAULT 0 NOT NULL,
	"videos_published" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reference_images" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar,
	"shot_id" varchar,
	"character_id" varchar,
	"type" text NOT NULL,
	"image_url" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scenes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"video_id" varchar NOT NULL,
	"scene_number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration" integer,
	"video_model" text,
	"image_model" text,
	"lighting" text,
	"weather" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shot_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shot_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"image_prompt" text,
	"image_url" text,
	"start_frame_prompt" text,
	"start_frame_url" text,
	"end_frame_prompt" text,
	"end_frame_url" text,
	"video_prompt" text,
	"video_url" text,
	"video_duration" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"needs_rerender" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scene_id" varchar NOT NULL,
	"shot_number" integer NOT NULL,
	"shot_type" text NOT NULL,
	"camera_movement" text DEFAULT 'static' NOT NULL,
	"duration" integer NOT NULL,
	"description" text,
	"video_model" text,
	"image_model" text,
	"sound_effects" text,
	"transition" text DEFAULT 'cut',
	"current_version_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" text NOT NULL,
	"template" text NOT NULL,
	"template_type" text NOT NULL,
	"script" text,
	"aspect_ratio" text DEFAULT '9:16' NOT NULL,
	"duration" integer,
	"image_model" text,
	"voice_profile_id" varchar,
	"voiceover_url" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"export_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_scenes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" varchar NOT NULL,
	"scene_number" integer NOT NULL,
	"image_prompt" text,
	"image_url" text,
	"effect" text DEFAULT 'fade' NOT NULL,
	"voiceover_text" text,
	"duration" integer DEFAULT 3 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"storage_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"subscription_tier" text DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"title" text NOT NULL,
	"mode" text NOT NULL,
	"narrative_mode" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"script" text,
	"scenes" jsonb,
	"world_settings" jsonb,
	"cast" jsonb,
	"storyboard" jsonb,
	"export_url" text,
	"duration" integer,
	"voice_actor_id" text,
	"voice_over_enabled" boolean DEFAULT true NOT NULL,
	"continuity_locked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"voice_id" text NOT NULL,
	"settings" jsonb,
	"sample_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"platform_user_id" text,
	"platform_username" text,
	"platform_profile_image" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "brandkits" ADD CONSTRAINT "brandkits_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_videos" ADD CONSTRAINT "campaign_videos_campaign_id_production_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."production_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_videos" ADD CONSTRAINT "campaign_videos_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "characters" ADD CONSTRAINT "characters_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_calendar" ADD CONSTRAINT "content_calendar_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "continuity_groups" ADD CONSTRAINT "continuity_groups_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_campaigns" ADD CONSTRAINT "production_campaigns_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_images" ADD CONSTRAINT "reference_images_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_images" ADD CONSTRAINT "reference_images_shot_id_shots_id_fk" FOREIGN KEY ("shot_id") REFERENCES "public"."shots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_images" ADD CONSTRAINT "reference_images_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shot_versions" ADD CONSTRAINT "shot_versions_shot_id_shots_id_fk" FOREIGN KEY ("shot_id") REFERENCES "public"."shots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shots" ADD CONSTRAINT "shots_scene_id_scenes_id_fk" FOREIGN KEY ("scene_id") REFERENCES "public"."scenes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stories" ADD CONSTRAINT "stories_voice_profile_id_voices_id_fk" FOREIGN KEY ("voice_profile_id") REFERENCES "public"."voices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_scenes" ADD CONSTRAINT "story_scenes_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."stories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voices" ADD CONSTRAINT "voices_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_integrations" ADD CONSTRAINT "workspace_integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;