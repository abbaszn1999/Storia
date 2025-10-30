import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  credits: integer("credits").default(0).notNull(),
  subscriptionTier: text("subscription_tier").default("free").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  mode: text("mode").notNull(),
  status: text("status").default("draft").notNull(),
  script: text("script"),
  scenes: jsonb("scenes"),
  worldSettings: jsonb("world_settings"),
  cast: jsonb("cast"),
  storyboard: jsonb("storyboard"),
  exportUrl: text("export_url"),
  duration: integer("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const voices = pgTable("voices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  voiceId: text("voice_id").notNull(),
  settings: jsonb("settings"),
  sampleUrl: text("sample_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  title: text("title").notNull(),
  template: text("template").notNull(),
  templateType: text("template_type").notNull(),
  script: text("script"),
  aspectRatio: text("aspect_ratio").default("9:16").notNull(),
  duration: integer("duration"),
  imageModel: text("image_model"),
  voiceProfileId: varchar("voice_profile_id").references(() => voices.id),
  voiceoverUrl: text("voiceover_url"),
  status: text("status").default("draft").notNull(),
  exportUrl: text("export_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const storyScenes = pgTable("story_scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id),
  sceneNumber: integer("scene_number").notNull(),
  imagePrompt: text("image_prompt"),
  imageUrl: text("image_url"),
  effect: text("effect").default("fade").notNull(),
  voiceoverText: text("voiceover_text"),
  duration: integer("duration").default(3).notNull(),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const characters = pgTable("characters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  description: text("description"),
  appearance: jsonb("appearance"),
  voiceSettings: jsonb("voice_settings"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const brandkits = pgTable("brandkits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  name: text("name").notNull(),
  colors: jsonb("colors"),
  fonts: jsonb("fonts"),
  logos: jsonb("logos"),
  guidelines: text("guidelines"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const uploads = pgTable("uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  storageUrl: text("storage_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const contentCalendar = pgTable("content_calendar", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull().references(() => workspaces.id),
  videoId: varchar("video_id").references(() => videos.id),
  storyId: varchar("story_id").references(() => stories.id),
  title: text("title").notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  platform: text("platform").notNull(),
  status: text("status").default("scheduled").notNull(),
  publishedUrl: text("published_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  sceneNumber: integer("scene_number").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  timeOfDay: text("time_of_day"),
  duration: integer("duration"),
  videoModel: text("video_model"),
  imageModel: text("image_model"),
  lighting: text("lighting"),
  weather: text("weather"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shots = pgTable("shots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sceneId: varchar("scene_id").notNull().references(() => scenes.id),
  shotNumber: integer("shot_number").notNull(),
  shotType: text("shot_type").notNull(),
  cameraMovement: text("camera_movement").default("static").notNull(),
  duration: integer("duration").notNull(),
  description: text("description"),
  videoModel: text("video_model"),
  imageModel: text("image_model"),
  currentVersionId: varchar("current_version_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shotVersions = pgTable("shot_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shotId: varchar("shot_id").notNull().references(() => shots.id),
  versionNumber: integer("version_number").notNull(),
  imagePrompt: text("image_prompt"),
  imageUrl: text("image_url"),
  videoPrompt: text("video_prompt"),
  videoUrl: text("video_url"),
  videoDuration: integer("video_duration"),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referenceImages = pgTable("reference_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id),
  shotId: varchar("shot_id").references(() => shots.id),
  characterId: varchar("character_id").references(() => characters.id),
  type: text("type").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

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
});

export const insertStorySceneSchema = createInsertSchema(storyScenes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCharacterSchema = createInsertSchema(characters).omit({
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

export const insertContentCalendarSchema = createInsertSchema(contentCalendar).omit({
  id: true,
  createdAt: true,
});

export const insertSceneSchema = createInsertSchema(scenes).omit({
  id: true,
  createdAt: true,
});

export const insertShotSchema = createInsertSchema(shots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShotVersionSchema = createInsertSchema(shotVersions).omit({
  id: true,
  createdAt: true,
});

export const insertReferenceImageSchema = createInsertSchema(referenceImages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertWorkspace = z.infer<typeof insertWorkspaceSchema>;
export type Workspace = typeof workspaces.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertStory = z.infer<typeof insertStorySchema>;
export type Story = typeof stories.$inferSelect;
export type InsertStoryScene = z.infer<typeof insertStorySceneSchema>;
export type StoryScene = typeof storyScenes.$inferSelect;
export type InsertCharacter = z.infer<typeof insertCharacterSchema>;
export type Character = typeof characters.$inferSelect;
export type InsertVoice = z.infer<typeof insertVoiceSchema>;
export type Voice = typeof voices.$inferSelect;
export type InsertBrandkit = z.infer<typeof insertBrandkitSchema>;
export type Brandkit = typeof brandkits.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertContentCalendar = z.infer<typeof insertContentCalendarSchema>;
export type ContentCalendarItem = typeof contentCalendar.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;
export type Scene = typeof scenes.$inferSelect;
export type InsertShot = z.infer<typeof insertShotSchema>;
export type Shot = typeof shots.$inferSelect;
export type InsertShotVersion = z.infer<typeof insertShotVersionSchema>;
export type ShotVersion = typeof shotVersions.$inferSelect;
export type InsertReferenceImage = z.infer<typeof insertReferenceImageSchema>;
export type ReferenceImage = typeof referenceImages.$inferSelect;
