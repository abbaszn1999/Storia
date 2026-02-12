/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO-VIDEO TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Type definitions for auto-video campaign generation.
 * Each mode has its own agents under auto-video/modes/{mode}/agents.
 */

import type { VideoCampaign } from '@shared/schema';

// ═══════════════════════════════════════════════════════════════
// VIDEO MODES
// ═══════════════════════════════════════════════════════════════

/**
 * Supported video modes for auto-video campaigns
 * 
 * Note: 'ambient' and 'ambient-visual' are the same mode.
 * - 'ambient' is used in the videos table (for consistency with existing videos)
 * - 'ambient-visual' is used in campaigns (descriptive name)
 */
export type VideoMode = 
  | 'ambient'              // Primary name (used in videos table)
  | 'ambient-visual'       // Alias for ambient (used in campaigns)
  | 'narrative'
  | 'character-vlog'
  | 'social-commerce'
  | 'logo-animation'
  | 'podcast';

// ═══════════════════════════════════════════════════════════════
// MODE-SPECIFIC SETTINGS
// ═══════════════════════════════════════════════════════════════

/**
 * Settings for ambient-visual mode
 * Matches the frontend AmbientCampaignSettings structure exactly
 */
export interface AmbientCampaignSettings {
  // Animation Mode
  animationMode: 'image-transitions' | 'video-animation';
  videoGenerationMode?: 'image-reference' | 'start-end-frame';
  
  // Core Atmosphere
  mood: string;
  theme: string;
  timeContext: string;
  season: string;
  intensity: number;
  
  // Duration & Format
  duration: string;
  aspectRatio: string;
  language: 'en' | 'ar';
  
  // Image Generation
  imageModel: string;
  imageResolution: string;
  imageStyle: string;
  
  // Video Generation (for video-animation mode)
  videoModel?: string;
  videoResolution?: string;
  motionPrompt?: string;
  
  // Image Transitions (for image-transitions mode)
  defaultEasingStyle?: string;
  transitionStyle?: string;
  mediaType?: string;
  
  // Pacing & Segments
  pacing: {
    pacing: number;
    segmentEnabled: boolean;
    segmentCount: 'auto' | number;
    shotsPerSegmentEnabled: boolean;
    shotsPerSegment: 'auto' | number;
  };
  
  // Loop Settings
  loops: {
    loopMode: boolean;
    loopType: 'seamless' | 'fade' | 'hard-cut';
    segmentLoopEnabled: boolean;
    segmentLoopCount: 'auto' | number;
    shotLoopEnabled: boolean;
    shotLoopCount: 'auto' | number;
  };
  
  // Visual World (Step 2)
  visual: {
    artStyle: string;
    visualElements: string[];
    visualRhythm: string;
    referenceImages: Array<{ tempId?: string; previewUrl?: string; originalName?: string }> | string[];
    imageCustomInstructions?: string;
  };
  
  // Soundscape (Audio & Voiceover)
  soundscape: {
    backgroundMusicEnabled: boolean;
    musicStyle: string;
    customMusicUrl?: string;
    customMusicDuration?: number;
    hasCustomMusic?: boolean;
    musicVolume: number;
    voiceoverEnabled: boolean;
    voiceoverStory?: string;
    voiceId?: string;
    language: 'en' | 'ar';
    ambientSoundsEnabled: boolean;
    ambientSoundType?: string;
    ambientSoundsVolume: number;
    textOverlayEnabled: boolean;
    textOverlayStyle?: string;
  };
  
  // Publishing (Auto-publish to social platforms)
  publishing?: {
    enabled: boolean;
    platforms: Array<'youtube' | 'tiktok' | 'instagram' | 'facebook'>;
    scheduleMode: 'immediate' | 'scheduled' | 'continuous';
    scheduledFor?: string; // ISO date for 'scheduled' mode
    continuousSettings?: ContinuousScheduleOptions;
  };
  
  // Allow additional properties for flexibility
  [key: string]: any;
}

/**
 * Settings for narrative mode
 */
export interface NarrativeSettings {
  duration?: number;
  aspectRatio?: string;
  resolution?: string;
  narrativeStyle?: string;
  characterCount?: number;
  voiceId?: string;
  [key: string]: any;
}

/**
 * Settings for character-vlog mode
 */
export interface VlogSettings {
  duration?: number;
  aspectRatio?: string;
  characterId?: string;
  vlogStyle?: string;
  backgroundType?: string;
  [key: string]: any;
}

/**
 * Settings for social-commerce mode
 */
export interface CommerceSettings {
  duration?: number;
  aspectRatio?: string;
  productName?: string;
  productDescription?: string;
  callToAction?: string;
  [key: string]: any;
}

