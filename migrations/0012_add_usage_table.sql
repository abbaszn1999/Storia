-- Create usage tracking table
CREATE TABLE IF NOT EXISTS "usage" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "workspace_id" varchar REFERENCES "workspaces"("id") ON DELETE SET NULL,
  "date" varchar NOT NULL,
  "time" varchar NOT NULL,
  "type" text NOT NULL,
  "mode" text NOT NULL,
  "model_name" text NOT NULL,
  "provider" text NOT NULL,
  "estimated_cost_usd" text NOT NULL,
  "credits_deducted" integer NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create index for efficient queries by user, workspace, and date
CREATE INDEX IF NOT EXISTS "IDX_usage_user_workspace_date" ON "usage"("user_id", "workspace_id", "date");
