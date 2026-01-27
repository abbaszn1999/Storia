-- Migration: Restructure Auto Production tables
-- Removes: production_campaigns, campaign_videos
-- Adds: video_campaigns, story_campaigns

-- Drop old tables (campaign_videos first due to FK dependency)
DROP TABLE IF EXISTS "campaign_videos";
DROP TABLE IF EXISTS "production_campaigns";

-- Create video_campaigns table
CREATE TABLE IF NOT EXISTS "video_campaigns" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "workspace_id" varchar NOT NULL REFERENCES "workspaces"("id"),
  "name" text NOT NULL,
  "status" text DEFAULT 'draft',
  
  -- Tracking (Hybrid Approach)
  "video_ideas" jsonb DEFAULT '[]',
  "item_statuses" jsonb DEFAULT '{}',
  "item_schedules" jsonb DEFAULT '{}',
  "generated_video_ids" text[],
  
  -- Settings
  "video_mode" text NOT NULL,
  "campaign_settings" jsonb DEFAULT '{}',
  
  -- Scheduling
  "automation_mode" text DEFAULT 'manual',
  "schedule_start_date" timestamp,
  "schedule_end_date" timestamp,
  "preferred_publish_hours" jsonb DEFAULT '[]',
  "max_videos_per_day" integer DEFAULT 1,
  
  -- Publishing
  "selected_platforms" jsonb DEFAULT '[]',
  
  -- Timestamps
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create story_campaigns table
CREATE TABLE IF NOT EXISTS "story_campaigns" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id"),
  "workspace_id" varchar NOT NULL REFERENCES "workspaces"("id"),
  "name" text NOT NULL,
  "status" text DEFAULT 'draft',
  
  -- Tracking (Hybrid Approach)
  "story_topics" jsonb DEFAULT '[]',
  "item_statuses" jsonb DEFAULT '{}',
  "item_schedules" jsonb DEFAULT '{}',
  "generated_story_ids" text[],
  
  -- Settings
  "template" text NOT NULL,
  "campaign_settings" jsonb DEFAULT '{}',
  
  -- Scheduling
  "automation_mode" text DEFAULT 'manual',
  "schedule_start_date" timestamp,
  "schedule_end_date" timestamp,
  "preferred_publish_hours" jsonb DEFAULT '[]',
  "max_stories_per_day" integer DEFAULT 1,
  
  -- Publishing
  "selected_platforms" jsonb DEFAULT '[]',
  
  -- Timestamps
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS "video_campaigns_user_id_idx" ON "video_campaigns"("user_id");
CREATE INDEX IF NOT EXISTS "video_campaigns_workspace_id_idx" ON "video_campaigns"("workspace_id");
CREATE INDEX IF NOT EXISTS "video_campaigns_status_idx" ON "video_campaigns"("status");

CREATE INDEX IF NOT EXISTS "story_campaigns_user_id_idx" ON "story_campaigns"("user_id");
CREATE INDEX IF NOT EXISTS "story_campaigns_workspace_id_idx" ON "story_campaigns"("workspace_id");
CREATE INDEX IF NOT EXISTS "story_campaigns_status_idx" ON "story_campaigns"("status");
