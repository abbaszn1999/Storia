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
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getWorkspacesByUserId(userId: string): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  
  getVideosByWorkspaceId(workspaceId: string): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  
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

  async getVideosByWorkspaceId(workspaceId: string): Promise<Video[]> {
    return Array.from(this.videos.values()).filter((v) => v.workspaceId === workspaceId);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = randomUUID();
    const video: Video = {
      ...insertVideo,
      id,
      status: insertVideo.status ?? "draft",
      script: insertVideo.script ?? null,
      scenes: insertVideo.scenes ?? null,
      worldSettings: insertVideo.worldSettings ?? null,
      cast: insertVideo.cast ?? null,
      storyboard: insertVideo.storyboard ?? null,
      exportUrl: insertVideo.exportUrl ?? null,
      duration: insertVideo.duration ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.videos.set(id, video);
    return video;
  }

  async getStoriesByWorkspaceId(workspaceId: string): Promise<Story[]> {
    return Array.from(this.stories.values()).filter((s) => s.workspaceId === workspaceId);
  }

  async createStory(insertStory: InsertStory): Promise<Story> {
    const id = randomUUID();
    const story: Story = {
      ...insertStory,
      id,
      content: insertStory.content ?? null,
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
}

export const storage = new MemStorage();
