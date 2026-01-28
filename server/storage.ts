import {
  users,
  workspaces,
  stories,
  characters,
  locations,
  voices,
  brandkits,
  uploads,
  videos,
  workspaceIntegrations,
  videoCampaigns,
  storyCampaigns,
  type User,
  type UpsertUser,
  type Workspace,
  type InsertWorkspace,
  type Video,
  type InsertVideo,
  type Story,
  type InsertStory,
  type Character,
  type InsertCharacter,
  type Location,
  type InsertLocation,
  type Voice,
  type InsertVoice,
  type Brandkit,
  type InsertBrandkit,
  type Upload,
  type InsertUpload,
  type WorkspaceIntegration,
  type InsertWorkspaceIntegration,
  type VideoCampaign,
  type InsertVideoCampaign,
  type StoryCampaign,
  type InsertStoryCampaign,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: { email: string; passwordHash?: string; firstName?: string | null; lastName?: string | null; provider?: string; providerId?: string | null; profileImageUrl?: string | null; googleId?: string | null; emailVerified?: boolean }): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  getWorkspace(id: string): Promise<Workspace | undefined>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, workspace: Partial<Workspace>): Promise<Workspace>;
  deleteWorkspace(id: string): Promise<void>;
  countUserWorkspaces(userId: string): Promise<number>;
  
  getVideosByWorkspaceId(workspaceId: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<Video>): Promise<Video>;
  deleteVideo(id: string): Promise<void>;
  
  getStoriesByWorkspaceId(workspaceId: string): Promise<Story[]>;
  getStoriesByUserId(userId: string): Promise<Story[]>;
  getStory(id: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;
  updateStory(id: string, updates: Partial<Story>): Promise<Story>;
  deleteStory(id: string): Promise<void>;
  
  getCharactersByWorkspaceId(workspaceId: string): Promise<Character[]>;
  getCharacter(id: string): Promise<Character | undefined>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  updateCharacter(id: string, updates: Partial<Character>): Promise<Character>;
  deleteCharacter(id: string): Promise<void>;
  
  getLocationsByWorkspaceId(workspaceId: string): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, updates: Partial<Location>): Promise<Location>;
  deleteLocation(id: string): Promise<void>;
  
  getVoicesByWorkspaceId(workspaceId: string): Promise<Voice[]>;
  getVoice(id: string): Promise<Voice | undefined>;
  createVoice(voice: InsertVoice): Promise<Voice>;
  updateVoice(id: string, updates: Partial<Voice>): Promise<Voice>;
  deleteVoice(id: string): Promise<void>;
  
  getBrandkitsByWorkspaceId(workspaceId: string): Promise<Brandkit[]>;
  getBrandkit(id: string): Promise<Brandkit | undefined>;
  createBrandkit(brandkit: InsertBrandkit): Promise<Brandkit>;
  updateBrandkit(id: string, updates: Partial<Brandkit>): Promise<Brandkit>;
  deleteBrandkit(id: string): Promise<void>;
  
  getUploadsByWorkspaceId(workspaceId: string): Promise<Upload[]>;
  getUpload(id: string): Promise<Upload | undefined>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  updateUpload(id: string, updates: Partial<Upload>): Promise<Upload>;
  deleteUpload(id: string): Promise<void>;
  
  // NOTE: Content calendar methods removed - Late.dev is now the single source of truth
  // See server/calendar/ for the new calendar implementation
  
  getWorkspaceIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]>;
  getWorkspaceIntegration(workspaceId: string, platform: string): Promise<WorkspaceIntegration | undefined>;
  createWorkspaceIntegration(integration: InsertWorkspaceIntegration): Promise<WorkspaceIntegration>;
  updateWorkspaceIntegration(id: string, integration: Partial<WorkspaceIntegration>): Promise<WorkspaceIntegration>;
  deleteWorkspaceIntegration(id: string): Promise<void>;
  
  // Late.dev integration methods
  updateWorkspaceLateProfile(workspaceId: string, lateProfileId: string): Promise<void>;
  upsertLateIntegration(data: {
    workspaceId: string;
    platform: string;
    lateAccountId: string;
    platformUserId: string;
    platformUsername: string;
    platformProfileImage: string;
  }): Promise<WorkspaceIntegration>;
  getIntegrationByLateAccountId(lateAccountId: string): Promise<WorkspaceIntegration | undefined>;
  getLateIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]>;
  
  // Video Campaigns (Auto Video)
  getVideoCampaign(id: string): Promise<VideoCampaign | undefined>;
  getVideoCampaignsByUserId(userId: string): Promise<VideoCampaign[]>;
  getVideoCampaignsByWorkspaceId(workspaceId: string): Promise<VideoCampaign[]>;
  createVideoCampaign(campaign: InsertVideoCampaign): Promise<VideoCampaign>;
  updateVideoCampaign(id: string, updates: Partial<VideoCampaign>): Promise<VideoCampaign>;
  deleteVideoCampaign(id: string): Promise<void>;
  
  // Story Campaigns (Auto Story)
  getStoryCampaign(id: string): Promise<StoryCampaign | undefined>;
  getStoryCampaignsByUserId(userId: string): Promise<StoryCampaign[]>;
  getStoryCampaignsByWorkspaceId(workspaceId: string): Promise<StoryCampaign[]>;
  createStoryCampaign(campaign: InsertStoryCampaign): Promise<StoryCampaign>;
  updateStoryCampaign(id: string, updates: Partial<StoryCampaign>): Promise<StoryCampaign>;
  deleteStoryCampaign(id: string): Promise<void>;
  
  // Account management
  deleteUserAccount(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspacesMap: Map<string, Workspace>;
  private videos: Map<string, Video>;
  private stories: Map<string, Story>;
  private characters: Map<string, Character>;
  private locations: Map<string, Location>;
  private voices: Map<string, Voice>;
  private uploads: Map<string, Upload>;
  // workspaceIntegrations now uses PostgreSQL directly (not in-memory)
  // NOTE: contentCalendar removed - Late.dev is now the single source of truth

  constructor() {
    this.users = new Map();
    this.workspacesMap = new Map();
    this.videos = new Map();
    this.stories = new Map();
    this.characters = new Map();
    this.locations = new Map();
    this.voices = new Map();
    this.uploads = new Map();
    // workspaceIntegrations uses PostgreSQL directly
  }

  async getUser(id: string): Promise<User | undefined> {
    const memUser = this.users.get(id);
    if (memUser) return memUser;
    
    const [dbUser] = await db.select().from(users).where(eq(users.id, id));
    return dbUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userArray = Array.from(this.users.values());
    for (const user of userArray) {
      if (user.email === email) return user;
    }
    const [dbUser] = await db.select().from(users).where(eq(users.email, email));
    return dbUser;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const userArray = Array.from(this.users.values());
    for (const user of userArray) {
      if (user.googleId === googleId) return user;
    }
    const [dbUser] = await db.select().from(users).where(eq(users.googleId, googleId));
    return dbUser;
  }

  async createUser(userData: { email: string; passwordHash?: string; firstName?: string | null; lastName?: string | null; provider?: string; providerId?: string | null; profileImageUrl?: string | null; googleId?: string | null; emailVerified?: boolean }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        passwordHash: userData.passwordHash || null,
        firstName: userData.firstName || null,
        lastName: userData.lastName || null,
        provider: userData.provider || "credentials",
        providerId: userData.providerId || null,
        profileImageUrl: userData.profileImageUrl || null,
        googleId: userData.googleId || null,
        emailVerified: userData.emailVerified || false,
      })
      .returning();
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    if (user) {
      this.users.set(user.id, user);
    }
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    return db.select().from(workspaces).where(eq(workspaces.userId, userId));
  }

  async getWorkspace(id: string): Promise<Workspace | undefined> {
    const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, id));
    return workspace;
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const [workspace] = await db
      .insert(workspaces)
      .values(insertWorkspace)
      .returning();
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const [workspace] = await db
      .update(workspaces)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(workspaces.id, id))
      .returning();
    if (!workspace) {
      throw new Error(`Workspace with id ${id} not found`);
    }
    return workspace;
  }

  async deleteWorkspace(id: string): Promise<void> {
    // Delete all related records first (no cascade delete in schema for most tables)
    await db.delete(brandkits).where(eq(brandkits.workspaceId, id));
    await db.delete(characters).where(eq(characters.workspaceId, id));
    await db.delete(locations).where(eq(locations.workspaceId, id));
    await db.delete(voices).where(eq(voices.workspaceId, id));
    await db.delete(uploads).where(eq(uploads.workspaceId, id));
    // NOTE: content_calendar table removed - scheduled posts are now managed via Late.dev
    await db.delete(workspaceIntegrations).where(eq(workspaceIntegrations.workspaceId, id));
    await db.delete(stories).where(eq(stories.workspaceId, id));
    await db.delete(videos).where(eq(videos.workspaceId, id));
    // Finally delete the workspace itself
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  async countUserWorkspaces(userId: string): Promise<number> {
    const result = await db.select().from(workspaces).where(eq(workspaces.userId, userId));
    return result.length;
  }

  async getVideosByWorkspaceId(workspaceId: string): Promise<Video[]> {
    return db.select().from(videos).where(eq(videos.workspaceId, workspaceId));
  }

  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo)
      .returning();
    return video;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
    const [video] = await db
      .update(videos)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videos.id, id))
      .returning();
    if (!video) throw new Error('Video not found');
    return video;
  }

  async deleteVideo(id: string): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  async getStoriesByWorkspaceId(workspaceId: string): Promise<Story[]> {
    return db.select().from(stories).where(eq(stories.workspaceId, workspaceId));
  }

  async getStoriesByUserId(userId: string): Promise<Story[]> {
    return db.select().from(stories).where(eq(stories.userId, userId));
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values(insertStory)
      .returning();
    return story;
  }

  async getStory(id: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  async updateStory(id: string, updates: Partial<Story>): Promise<Story> {
    const [story] = await db
      .update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, id))
      .returning();
    return story;
  }

  async deleteStory(id: string): Promise<void> {
    await db.delete(stories).where(eq(stories.id, id));
  }

  async getCharactersByWorkspaceId(workspaceId: string): Promise<Character[]> {
    return db.select().from(characters).where(eq(characters.workspaceId, workspaceId));
  }

  async getCharacter(id: string): Promise<Character | undefined> {
    const [character] = await db.select().from(characters).where(eq(characters.id, id));
    return character;
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const [character] = await db
      .insert(characters)
      .values(insertCharacter)
      .returning();
    return character;
  }

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const [character] = await db
      .update(characters)
      .set(updates)
      .where(eq(characters.id, id))
      .returning();
    if (!character) {
      throw new Error(`Character with id ${id} not found`);
    }
    return character;
  }

  async deleteCharacter(id: string): Promise<void> {
    await db.delete(characters).where(eq(characters.id, id));
  }

  async getLocationsByWorkspaceId(workspaceId: string): Promise<Location[]> {
    return db
      .select()
      .from(locations)
      .where(eq(locations.workspaceId, workspaceId));
  }

  async getLocation(id: string): Promise<Location | undefined> {
    const [location] = await db
      .select()
      .from(locations)
      .where(eq(locations.id, id));
    return location;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db
      .insert(locations)
      .values(insertLocation)
      .returning();
    return location;
  }

  async updateLocation(id: string, updates: Partial<Location>): Promise<Location> {
    const [location] = await db
      .update(locations)
      .set(updates)
      .where(eq(locations.id, id))
      .returning();
    return location;
  }

  async deleteLocation(id: string): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }

  async getVoicesByWorkspaceId(workspaceId: string): Promise<Voice[]> {
    return db
      .select()
      .from(voices)
      .where(eq(voices.workspaceId, workspaceId));
  }

  async getVoice(id: string): Promise<Voice | undefined> {
    const [voice] = await db
      .select()
      .from(voices)
      .where(eq(voices.id, id));
    return voice;
  }

  async createVoice(insertVoice: InsertVoice): Promise<Voice> {
    const [voice] = await db
      .insert(voices)
      .values(insertVoice)
      .returning();
    return voice;
  }

  async updateVoice(id: string, updates: Partial<Voice>): Promise<Voice> {
    const [voice] = await db
      .update(voices)
      .set(updates)
      .where(eq(voices.id, id))
      .returning();
    return voice;
  }

  async deleteVoice(id: string): Promise<void> {
    await db.delete(voices).where(eq(voices.id, id));
  }

  async getBrandkitsByWorkspaceId(workspaceId: string): Promise<Brandkit[]> {
    return db
      .select()
      .from(brandkits)
      .where(eq(brandkits.workspaceId, workspaceId));
  }

  async getBrandkit(id: string): Promise<Brandkit | undefined> {
    const [brandkit] = await db
      .select()
      .from(brandkits)
      .where(eq(brandkits.id, id));
    return brandkit;
  }

  async createBrandkit(insertBrandkit: InsertBrandkit): Promise<Brandkit> {
    const [brandkit] = await db
      .insert(brandkits)
      .values(insertBrandkit)
      .returning();
    return brandkit;
  }

  async updateBrandkit(id: string, updates: Partial<Brandkit>): Promise<Brandkit> {
    const [brandkit] = await db
      .update(brandkits)
      .set(updates)
      .where(eq(brandkits.id, id))
      .returning();
    return brandkit;
  }

  async deleteBrandkit(id: string): Promise<void> {
    await db.delete(brandkits).where(eq(brandkits.id, id));
  }

  async getUploadsByWorkspaceId(workspaceId: string): Promise<Upload[]> {
    return db
      .select()
      .from(uploads)
      .where(eq(uploads.workspaceId, workspaceId));
  }

  async getUpload(id: string): Promise<Upload | undefined> {
    const [upload] = await db
      .select()
      .from(uploads)
      .where(eq(uploads.id, id));
    return upload;
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const [upload] = await db
      .insert(uploads)
      .values(insertUpload)
      .returning();
    return upload;
  }

  async updateUpload(id: string, updates: Partial<Upload>): Promise<Upload> {
    const [upload] = await db
      .update(uploads)
      .set(updates)
      .where(eq(uploads.id, id))
      .returning();
    return upload;
  }

  async deleteUpload(id: string): Promise<void> {
    await db.delete(uploads).where(eq(uploads.id, id));
  }

  // NOTE: Content calendar methods removed - Late.dev is now the single source of truth
  // See server/calendar/ for the new calendar implementation

  // ========== WORKSPACE INTEGRATIONS - PostgreSQL Storage ==========
  
  async getWorkspaceIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]> {
    return db.select().from(workspaceIntegrations).where(eq(workspaceIntegrations.workspaceId, workspaceId));
  }

  async getWorkspaceIntegration(workspaceId: string, platform: string): Promise<WorkspaceIntegration | undefined> {
    const [integration] = await db.select().from(workspaceIntegrations).where(
      and(
        eq(workspaceIntegrations.workspaceId, workspaceId),
        eq(workspaceIntegrations.platform, platform)
      )
    );
    return integration;
  }

  async createWorkspaceIntegration(insertIntegration: InsertWorkspaceIntegration): Promise<WorkspaceIntegration> {
    // Check if integration already exists for this workspace + platform
    const existing = await this.getWorkspaceIntegration(
      insertIntegration.workspaceId,
      insertIntegration.platform
    );
    if (existing) {
      throw new Error(`Integration for ${insertIntegration.platform} already exists in this workspace`);
    }

    const [integration] = await db.insert(workspaceIntegrations).values({
      ...insertIntegration,
      isActive: insertIntegration.isActive ?? true,
    }).returning();
    
    return integration;
  }

  async updateWorkspaceIntegration(id: string, updates: Partial<WorkspaceIntegration>): Promise<WorkspaceIntegration> {
    const [updated] = await db.update(workspaceIntegrations)
      .set(updates)
      .where(eq(workspaceIntegrations.id, id))
      .returning();
    
    if (!updated) throw new Error('Workspace integration not found');
    return updated;
  }

  async deleteWorkspaceIntegration(id: string): Promise<void> {
    await db.delete(workspaceIntegrations).where(eq(workspaceIntegrations.id, id));
  }

  // Late.dev integration methods
  async updateWorkspaceLateProfile(workspaceId: string, lateProfileId: string): Promise<void> {
    await db.update(workspaces).set({ lateProfileId }).where(eq(workspaces.id, workspaceId));
  }

  async upsertLateIntegration(data: {
    workspaceId: string;
    platform: string;
    lateAccountId: string;
    platformUserId: string;
    platformUsername: string;
    platformProfileImage: string;
  }): Promise<WorkspaceIntegration> {
    // Check if integration already exists
    const existing = await this.getWorkspaceIntegration(data.workspaceId, data.platform);
    
    if (existing) {
      // Update existing in PostgreSQL
      const [updated] = await db.update(workspaceIntegrations)
        .set({
          source: 'late',
          lateAccountId: data.lateAccountId,
          platformUserId: data.platformUserId,
          platformUsername: data.platformUsername,
          platformProfileImage: data.platformProfileImage,
          isActive: true,
          lastSyncedAt: new Date(),
        })
        .where(eq(workspaceIntegrations.id, existing.id))
        .returning();
      
      return updated;
    }

    // Create new integration in PostgreSQL
    const [integration] = await db.insert(workspaceIntegrations).values({
      workspaceId: data.workspaceId,
      platform: data.platform,
      source: 'late',
      lateAccountId: data.lateAccountId,
      platformUserId: data.platformUserId,
      platformUsername: data.platformUsername,
      platformProfileImage: data.platformProfileImage,
      isActive: true,
      lastSyncedAt: new Date(),
    }).returning();
    
    return integration;
  }

  async getIntegrationByLateAccountId(lateAccountId: string): Promise<WorkspaceIntegration | undefined> {
    const [integration] = await db.select().from(workspaceIntegrations).where(
      eq(workspaceIntegrations.lateAccountId, lateAccountId)
    );
    return integration;
  }

  async getLateIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]> {
    return db.select().from(workspaceIntegrations).where(
      and(
        eq(workspaceIntegrations.workspaceId, workspaceId),
        eq(workspaceIntegrations.source, 'late')
      )
    );
  }

  // ═══════════ VIDEO CAMPAIGNS (Auto Video) ═══════════

  async getVideoCampaign(id: string): Promise<VideoCampaign | undefined> {
    const [campaign] = await db.select().from(videoCampaigns).where(eq(videoCampaigns.id, id));
    return campaign;
  }

  async getVideoCampaignsByUserId(userId: string): Promise<VideoCampaign[]> {
    return db.select().from(videoCampaigns).where(eq(videoCampaigns.userId, userId));
  }

  async getVideoCampaignsByWorkspaceId(workspaceId: string): Promise<VideoCampaign[]> {
    return db.select().from(videoCampaigns).where(eq(videoCampaigns.workspaceId, workspaceId));
  }

  async createVideoCampaign(campaign: InsertVideoCampaign): Promise<VideoCampaign> {
    const [created] = await db.insert(videoCampaigns).values(campaign).returning();
    return created;
  }

  async updateVideoCampaign(id: string, updates: Partial<VideoCampaign>): Promise<VideoCampaign> {
    const [updated] = await db.update(videoCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(videoCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteVideoCampaign(id: string): Promise<void> {
    await db.delete(videoCampaigns).where(eq(videoCampaigns.id, id));
  }

  // ═══════════ STORY CAMPAIGNS (Auto Story) ═══════════

  async getStoryCampaign(id: string): Promise<StoryCampaign | undefined> {
    const [campaign] = await db.select().from(storyCampaigns).where(eq(storyCampaigns.id, id));
    return campaign;
  }

  async getStoryCampaignsByUserId(userId: string): Promise<StoryCampaign[]> {
    return db.select().from(storyCampaigns).where(eq(storyCampaigns.userId, userId));
  }

  async getStoryCampaignsByWorkspaceId(workspaceId: string): Promise<StoryCampaign[]> {
    return db.select().from(storyCampaigns).where(eq(storyCampaigns.workspaceId, workspaceId));
  }

  async createStoryCampaign(campaign: InsertStoryCampaign): Promise<StoryCampaign> {
    const [created] = await db.insert(storyCampaigns).values(campaign).returning();
    return created;
  }

  async updateStoryCampaign(id: string, updates: Partial<StoryCampaign>): Promise<StoryCampaign> {
    const [updated] = await db.update(storyCampaigns)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(storyCampaigns.id, id))
      .returning();
    return updated;
  }

  async deleteStoryCampaign(id: string): Promise<void> {
    await db.delete(storyCampaigns).where(eq(storyCampaigns.id, id));
  }

  async deleteUserAccount(userId: string): Promise<void> {
    // Get all workspaces for this user
    const userWorkspaces = await this.getWorkspacesByUserId(userId);
    
    for (const workspace of userWorkspaces) {
      // Delete all videos in this workspace
      await db.delete(videos).where(eq(videos.workspaceId, workspace.id));
      
      // Delete stories
      const storiesList = Array.from(this.stories.values()).filter(s => s.workspaceId === workspace.id);
      for (const story of storiesList) {
        this.stories.delete(story.id);
      }
      
      // Delete characters
      const charactersList = await this.getCharactersByWorkspaceId(workspace.id);
      for (const char of charactersList) {
        this.characters.delete(char.id);
      }
      
      // Delete locations
      const locationsList = await this.getLocationsByWorkspaceId(workspace.id);
      for (const loc of locationsList) {
        this.locations.delete(loc.id);
      }
      
      // Delete voices
      const voicesList = await this.getVoicesByWorkspaceId(workspace.id);
      for (const voice of voicesList) {
        this.voices.delete(voice.id);
      }
      
      // Delete brandkits
      const brandkitsList = await this.getBrandkitsByWorkspaceId(workspace.id);
      for (const kit of brandkitsList) {
        await this.deleteBrandkit(kit.id);
      }
      
      // Delete uploads
      const uploadsList = await this.getUploadsByWorkspaceId(workspace.id);
      for (const upload of uploadsList) {
        this.uploads.delete(upload.id);
      }
      
      // NOTE: Content calendar cleanup not needed - Late.dev manages scheduled posts
      
      // Delete workspace integrations from PostgreSQL
      const integrations = await this.getWorkspaceIntegrations(workspace.id);
      for (const integration of integrations) {
        await this.deleteWorkspaceIntegration(integration.id);
      }
      
      // Delete workspace (uses database)
      await this.deleteWorkspace(workspace.id);
    }
    
    // Finally delete the user
    this.users.delete(userId);
  }
}

export const storage = new MemStorage();
