import {
  type User,
  type InsertUser,
  type Workspace,
  type InsertWorkspace,
  type Video,
  type InsertVideo,
  type Story,
  type InsertStory,
  type Character,
  type InsertCharacter,
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
  type ProductionCampaign,
  type InsertProductionCampaign,
  type CampaignVideo,
  type InsertCampaignVideo,
} from "@shared/schema";
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
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  updateWorkspace(id: string, workspace: Partial<Workspace>): Promise<Workspace>;
  
  getVideosByWorkspaceId(workspaceId: string): Promise<Video[]>;
  getVideo(id: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, video: Partial<Video>): Promise<Video>;
  
  getStoriesByWorkspaceId(workspaceId: string): Promise<Story[]>;
  createStory(story: InsertStory): Promise<Story>;
  
  getCharactersByWorkspaceId(workspaceId: string): Promise<Character[]>;
  createCharacter(character: InsertCharacter): Promise<Character>;
  
  getVoicesByWorkspaceId(workspaceId: string): Promise<Voice[]>;
  createVoice(voice: InsertVoice): Promise<Voice>;
  
  getBrandkitsByWorkspaceId(workspaceId: string): Promise<Brandkit[]>;
  createBrandkit(brandkit: InsertBrandkit): Promise<Brandkit>;
  
  getUploadsByWorkspaceId(workspaceId: string): Promise<Upload[]>;
  createUpload(upload: InsertUpload): Promise<Upload>;
  
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
  
  getCampaignsByUserId(userId: string): Promise<ProductionCampaign[]>;
  getCampaign(id: string): Promise<ProductionCampaign | undefined>;
  createCampaign(campaign: InsertProductionCampaign): Promise<ProductionCampaign>;
  updateCampaign(id: string, campaign: Partial<ProductionCampaign>): Promise<ProductionCampaign>;
  deleteCampaign(id: string): Promise<void>;
  getCampaignVideos(campaignId: string): Promise<CampaignVideo[]>;
  getCampaignVideo(id: string): Promise<CampaignVideo | undefined>;
  createCampaignVideo(video: InsertCampaignVideo): Promise<CampaignVideo>;
  updateCampaignVideo(id: string, video: Partial<CampaignVideo>): Promise<CampaignVideo>;
  deleteCampaignVideo(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private workspaces: Map<string, Workspace>;
  private videos: Map<string, Video>;
  private stories: Map<string, Story>;
  private characters: Map<string, Character>;
  private voices: Map<string, Voice>;
  private brandkits: Map<string, Brandkit>;
  private uploads: Map<string, Upload>;
  private contentCalendar: Map<string, ContentCalendarItem>;
  private scenes: Map<string, Scene>;
  private shots: Map<string, Shot>;
  private shotVersions: Map<string, ShotVersion>;
  private referenceImages: Map<string, ReferenceImage>;
  private continuityGroups: Map<string, ContinuityGroup>;
  private workspaceIntegrations: Map<string, WorkspaceIntegration>;
  private productionCampaigns: Map<string, ProductionCampaign>;
  private campaignVideos: Map<string, CampaignVideo>;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.videos = new Map();
    this.stories = new Map();
    this.characters = new Map();
    this.voices = new Map();
    this.brandkits = new Map();
    this.uploads = new Map();
    this.contentCalendar = new Map();
    this.scenes = new Map();
    this.shots = new Map();
    this.shotVersions = new Map();
    this.referenceImages = new Map();
    this.continuityGroups = new Map();
    this.workspaceIntegrations = new Map();
    this.productionCampaigns = new Map();
    this.campaignVideos = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      credits: insertUser.credits ?? 0,
      subscriptionTier: insertUser.subscriptionTier ?? "free",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getWorkspacesByUserId(userId: string): Promise<Workspace[]> {
    return Array.from(this.workspaces.values()).filter((ws) => ws.userId === userId);
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const id = randomUUID();
    const workspace: Workspace = {
      ...insertWorkspace,
      id,
      description: insertWorkspace.description ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workspaces.set(id, workspace);
    return workspace;
  }

  async updateWorkspace(id: string, updates: Partial<Workspace>): Promise<Workspace> {
    const workspace = this.workspaces.get(id);
    if (!workspace) {
      throw new Error(`Workspace with id ${id} not found`);
    }
    const updated: Workspace = {
      ...workspace,
      ...updates,
      id: workspace.id,
      userId: workspace.userId,
      createdAt: workspace.createdAt,
      updatedAt: new Date(),
    };
    this.workspaces.set(id, updated);
    return updated;
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
    return Array.from(this.stories.values()).filter((s) => s.workspaceId === workspaceId);
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    const story: Story = {
      ...insertStory,
      id,
      script: insertStory.script ?? null,
      aspectRatio: insertStory.aspectRatio ?? "9:16",
      duration: insertStory.duration ?? null,
      imageModel: insertStory.imageModel ?? null,
      voiceProfileId: insertStory.voiceProfileId ?? null,
      voiceoverUrl: insertStory.voiceoverUrl ?? null,
      status: insertStory.status ?? "draft",
      exportUrl: insertStory.exportUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.stories.set(id, story);
    return story;
  }

  async getCharactersByWorkspaceId(workspaceId: string): Promise<Character[]> {
    return Array.from(this.characters.values()).filter((c) => c.workspaceId === workspaceId);
  }

  async createCharacter(insertCharacter: InsertCharacter): Promise<Character> {
    const id = randomUUID();
    const character: Character = {
      ...insertCharacter,
      id,
      description: insertCharacter.description ?? null,
      personality: insertCharacter.personality ?? null,
      appearance: insertCharacter.appearance ?? null,
      voiceSettings: insertCharacter.voiceSettings ?? null,
      thumbnailUrl: insertCharacter.thumbnailUrl ?? null,
      createdAt: new Date(),
    };
    this.characters.set(id, character);
    return character;
  }

  async getVoicesByWorkspaceId(workspaceId: string): Promise<Voice[]> {
    return Array.from(this.voices.values()).filter((v) => v.workspaceId === workspaceId);
  }

  async createVoice(insertVoice: InsertVoice): Promise<Voice> {
    const id = randomUUID();
    const voice: Voice = {
      ...insertVoice,
      id,
      settings: insertVoice.settings ?? null,
      sampleUrl: insertVoice.sampleUrl ?? null,
      createdAt: new Date(),
    };
    this.voices.set(id, voice);
    return voice;
  }

  async getBrandkitsByWorkspaceId(workspaceId: string): Promise<Brandkit[]> {
    return Array.from(this.brandkits.values()).filter((b) => b.workspaceId === workspaceId);
  }

  async createBrandkit(insertBrandkit: InsertBrandkit): Promise<Brandkit> {
    const id = randomUUID();
    const brandkit: Brandkit = {
      ...insertBrandkit,
      id,
      colors: insertBrandkit.colors ?? null,
      fonts: insertBrandkit.fonts ?? null,
      logos: insertBrandkit.logos ?? null,
      guidelines: insertBrandkit.guidelines ?? null,
      createdAt: new Date(),
    };
    this.brandkits.set(id, brandkit);
    return brandkit;
  }

  async getUploadsByWorkspaceId(workspaceId: string): Promise<Upload[]> {
    return Array.from(this.uploads.values()).filter((u) => u.workspaceId === workspaceId);
  }

  async createUpload(insertUpload: InsertUpload): Promise<Upload> {
    const id = randomUUID();
    const upload: Upload = {
      ...insertUpload,
      id,
      createdAt: new Date(),
    };
    this.uploads.set(id, upload);
    return upload;
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

  async getCampaignsByUserId(userId: string): Promise<ProductionCampaign[]> {
    return Array.from(this.productionCampaigns.values()).filter(
      (campaign) => campaign.userId === userId
    );
  }

  async getCampaign(id: string): Promise<ProductionCampaign | undefined> {
    return this.productionCampaigns.get(id);
  }

  async createCampaign(insertCampaign: InsertProductionCampaign): Promise<ProductionCampaign> {
    const id = randomUUID();
    const campaign: ProductionCampaign = {
      ...insertCampaign,
      id,
      status: insertCampaign.status ?? "draft",
      automationMode: insertCampaign.automationMode ?? "manual",
      aspectRatio: insertCampaign.aspectRatio ?? "16:9",
      duration: insertCampaign.duration ?? 60,
      language: insertCampaign.language ?? "en",
      distributionPattern: insertCampaign.distributionPattern ?? "even",
      selectedPlatforms: insertCampaign.selectedPlatforms ?? [],
      targetAudience: insertCampaign.targetAudience ?? null,
      scheduleStartDate: insertCampaign.scheduleStartDate ?? null,
      scheduleEndDate: insertCampaign.scheduleEndDate ?? null,
      scriptModel: insertCampaign.scriptModel ?? null,
      imageModel: insertCampaign.imageModel ?? null,
      videoModel: insertCampaign.videoModel ?? null,
      voiceActorId: insertCampaign.voiceActorId ?? null,
      videosGenerated: 0,
      videosPublished: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.productionCampaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: string, updates: Partial<ProductionCampaign>): Promise<ProductionCampaign> {
    const campaign = this.productionCampaigns.get(id);
    if (!campaign) throw new Error('Production campaign not found');
    const updated = { ...campaign, ...updates, updatedAt: new Date() };
    this.productionCampaigns.set(id, updated);
    return updated;
  }

  async deleteCampaign(id: string): Promise<void> {
    this.productionCampaigns.delete(id);
    const videos = await this.getCampaignVideos(id);
    for (const video of videos) {
      this.campaignVideos.delete(video.id);
    }
  }

  async getCampaignVideos(campaignId: string): Promise<CampaignVideo[]> {
    return Array.from(this.campaignVideos.values()).filter(
      (video) => video.campaignId === campaignId
    );
  }

  async getCampaignVideo(id: string): Promise<CampaignVideo | undefined> {
    return this.campaignVideos.get(id);
  }

  async createCampaignVideo(insertVideo: InsertCampaignVideo): Promise<CampaignVideo> {
    const id = randomUUID();
    const video: CampaignVideo = {
      ...insertVideo,
      id,
      videoId: insertVideo.videoId ?? null,
      script: insertVideo.script ?? null,
      status: insertVideo.status ?? "pending",
      generationProgress: insertVideo.generationProgress ?? 0,
      scheduledPublishDate: insertVideo.scheduledPublishDate ?? null,
      actualPublishDate: insertVideo.actualPublishDate ?? null,
      metadata: insertVideo.metadata ?? null,
      errorMessage: insertVideo.errorMessage ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.campaignVideos.set(id, video);
    return video;
  }

  async updateCampaignVideo(id: string, updates: Partial<CampaignVideo>): Promise<CampaignVideo> {
    const video = this.campaignVideos.get(id);
    if (!video) throw new Error('Campaign video not found');
    const updated = { ...video, ...updates, updatedAt: new Date() };
    this.campaignVideos.set(id, updated);
    return updated;
  }

  async deleteCampaignVideo(id: string): Promise<void> {
    this.campaignVideos.delete(id);
  }
}

export const storage = new MemStorage();