/**
 * Settings for logo-animation mode
 */
export interface LogoSettings {
  duration?: number;
  aspectRatio?: string;
  logoUrl?: string;
  animationStyle?: string;
  [key: string]: any;
}

/**
 * Settings for podcast mode
 */
export interface PodcastSettings {
  duration?: number;
  aspectRatio?: string;
  hostCount?: number;
  visualStyle?: string;
  [key: string]: any;
}

/**
 * Union type for all campaign settings
 */
export type CampaignSettings = 
  | AmbientCampaignSettings
  | NarrativeSettings
  | VlogSettings
  | CommerceSettings
  | LogoSettings
  | PodcastSettings;

// ═══════════════════════════════════════════════════════════════
// VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Status of a single video generation job
 */
export type VideoGenerationStatus = 
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed';

/**
 * Job for generating one video from one idea
 */
export interface VideoGenerationJob {
  campaignId: string;
  itemIndex: number;
  idea: string;
  videoMode: VideoMode;
  campaignSettings: CampaignSettings;
  userId: string;
  workspaceId: string;
}

/**
 * Options for generation (retry support)
 */
export interface GenerationOptions {
  isRetry?: boolean;
  failedStep?: number;
}

/**
 * Result of a single video generation
 */
export interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  cdnUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  retryable?: boolean;  // True if generation can be retried
  failedStep?: number;  // Step number where generation failed
  metadata?: {
    duration?: number;
    resolution?: string;
    fileSize?: number;
    title?: string;
    mode?: string;
    currentStep?: number;
    totalCost?: number;
    [key: string]: any;
  };
}

/**
 * Item status stored in campaign.itemStatuses
 */
export interface ItemStatus {
  status: VideoGenerationStatus;
  videoId?: string;
  error?: string;
  failedStep?: number;  // Step where generation failed (for retries)
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

// ═══════════════════════════════════════════════════════════════
// BATCH PROCESSING
// ═══════════════════════════════════════════════════════════════

/**
 * Current item being generated
 */
export interface CurrentItemProgress {
  index: number;
  topic: string;
  stage: string;
  progress: number;
}

/**
 * Overall progress of a campaign batch
 */
export interface BatchGenerationProgress {
  campaignId: string;
  status: string; // Campaign status: 'draft', 'generating', 'review', 'completed', etc.
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
  startedAt?: Date;
  completedAt?: Date;
  itemStatuses: Record<string, ItemStatus>;
  currentItem?: CurrentItemProgress;  // Details about current video being generated
}

/**
 * Options for batch processing
 */
export interface BatchProcessingOptions {
  parallel?: boolean;
  maxConcurrent?: number;
  retryFailed?: boolean;
  onProgress?: (progress: BatchGenerationProgress) => void;
}

// ═══════════════════════════════════════════════════════════════
// SCHEDULING
// ═══════════════════════════════════════════════════════════════

/**
 * Schedule for a single video item
 */
export interface ItemSchedule {
  scheduledDate?: Date;
  publishedDate?: Date;
  platform?: string;
  publishStatus?: 'scheduled' | 'published' | 'failed';
}

/**
 * Scheduling mode for campaigns
 */
export type SchedulingMode = 'manual' | 'continuous' | 'custom';

/**
 * Options for continuous scheduling
 */
export interface ContinuousScheduleOptions {
  startDate: Date;
  videosPerDay: number;
  preferredHours?: number[];
  skipWeekends?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// PUBLISHING (Step 8)
// ═══════════════════════════════════════════════════════════════

/**
 * Platform-specific publish status
 */
export interface PlatformPublishStatus {
  platform: 'youtube' | 'tiktok' | 'instagram' | 'facebook';
  status: 'pending' | 'published' | 'failed';
  publishedUrl?: string;
  error?: string;
}

/**
 * Step 8 Data - Publish Phase
 * 
 * Contains:
 * - Late.dev post ID for tracking
 * - Publish status per platform
 * - Generated AI metadata
 * - Schedule information
 */
export interface Step8Data {
  postId?: string;         // Late.dev post ID
  status: 'pending' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'partial';
  platforms: PlatformPublishStatus[];
  metadata?: {
    youtube?: {
      title: string;
      description: string;
      tags?: string[];
    };
    tiktok?: {
      caption: string;
      hashtags?: string[];
    };
    instagram?: {
      caption: string;
      hashtags?: string[];
    };
    facebook?: {
      caption: string;
      hashtags?: string[];
    };
  };
  scheduledFor?: string;   // ISO date string
  publishedAt?: Date;
  error?: string;
}

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════

export type { VideoCampaign } from '@shared/schema';
