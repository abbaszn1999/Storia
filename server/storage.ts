import {
  users,
  workspaces,
  projects,
  stories,
  characters,
  locations,
  voices,
  brandkits,
  uploads,
  type User,
  type UpsertUser,
  type Workspace,
  type InsertWorkspace,
  type Project,
  type InsertProject,
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
  type ContentCalendarItem,
  type InsertContentCalendar,
  type Scene,
  type InsertScene,
  type Shot,
  type InsertShot,
  type ShotVersion,
  type InsertShotVersion,
  type ReferenceImage,
  type InsertReferenceImage,
  type ContinuityGroup,
  type InsertContinuityGroup,
  type WorkspaceIntegration,
  type InsertWorkspaceIntegration,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function validateShotIds(shotIds: unknown): void {
  if (!Array.isArray(shotIds)) {
    throw new Error('shotIds must be an array');
  }
  for (const id of shotIds) {
    if (typeof id !== 'string' || !isValidUUID(id)) {
      throw new Error(`Invalid shot ID: ${id}. Must be a valid UUID.`);
    }
  }
}

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
  
  getProjectsByWorkspaceId(workspaceId: string): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<Project>): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  
  getVideosByWorkspaceId(workspaceId: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<Video>): Promise<Video>;
  
  getStoriesByWorkspaceId(workspaceId: string): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  
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
  
  getContentCalendarByWorkspaceId(workspaceId: string): Promise<ContentCalendarItem[]>;
  createContentCalendarItem(item: InsertContentCalendar): Promise<ContentCalendarItem>;
  
  getScenesByVideoId(videoId: string): Promise<Scene[]>;
  createScene(scene: InsertScene): Promise<Scene>;
  updateScene(id: string, scene: Partial<Scene>): Promise<Scene>;
  deleteScene(id: string): Promise<void>;
  
  getShotsBySceneId(sceneId: string): Promise<Shot[]>;
  createShot(shot: InsertShot): Promise<Shot>;
  updateShot(id: string, shot: Partial<Shot>): Promise<Shot>;
  deleteShot(id: string): Promise<void>;
  
  getShotVersionsByShotId(shotId: string): Promise<ShotVersion[]>;
  createShotVersion(version: InsertShotVersion): Promise<ShotVersion>;
  getShotVersion(id: string): Promise<ShotVersion | undefined>;
  updateShotVersion(id: string, version: Partial<ShotVersion>): Promise<ShotVersion>;
  deleteShotVersion(id: string): Promise<void>;
  
  getReferenceImagesByVideoId(videoId: string): Promise<ReferenceImage[]>;
  getReferenceImagesByCharacterId(characterId: string): Promise<ReferenceImage[]>;
  getReferenceImagesByShotId(shotId: string): Promise<ReferenceImage[]>;
  createReferenceImage(refImage: InsertReferenceImage): Promise<ReferenceImage>;
  deleteReferenceImage(id: string): Promise<void>;
  
  getContinuityGroupsBySceneId(sceneId: string): Promise<ContinuityGroup[]>;
  getContinuityGroupById(id: string): Promise<ContinuityGroup | undefined>;
  createContinuityGroup(group: InsertContinuityGroup): Promise<ContinuityGroup>;
  updateContinuityGroup(id: string, group: Partial<ContinuityGroup>): Promise<ContinuityGroup>;
  deleteContinuityGroup(id: string): Promise<void>;
  deleteContinuityGroupsBySceneId(sceneId: string): Promise<void>;
  
  getWorkspaceIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]>;
  getWorkspaceIntegration(workspaceId: string, platform: string): Promise<WorkspaceIntegration | undefined>;
  createWorkspaceIntegration(integration: InsertWorkspaceIntegration): Promise<WorkspaceIntegration>;
  updateWorkspaceIntegration(id: string, integration: Partial<WorkspaceIntegration>): Promise<WorkspaceIntegration>;
  deleteWorkspaceIntegration(id: string): Promise<void>;
  
  // Account management
  deleteUserAccount(userId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspacesMap: Map<string, Workspace>;
  private projectsMap: Map<string, Project>;
  private videos: Map<string, Video>;
  private stories: Map<string, Story>;
  private characters: Map<string, Character>;
  private locations: Map<string, Location>;
  private voices: Map<string, Voice>;
  private uploads: Map<string, Upload>;
  private contentCalendar: Map<string, ContentCalendarItem>;
  private scenes: Map<string, Scene>;
  private shots: Map<string, Shot>;
  private shotVersions: Map<string, ShotVersion>;
  private referenceImages: Map<string, ReferenceImage>;
  private continuityGroups: Map<string, ContinuityGroup>;
  private workspaceIntegrations: Map<string, WorkspaceIntegration>;

  constructor() {
    this.users = new Map();
    this.workspacesMap = new Map();
    this.projectsMap = new Map();
    this.videos = new Map();
    this.stories = new Map();
    this.characters = new Map();
    this.locations = new Map();
    this.voices = new Map();
    this.uploads = new Map();
    this.contentCalendar = new Map();
    this.scenes = new Map();
    this.shots = new Map();
    this.shotVersions = new Map();
    this.referenceImages = new Map();
    this.continuityGroups = new Map();
    this.workspaceIntegrations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    const memUser = this.users.get(id);
    if (memUser) return memUser;
    
    const [dbUser] = await db.select().from(users).where(eq(users.id, id));
    return dbUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    const [dbUser] = await db.select().from(users).where(eq(users.email, email));
    return dbUser;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
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
    await db.delete(workspaces).where(eq(workspaces.id, id));
  }

  async countUserWorkspaces(userId: string): Promise<number> {
    const result = await db.select().from(workspaces).where(eq(workspaces.userId, userId));
    return result.length;
  }

  async getProjectsByWorkspaceId(workspaceId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.workspaceId, workspaceId));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getVideosByWorkspaceId(workspaceId: string): Promise<Video[]> {
    return Array.from(this.videos.values()).filter((v) => v.workspaceId === workspaceId);
  }

  async getVideo(id: string): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = {
      ...insertVideo,
      id,
      status: insertVideo.status ?? "draft",
      narrativeMode: insertVideo.narrativeMode ?? null,
      script: insertVideo.script ?? null,
      scenes: insertVideo.scenes ?? null,
      worldSettings: insertVideo.worldSettings ?? null,
      cast: insertVideo.cast ?? null,
      storyboard: insertVideo.storyboard ?? null,
      exportUrl: insertVideo.exportUrl ?? null,
      duration: insertVideo.duration ?? null,
      voiceActorId: insertVideo.voiceActorId ?? null,
      voiceOverEnabled: insertVideo.voiceOverEnabled ?? true,
      continuityLocked: insertVideo.continuityLocked ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.videos.set(id, video);
    return video;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video> {
    const video = this.videos.get(id);
    if (!video) throw new Error('Video not found');
    const updated = { ...video, ...updates, updatedAt: new Date() };
    this.videos.set(id, updated);
    return updated;
  }

  async getStoriesByWorkspaceId(workspaceId: string): Promise<Story[]> {
    return db.select().from(stories).where(eq(stories.workspaceId, workspaceId));
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

  async getContentCalendarByWorkspaceId(workspaceId: string): Promise<ContentCalendarItem[]> {
    return Array.from(this.contentCalendar.values()).filter((c) => c.workspaceId === workspaceId);
  }

  async createContentCalendarItem(insertItem: InsertContentCalendar): Promise<ContentCalendarItem> {
    const id = randomUUID();
    const item: ContentCalendarItem = {
      ...insertItem,
      id,
      videoId: insertItem.videoId ?? null,
      storyId: insertItem.storyId ?? null,
      status: insertItem.status ?? "scheduled",
      publishedUrl: insertItem.publishedUrl ?? null,
      createdAt: new Date(),
    };
    this.contentCalendar.set(id, item);
    return item;
  }

  async getScenesByVideoId(videoId: string): Promise<Scene[]> {
    return Array.from(this.scenes.values()).filter((s) => s.videoId === videoId);
  }

  async createScene(insertScene: InsertScene): Promise<Scene> {
    const id = randomUUID();
    const scene: Scene = {
      ...insertScene,
      id,
      description: insertScene.description ?? null,
      location: insertScene.location ?? null,
      timeOfDay: insertScene.timeOfDay ?? null,
      duration: insertScene.duration ?? null,
      videoModel: insertScene.videoModel ?? null,
      imageModel: insertScene.imageModel ?? null,
      lighting: insertScene.lighting ?? null,
      weather: insertScene.weather ?? null,
      createdAt: new Date(),
    };
    this.scenes.set(id, scene);
    return scene;
  }

  async updateScene(id: string, updates: Partial<Scene>): Promise<Scene> {
    const scene = this.scenes.get(id);
    if (!scene) throw new Error('Scene not found');
    const updated = { ...scene, ...updates };
    this.scenes.set(id, updated);
    return updated;
  }

  async deleteScene(id: string): Promise<void> {
    const sceneShots = await this.getShotsBySceneId(id);
    for (const shot of sceneShots) {
      await this.deleteShot(shot.id);
    }
    this.scenes.delete(id);
  }

  async getShotsBySceneId(sceneId: string): Promise<Shot[]> {
    return Array.from(this.shots.values()).filter((s) => s.sceneId === sceneId);
  }

  async createShot(insertShot: InsertShot): Promise<Shot> {
    const id = randomUUID();
    const shot: Shot = {
      ...insertShot,
      id,
      cameraMovement: insertShot.cameraMovement ?? "static",
      description: insertShot.description ?? null,
      videoModel: insertShot.videoModel ?? null,
      imageModel: insertShot.imageModel ?? null,
      soundEffects: insertShot.soundEffects ?? null,
      currentVersionId: insertShot.currentVersionId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.shots.set(id, shot);
    return shot;
  }

  async updateShot(id: string, updates: Partial<Shot>): Promise<Shot> {
    const shot = this.shots.get(id);
    if (!shot) throw new Error('Shot not found');
    const updated = { ...shot, ...updates, updatedAt: new Date() };
    this.shots.set(id, updated);
    return updated;
  }

  async deleteShot(id: string): Promise<void> {
    const versions = await this.getShotVersionsByShotId(id);
    for (const version of versions) {
      this.shotVersions.delete(version.id);
    }
    
    const refImages = await this.getReferenceImagesByShotId(id);
    for (const refImage of refImages) {
      this.referenceImages.delete(refImage.id);
    }
    
    this.shots.delete(id);
  }

  async getShotVersionsByShotId(shotId: string): Promise<ShotVersion[]> {
    return Array.from(this.shotVersions.values()).filter((sv) => sv.shotId === shotId);
  }

  async createShotVersion(insertVersion: InsertShotVersion): Promise<ShotVersion> {
    const id = randomUUID();
    const version: ShotVersion = {
      ...insertVersion,
      id,
      imagePrompt: insertVersion.imagePrompt ?? null,
      imageUrl: insertVersion.imageUrl ?? null,
      startFramePrompt: insertVersion.startFramePrompt ?? null,
      startFrameUrl: insertVersion.startFrameUrl ?? null,
      endFramePrompt: insertVersion.endFramePrompt ?? null,
      endFrameUrl: insertVersion.endFrameUrl ?? null,
      videoPrompt: insertVersion.videoPrompt ?? null,
      videoUrl: insertVersion.videoUrl ?? null,
      videoDuration: insertVersion.videoDuration ?? null,
      status: insertVersion.status ?? "draft",
      needsRerender: insertVersion.needsRerender ?? false,
      createdAt: new Date(),
    };
    this.shotVersions.set(id, version);
    
    if (version.status === 'approved') {
      const allVersions = await this.getShotVersionsByShotId(version.shotId);
      for (const v of allVersions) {
        if (v.id !== id && v.status === 'approved') {
          this.shotVersions.set(v.id, { ...v, status: 'rejected' });
        }
      }
      
      const shot = this.shots.get(version.shotId);
      if (shot) {
        shot.currentVersionId = id;
        shot.updatedAt = new Date();
        this.shots.set(shot.id, shot);
      }
    }
    
    return version;
  }

  async getShotVersion(id: string): Promise<ShotVersion | undefined> {
    return this.shotVersions.get(id);
  }

  async updateShotVersion(id: string, updates: Partial<ShotVersion>): Promise<ShotVersion> {
    const version = this.shotVersions.get(id);
    if (!version) throw new Error('Shot version not found');
    const oldStatus = version.status;
    const updated = { ...version, ...updates };
    const newStatus = updates.status !== undefined ? updates.status : oldStatus;
    this.shotVersions.set(id, updated);
    
    const shot = this.shots.get(version.shotId);
    if (!shot) return updated;
    
    if (newStatus === 'approved') {
      const allVersions = Array.from(this.shotVersions.values())
        .filter((v) => v.shotId === version.shotId && v.id !== id);
      
      for (const v of allVersions) {
        if (v.status === 'approved') {
          this.shotVersions.set(v.id, { ...v, status: 'rejected' });
        }
      }
      
      shot.currentVersionId = id;
      shot.updatedAt = new Date();
      this.shots.set(shot.id, shot);
    } else if (oldStatus === 'approved' && newStatus !== 'approved') {
      if (shot.currentVersionId === id) {
        shot.currentVersionId = null;
        shot.updatedAt = new Date();
        this.shots.set(shot.id, shot);
      }
    }
    
    return updated;
  }

  async deleteShotVersion(id: string): Promise<void> {
    const version = this.shotVersions.get(id);
    if (!version) return;
    
    const shot = this.shots.get(version.shotId);
    if (shot && shot.currentVersionId === id) {
      shot.currentVersionId = null;
      shot.updatedAt = new Date();
      this.shots.set(shot.id, shot);
    }
    
    this.shotVersions.delete(id);
  }

  async getReferenceImagesByVideoId(videoId: string): Promise<ReferenceImage[]> {
    return Array.from(this.referenceImages.values()).filter((ri) => ri.videoId === videoId);
  }

  async getReferenceImagesByCharacterId(characterId: string): Promise<ReferenceImage[]> {
    return Array.from(this.referenceImages.values()).filter((ri) => ri.characterId === characterId);
  }

  async getReferenceImagesByShotId(shotId: string): Promise<ReferenceImage[]> {
    return Array.from(this.referenceImages.values()).filter((ri) => ri.shotId === shotId);
  }

  async createReferenceImage(insertRefImage: InsertReferenceImage): Promise<ReferenceImage> {
    const id = randomUUID();
    const refImage: ReferenceImage = {
      ...insertRefImage,
      id,
      videoId: insertRefImage.videoId ?? null,
      shotId: insertRefImage.shotId ?? null,
      characterId: insertRefImage.characterId ?? null,
      description: insertRefImage.description ?? null,
      createdAt: new Date(),
    };
    this.referenceImages.set(id, refImage);
    return refImage;
  }

  async deleteReferenceImage(id: string): Promise<void> {
    this.referenceImages.delete(id);
  }

  async getContinuityGroupsBySceneId(sceneId: string): Promise<ContinuityGroup[]> {
    return Array.from(this.continuityGroups.values()).filter((cg) => cg.sceneId === sceneId);
  }

  async getContinuityGroupById(id: string): Promise<ContinuityGroup | undefined> {
    return this.continuityGroups.get(id);
  }

  async createContinuityGroup(insertGroup: InsertContinuityGroup): Promise<ContinuityGroup> {
    validateShotIds(insertGroup.shotIds);
    
    const id = randomUUID();
    const group: ContinuityGroup = {
      ...insertGroup,
      id,
      description: insertGroup.description ?? null,
      transitionType: insertGroup.transitionType ?? null,
      createdAt: new Date(),
    };
    this.continuityGroups.set(id, group);
    return group;
  }

  async updateContinuityGroup(id: string, updates: Partial<ContinuityGroup>): Promise<ContinuityGroup> {
    const group = this.continuityGroups.get(id);
    if (!group) throw new Error('Continuity group not found');
    
    if (updates.shotIds !== undefined) {
      validateShotIds(updates.shotIds);
    }
    
    const updated = { ...group, ...updates };
    this.continuityGroups.set(id, updated);
    return updated;
  }

  async deleteContinuityGroup(id: string): Promise<void> {
    this.continuityGroups.delete(id);
  }

  async deleteContinuityGroupsBySceneId(sceneId: string): Promise<void> {
    const groups = await this.getContinuityGroupsBySceneId(sceneId);
    for (const group of groups) {
      this.continuityGroups.delete(group.id);
    }
  }

  async getWorkspaceIntegrations(workspaceId: string): Promise<WorkspaceIntegration[]> {
    return Array.from(this.workspaceIntegrations.values()).filter(
      (integration) => integration.workspaceId === workspaceId
    );
  }

  async getWorkspaceIntegration(workspaceId: string, platform: string): Promise<WorkspaceIntegration | undefined> {
    return Array.from(this.workspaceIntegrations.values()).find(
      (integration) => integration.workspaceId === workspaceId && integration.platform === platform
    );
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

    const id = randomUUID();
    const integration: WorkspaceIntegration = {
      ...insertIntegration,
      id,
      accessToken: insertIntegration.accessToken ?? null,
      refreshToken: insertIntegration.refreshToken ?? null,
      tokenExpiresAt: insertIntegration.tokenExpiresAt ?? null,
      platformUserId: insertIntegration.platformUserId ?? null,
      platformUsername: insertIntegration.platformUsername ?? null,
      platformProfileImage: insertIntegration.platformProfileImage ?? null,
      isActive: insertIntegration.isActive ?? true,
      lastSyncedAt: insertIntegration.lastSyncedAt ?? null,
      createdAt: new Date(),
    };
    this.workspaceIntegrations.set(id, integration);
    return integration;
  }

  async updateWorkspaceIntegration(id: string, updates: Partial<WorkspaceIntegration>): Promise<WorkspaceIntegration> {
    const integration = this.workspaceIntegrations.get(id);
    if (!integration) throw new Error('Workspace integration not found');
    const updated = { ...integration, ...updates };
    this.workspaceIntegrations.set(id, updated);
    return updated;
  }

  async deleteWorkspaceIntegration(id: string): Promise<void> {
    this.workspaceIntegrations.delete(id);
  }

  async deleteUserAccount(userId: string): Promise<void> {
    // Get all workspaces for this user
    const userWorkspaces = await this.getWorkspacesByUserId(userId);
    
    for (const workspace of userWorkspaces) {
      // Delete all videos and related data in this workspace
      const videos = await this.getVideosByWorkspaceId(workspace.id);
      for (const video of videos) {
        // Delete scenes and shots
        const scenes = await this.getScenesByVideoId(video.id);
        for (const scene of scenes) {
          const shots = await this.getShotsBySceneId(scene.id);
          for (const shot of shots) {
            const versions = await this.getShotVersionsByShotId(shot.id);
            for (const version of versions) {
              this.shotVersions.delete(version.id);
            }
            this.shots.delete(shot.id);
          }
          await this.deleteContinuityGroupsBySceneId(scene.id);
          this.scenes.delete(scene.id);
        }
        // Delete reference images for video
        const refImages = await this.getReferenceImagesByVideoId(video.id);
        for (const img of refImages) {
          this.referenceImages.delete(img.id);
        }
        this.videos.delete(video.id);
      }
      
      // Delete stories
      const stories = Array.from(this.stories.values()).filter(s => s.workspaceId === workspace.id);
      for (const story of stories) {
        this.stories.delete(story.id);
      }
      
      // Delete characters
      const characters = await this.getCharactersByWorkspaceId(workspace.id);
      for (const char of characters) {
        this.characters.delete(char.id);
      }
      
      // Delete locations
      const locations = await this.getLocationsByWorkspaceId(workspace.id);
      for (const loc of locations) {
        this.locations.delete(loc.id);
      }
      
      // Delete voices
      const voices = await this.getVoicesByWorkspaceId(workspace.id);
      for (const voice of voices) {
        this.voices.delete(voice.id);
      }
      
      // Delete brandkits
      const brandkits = await this.getBrandkitsByWorkspaceId(workspace.id);
      for (const kit of brandkits) {
        await this.deleteBrandkit(kit.id);
      }
      
      // Delete uploads
      const uploads = await this.getUploadsByWorkspaceId(workspace.id);
      for (const upload of uploads) {
        this.uploads.delete(upload.id);
      }
      
      // Delete content calendar items
      const calendar = await this.getContentCalendarByWorkspaceId(workspace.id);
      for (const item of calendar) {
        this.contentCalendar.delete(item.id);
      }
      
      // Delete workspace integrations
      const integrations = await this.getWorkspaceIntegrations(workspace.id);
      for (const integration of integrations) {
        this.workspaceIntegrations.delete(integration.id);
      }
      
      // Delete projects
      const projectsList = await this.getProjectsByWorkspaceId(workspace.id);
      for (const project of projectsList) {
        await this.deleteProject(project.id);
      }
      
      // Delete workspace (uses database)
      await this.deleteWorkspace(workspace.id);
    }
    
    // Finally delete the user
    this.users.delete(userId);
  }
}

export const storage = new MemStorage();
