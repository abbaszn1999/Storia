import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean, index } from "drizzle-orm/pg-core";
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
  credits: integer("credits").default(0).notNull(),
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

// Auto Production Campaign tables
export const productionCampaigns = pgTable("production_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  storyIdeas: text("story_ideas").array().notNull(), // Array of story ideas - each becomes one video
  status: text("status").default("draft").notNull(), // draft, generating_concepts, review, in_progress, paused, completed, cancelled
  automationMode: text("automation_mode").default("manual").notNull(), // manual (requires approval), auto (fully automated)
  
  // Video mode and narrative mode selection
  videoMode: text("video_mode").default("narrative").notNull(), // narrative, character_vlog, video_podcast
  narrativeMode: text("narrative_mode").notNull(), // image-reference or start-end-frame (for narrative and character_vlog modes)
  narrationStyle: text("narration_style"), // third-person or first-person (for character_vlog mode)
  mainCharacterId: text("main_character_id"), // Primary character for character_vlog mode
  
  // Video settings
  aspectRatio: text("aspect_ratio").default("16:9").notNull(),
  duration: integer("duration").default(60).notNull(), // Target duration in seconds
  language: text("language").default("en").notNull(),
  artStyle: text("art_style"),
  styleReferenceImageUrl: text("style_reference_image_url"), // User can provide style reference instead of art style
  tone: text("tone").notNull(),
  genre: text("genre").notNull(),
  targetAudience: text("target_audience"),
  resolution: text("resolution").default("1080p").notNull(), // 720p, 1080p, 4k
  
  // AI generation toggles and settings
  animateImages: boolean("animate_images").default(true).notNull(), // Whether to animate images with video model
  hasVoiceOver: boolean("has_voice_over").default(true).notNull(),
  hasSoundEffects: boolean("has_sound_effects").default(true).notNull(),
  hasBackgroundMusic: boolean("has_background_music").default(true).notNull(),
  
  // Scheduling
  scheduleStartDate: timestamp("schedule_start_date"),
  scheduleEndDate: timestamp("schedule_end_date"),
  preferredPublishHours: jsonb("preferred_publish_hours").default([]).notNull(), // Array of hours (0-23) or "AI" for AI-suggested
  maxVideosPerDay: integer("max_videos_per_day").default(1).notNull(),
  distributionPattern: text("distribution_pattern").default("even").notNull(), // even, custom
  
  // Publishing
  selectedPlatforms: jsonb("selected_platforms").default([]).notNull(), // Array of platform IDs
  
  // Auto Shorts settings (for Narrative and Character Vlog modes)
  autoShortsEnabled: boolean("auto_shorts_enabled").default(false).notNull(),
  shortsPerVideo: integer("shorts_per_video").default(3), // 1-5 shorts per video
  shortsHookTypes: jsonb("shorts_hook_types").default(["emotional", "action", "reveal", "dramatic"]), // emotional, action, reveal, humor, dramatic
  shortsMinConfidence: integer("shorts_min_confidence").default(75), // 50-95%
  autoPublishShorts: boolean("auto_publish_shorts").default(true),
  shortsPlatforms: jsonb("shorts_platforms").default([]), // youtube_shorts, tiktok, instagram_reels, facebook_reels
  shortsScheduleMode: text("shorts_schedule_mode").default("with_main"), // with_main or staggered
  shortsStaggerHours: integer("shorts_stagger_hours").default(4), // Hours between shorts publications (1-24)
  
  // AI model settings
  scripterModel: text("scripter_model"),
  imageModel: text("image_model"),
  videoModel: text("video_model"),
  imageCustomInstructions: text("image_custom_instructions"),
  videoCustomInstructions: text("video_custom_instructions"),
  voiceModel: text("voice_model"),
  voiceActorId: text("voice_actor_id"),
  
  // Stories mode settings
  storyTemplate: text("story_template"), // problem-solution, tease-reveal, before-after, myth-busting, asmr-sensory
  storyTemplateType: text("story_template_type"), // narrative or direct (ASMR)
  storyTopics: text("story_topics").array(), // Array of topics for narrative templates
  storyMediaType: text("story_media_type"), // static (images with transitions) or animated (AI video clips)
  storyTransition: text("story_transition"), // fade, zoom, slide, dissolve, pan (only for static media type)
  storyVoiceProfile: text("story_voice_profile"), // Voice selection for stories
  storyBackgroundMusicTrack: text("story_background_music_track"),
  storyVoiceVolume: integer("story_voice_volume").default(80),
  storyMusicVolume: integer("story_music_volume").default(40),
  
  // ASMR-specific settings
  asmrCategory: text("asmr_category"), // food, hands, nature, art, unboxing
  asmrMaterial: text("asmr_material"), // Material/texture for sound generation
  asmrPrompts: text("asmr_prompts").array(), // Visual prompts for ASMR videos
  asmrVideoModel: text("asmr_video_model"),
  asmrIsLoopable: boolean("asmr_is_loopable").default(false),
  asmrSoundIntensity: integer("asmr_sound_intensity").default(50), // 0-100
  
  // Ambient Video mode settings
  ambientCategory: text("ambient_category"), // nature, weather, urban, cozy, abstract, cosmic, underwater, seasonal
  ambientMoods: jsonb("ambient_moods").default([]), // Array of moods (max 3): Relaxing, Meditative, etc.
  ambientAnimationMode: text("ambient_animation_mode"), // "animate" or "smooth-image"
  ambientVoiceOverLanguage: text("ambient_voice_over_language"), // English, Spanish, etc.
  
  // Ambient Flow Design settings
  ambientPacing: integer("ambient_pacing").default(30), // 0-100
  ambientSegmentCount: integer("ambient_segment_count").default(3), // 1, 3, 5, 7, 10
  ambientTransitionStyle: text("ambient_transition_style"), // crossfade, dissolve, drift, match-cut, morph, wipe
  ambientVariationType: text("ambient_variation_type"), // evolving, angles, elements, zoom
  ambientCameraMotion: text("ambient_camera_motion"), // static, slow-pan, gentle-drift, orbit, push-in, pull-out, parallax, float
  ambientLoopMode: text("ambient_loop_mode"), // seamless, one-way, boomerang, fade-loop
  ambientVisualRhythm: text("ambient_visual_rhythm"), // constant, breathing, building, wave
  ambientEnableParallax: boolean("ambient_enable_parallax").default(false),
  
  // Progress tracking
  videosGenerated: integer("videos_generated").default(0).notNull(),
  videosPublished: integer("videos_published").default(0).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const campaignVideos = pgTable("campaign_videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => productionCampaigns.id),
  videoId: varchar("video_id").references(() => videos.id),
  
  // Generated concept
  title: text("title").notNull(),
  conceptDescription: text("concept_description").notNull(),
  script: text("script"),
  orderIndex: integer("order_index").notNull(),
  
  // Status tracking
  status: text("status").default("pending").notNull(), // pending, generating, review_required, approved, in_production, completed, failed, cancelled
  generationProgress: integer("generation_progress").default(0).notNull(), // 0-100%
  
  // Scheduling
  scheduledPublishDate: timestamp("scheduled_publish_date"),
  actualPublishDate: timestamp("actual_publish_date"),
  
  // Metadata
  metadata: jsonb("metadata"), // Platform-specific metadata
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertProductionCampaignSchema = createInsertSchema(productionCampaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  videosGenerated: true,
  videosPublished: true,
});

export const insertCampaignVideoSchema = createInsertSchema(campaignVideos).omit({
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
export type InsertProductionCampaign = z.infer<typeof insertProductionCampaignSchema>;
export type ProductionCampaign = typeof productionCampaigns.$inferSelect;
export type InsertCampaignVideo = z.infer<typeof insertCampaignVideoSchema>;
export type CampaignVideo = typeof campaignVideos.$inferSelect;
