import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, index, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  provider: varchar("provider").default("credentials"),
  providerId: varchar("provider_id"),
  credits: numeric("credits", { precision: 12, scale: 6 }).default("0").notNull(),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  
  // OAuth fields
  googleId: varchar("google_id").unique(),
  
  // Email verification fields
  emailVerified: boolean("email_verified").default(false).notNull(),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry"),
  
  // Password reset fields
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry"),
  
  // Workspace limit (for future subscription integration)
  workspaceLimit: integer("workspace_limit").default(3).notNull(),
  
  // Onboarding
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false).notNull(),
  onboardingData: jsonb("onboarding_data"), // Stores answers from onboarding questions
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  lateProfileId: text("late_profile_id"), // Late.dev profile ID for social media integrations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  // Core
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  mode: text("mode").notNull(), // "ambient" | "narrative" | "commerce" | "vlog" | "logo"
  status: text("status").default("draft"),
  
  // Progress
  currentStep: integer("current_step"),
  completedSteps: jsonb("completed_steps"),
  
  // Step Data
  step1Data: jsonb("step1_data"), // Concept: Script/Atmosphere/Product
  step2Data: jsonb("step2_data"), // World: Art style, characters, locations
  step3Data: jsonb("step3_data"), // Flow: Scenes, shots, continuity
  step4Data: jsonb("step4_data"), // Storyboard: Shot versions, compositions
  step5Data: jsonb("step5_data"), // Preview: Animatic, audio config
  step6Data: jsonb("step6_data"), // Preview: Timeline, audio settings
  step7Data: jsonb("step7_data"), // Export: Render state, final URLs
  
  // Output
  exportUrl: text("export_url"),
  thumbnailUrl: text("thumbnail_url"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const voices = pgTable("voices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  sampleUrl: text("sample_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  
  // Project Info
  projectName: text("project_name").notNull(),
  projectFolder: text("project_folder").notNull(), // Full folder name with timestamp on BunnyCDN
  storyMode: text("story_mode").notNull(), // 'problem-solution', 'asmr-sensory', etc.
  
  // Final Video
  videoUrl: text("video_url"), // BunnyCDN URL for final.mp4
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration"), // Duration in seconds
  aspectRatio: text("aspect_ratio"), // '9:16', '16:9', '1:1'
  
  // Social Publishing (JSONB for flexibility)
  // Example: { "youtube": { "published_at": "...", "video_id": "...", "status": "published" } }
  publishedPlatforms: jsonb("published_platforms").default({}),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  personality: text("personality"),
  appearance: text("appearance"),
  imageUrl: text("image_url"),
  referenceImages: jsonb("reference_images"),
  voiceSettings: jsonb("voice_settings"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandkits = pgTable("brandkits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  colors: jsonb("colors"),
  fonts: jsonb("fonts"),
  logoUrl: text("logo_url"),
  guidelines: text("guidelines"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  details: text("details"),
  imageUrl: text("image_url"),              // Main location image (Bunny CDN)
  referenceImages: jsonb("reference_images"), // Array of max 2 reference URLs (disabled for now)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Usage tracking table for AI API calls
export const usage = pgTable("usage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  workspaceId: varchar("workspace_id").references(() => workspaces.id, { onDelete: "set null" }),
  date: varchar("date").notNull(), // YYYY-MM-DD format
  time: varchar("time").notNull(), // HH:mm format
  type: text("type").notNull(), // "video" | "script" | "image" | "voiceover" | "music" | "sfx" | "assets"
  mode: text("mode").notNull(), // "ambient" | "problem-solution" | "character" | "location" etc
  modelName: text("model_name").notNull(), // "gpt-5-nano", "sora-2", etc
  provider: text("provider").notNull(), // "openai", "runware", "gemini"
  estimatedCostUsd: text("estimated_cost_usd").notNull(), // Stored as string for precision
  creditsDeducted: numeric("credits_deducted", { precision: 12, scale: 6 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("IDX_usage_user_workspace_date").on(table.userId, table.workspaceId, table.date),
]);

// NOTE: content_calendar table has been removed - Late.dev is now the single source of truth
// See server/calendar/ for the new calendar implementation

export const workspaceIntegrations = pgTable("workspace_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  platform: text("platform").notNull(), // 'youtube' | 'tiktok' | 'instagram' | 'facebook'
  source: text("source").default("late").notNull(), // 'late' - Integration source (Late.dev)
  lateAccountId: text("late_account_id"), // Late.dev account ID
  platformUserId: text("platform_user_id"), // e.g., YouTube channel ID
  platformUsername: text("platform_username"), // Display name for UI
  platformProfileImage: text("platform_profile_image"), // Avatar URL
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;

export const insertWorkspaceSchema = createInsertSchema(workspaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  publishedPlatforms: true, // Will be set via updateStory
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
  id: true,
  createdAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertVoiceSchema = createInsertSchema(voices).omit({
  id: true,
  createdAt: true,
});

export const insertBrandkitSchema = createInsertSchema(brandkits).omit({
  id: true,
  createdAt: true,
});

export const insertUploadSchema = createInsertSchema(uploads).omit({
  id: true,
  createdAt: true,
});

export const insertWorkspaceIntegrationSchema = createInsertSchema(workspaceIntegrations).omit({
  id: true,
  createdAt: true,
});

export const insertUsageSchema = createInsertSchema(usage).omit({
  id: true,
  createdAt: true,
});

// ═══════════════════════════════════════════════════════════════
// AUTO PRODUCTION CAMPAIGN TABLES
// ═══════════════════════════════════════════════════════════════

// Video Campaigns - for Auto Video feature
export const videoCampaigns = pgTable("video_campaigns", {
  // Core (5)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  status: text("status").default("draft"), // draft, generating, paused, review, completed, cancelled

  // Tracking - Hybrid Approach (4)
  videoIdeas: jsonb("video_ideas").default([]),           // [{idea: string, index: number}, ...]
  itemStatuses: jsonb("item_statuses").default({}),       // {"0": {status, videoId, error}, ...}
  itemSchedules: jsonb("item_schedules").default({}),     // {"0": {scheduledDate, publishedDate}, ...}
  generatedVideoIds: text("generated_video_ids").array(), // For fast queries

  // Settings (2)
  videoMode: text("video_mode").notNull(),                // 'narrative' | 'character_vlog' | 'ambient_visual'
  campaignSettings: jsonb("campaign_settings").default({}), // All mode-specific defaults

  // Scheduling (5)
  automationMode: text("automation_mode").default("manual"),
  scheduleStartDate: timestamp("schedule_start_date"),
  scheduleEndDate: timestamp("schedule_end_date"),
  preferredPublishHours: jsonb("preferred_publish_hours").default([]),
  maxVideosPerDay: integer("max_videos_per_day").default(1),

  // Publishing (1)
  selectedPlatforms: jsonb("selected_platforms").default([]),

  // Timestamps (2)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Story Campaigns - for Auto Story feature
export const storyCampaigns = pgTable("story_campaigns", {
  // Core (5)
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  status: text("status").default("draft"), // draft, generating, paused, review, completed, cancelled

  // Tracking - Hybrid Approach (4)
  storyTopics: jsonb("story_topics").default([]),         // [{topic: string, index: number}, ...]
  itemStatuses: jsonb("item_statuses").default({}),       // {"0": {status, storyId, error}, ...}
  itemSchedules: jsonb("item_schedules").default({}),     // {"0": {scheduledDate, publishedDate}, ...}
  generatedStoryIds: text("generated_story_ids").array(), // For fast queries

  // Settings (2)
  template: text("template").notNull(),                   // 'problem-solution' | 'tease-reveal' | 'before-after' | 'myth-busting'
  campaignSettings: jsonb("campaign_settings").default({}), // All template-specific defaults

  // Scheduling (5)
  automationMode: text("automation_mode").default("manual"),
  scheduleStartDate: timestamp("schedule_start_date"),
  scheduleEndDate: timestamp("schedule_end_date"),
  preferredPublishHours: jsonb("preferred_publish_hours").default([]),
  maxStoriesPerDay: integer("max_stories_per_day").default(1),

  // Publishing (1)
  selectedPlatforms: jsonb("selected_platforms").default([]),

  // Timestamps (2)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVideoCampaignSchema = createInsertSchema(videoCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoryCampaignSchema = createInsertSchema(storyCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertVoice = z.infer<typeof insertVoiceSchema>;
export type Voice = typeof voices.$inferSelect;
export type InsertBrandkit = z.infer<typeof insertBrandkitSchema>;
export type Brandkit = typeof brandkits.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertWorkspaceIntegration = z.infer<typeof insertWorkspaceIntegrationSchema>;
export type WorkspaceIntegration = typeof workspaceIntegrations.$inferSelect;
export type InsertVideoCampaign = z.infer<typeof insertVideoCampaignSchema>;
export type VideoCampaign = typeof videoCampaigns.$inferSelect;
export type InsertStoryCampaign = z.infer<typeof insertStoryCampaignSchema>;
export type StoryCampaign = typeof storyCampaigns.$inferSelect;
export type InsertUsage = z.infer<typeof insertUsageSchema>;
export type Usage = typeof usage.$inferSelect;