/**
 * Local storyboard types for client-side state management.
 * These types are used for managing scenes, shots, and related data
 * without database persistence. Data can later be saved to the
 * videos.storyboard JSONB column if needed.
 */

// Animation mode types
export type AnimationMode = 'image-transitions' | 'video-animation';
export type VideoGenerationMode = 'image-reference' | 'start-end-frame';
export type LoopType = 'seamless' | 'fade' | 'hard-cut';

/**
 * Step1Data - Atmosphere phase settings
 * Used for passing Phase 1 settings to Phase 4 for initialization
 */
export interface Step1Data {
  // Animation Mode
  animationMode: AnimationMode;
  videoGenerationMode?: VideoGenerationMode;
  
  // Image Settings
  imageModel: string;
  imageResolution: string;
  
  // Video Settings
  aspectRatio: string;
  duration: string;
  
  // Mood & Theme
  mood: string;
  theme: string;
  timeContext: string;
  season: string;
  userStory?: string;
  moodDescription: string;
  
  // Animation-specific settings
  defaultEasingStyle?: string;
  videoModel?: string;
  videoResolution?: string;
  motionPrompt?: string;
  transitionStyle?: string;
  
  // Pacing & Flow
  pacing: number;
  segmentEnabled: boolean;
  segmentCount: 'auto' | number;
  shotsPerSegment: 'auto' | number;
  
  // Loop Settings
  loopMode: boolean;
  loopType: LoopType;
  segmentLoopEnabled: boolean;
  segmentLoopCount: 'auto' | number;
  shotLoopEnabled: boolean;
  shotLoopCount: 'auto' | number;
  
  // Voiceover
  voiceoverEnabled: boolean;
  language?: string;
  textOverlayEnabled?: boolean;
  textOverlayStyle?: string;
}

export interface Scene {
  id: string;
  videoId: string;
  sceneNumber: number;
  title: string;
  description?: string | null;
  duration?: number | null;
  videoModel?: string | null;
  imageModel?: string | null;
  lighting?: string | null;
  weather?: string | null;
  loopCount?: number | null;  // Per-scene loop count (for Soundscape step)
  createdAt: Date;
}

export interface Shot {
  id: string;
  sceneId: string;
  shotNumber: number;
  shotType: string;
  cameraMovement: string;
  duration: number;
  description?: string | null;
  videoModel?: string | null;
  imageModel?: string | null;
  soundEffects?: string | null;
  transition?: string | null;
  currentVersionId?: string | null;
  speedProfile?: 'linear' | 'speed-ramp' | 'slow-motion' | 'kinetic' | 'smooth' | null;
  renderDuration?: number | null;
  frameMode?: "image-reference" | "start-end"; // Per-shot mode (only used when narrativeMode === "auto")
  characters?: string[];  // Array of @{CharacterName} tags (from shot composer)
  location?: string | null;  // @{LocationName} tag (from shot composer)
  // Soundscape step fields
  voiceoverText?: string | null;
  voiceoverUrl?: string | null;
  soundEffectDescription?: string | null;
  soundEffectUrl?: string | null;
  loopCount?: number | null;  // Per-shot loop count
  createdAt: Date;
  updatedAt: Date;
}

export interface ShotVersion {
  id: string;
  shotId: string;
  versionNumber: number;
  imagePrompt?: string | null;
  imageUrl?: string | null;
  startFramePrompt?: string | null;
  startFrameUrl?: string | null;
  endFramePrompt?: string | null;
  endFrameUrl?: string | null;
  videoPrompt?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  videoDuration?: number | null;
  actualDuration?: number | null;
  negativePrompt?: string | null;
  startFrameInherited?: boolean;  // True if start frame was inherited from previous shot
  status: string;
  needsRerender: boolean;
  createdAt: Date;
  videoGenerationMetadata?: {
    model: string;
    generationTime: number;
    resolution: string;
    error?: string;
  };
}

export interface ReferenceImage {
  id: string;
  videoId?: string | null;
  shotId?: string | null;
  characterId?: string | null;
  type: string;
  imageUrl: string;
  tempId?: string;  // Server-side temp storage ID for uploaded reference images
  description?: string | null;
  createdAt: Date;
}

export interface ContinuityGroup {
  id: string;
  sceneId: string;
  groupNumber: number;
  shotIds: string[];
  description?: string | null;
  transitionType?: string | null;
  status: string;
  editedBy?: string | null;
  editedAt?: Date | null;
  approvedAt?: Date | null;
  createdAt: Date;
}

export interface StoryScene {
  id: string;
  storyId: string;
  sceneNumber: number;
  imagePrompt?: string | null;
  imageUrl?: string | null;
  effect: string;
  voiceoverText?: string | null;
  duration: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  type: string;
  description?: string | null;
  settings?: unknown;
  thumbnailUrl?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full storyboard structure that can be stored in videos.storyboard JSONB column
 */
export interface Storyboard {
  scenes: Scene[];
  shots: Record<string, Shot[]>; // keyed by sceneId
  shotVersions: Record<string, ShotVersion[]>; // keyed by shotId
  referenceImages: ReferenceImage[];
  continuityGroups: ContinuityGroup[];
}

// Insert types for creating new records (without id and timestamps)
export type InsertScene = Omit<Scene, 'id' | 'createdAt'>;
export type InsertShot = Omit<Shot, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertShotVersion = Omit<ShotVersion, 'id' | 'createdAt'>;
export type InsertReferenceImage = Omit<ReferenceImage, 'id' | 'createdAt'>;
export type InsertContinuityGroup = Omit<ContinuityGroup, 'id' | 'createdAt'>;
export type InsertStoryScene = Omit<StoryScene, 'id' | 'createdAt' | 'updatedAt'>;
export type InsertProject = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

