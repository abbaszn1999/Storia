-- Remove unused OAuth token columns from workspace_integrations
-- These were designed for direct OAuth but are not used with Late.dev integration

ALTER TABLE "workspace_integrations" DROP COLUMN IF EXISTS "access_token";
ALTER TABLE "workspace_integrations" DROP COLUMN IF EXISTS "refresh_token";
ALTER TABLE "workspace_integrations" DROP COLUMN IF EXISTS "token_expires_at";

