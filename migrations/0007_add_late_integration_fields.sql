-- Add Late.dev profile ID to workspaces table
ALTER TABLE "workspaces" ADD COLUMN "late_profile_id" text;

-- Add integration source and Late account ID to workspace_integrations table
ALTER TABLE "workspace_integrations" ADD COLUMN "source" text DEFAULT 'late' NOT NULL;
ALTER TABLE "workspace_integrations" ADD COLUMN "late_account_id" text;

