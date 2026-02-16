-- Change users.credits from integer to numeric for exact decimal calculations
-- This allows storing credits with up to 6 decimal places (e.g., 999999.999999)
ALTER TABLE "users" 
ALTER COLUMN "credits" TYPE numeric(12, 6);

-- Also update usage.creditsDeducted to numeric for consistency
ALTER TABLE "usage"
ALTER COLUMN "credits_deducted" TYPE numeric(12, 6);

-- Set default to 0.0 if not already set
ALTER TABLE "users" 
ALTER COLUMN "credits" SET DEFAULT 0.0;
