/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AUTO-STORY TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Type definitions for auto-story campaign generation.
 * Mirrors the auto-video types pattern for consistency.
 */

import type { StoryCampaign } from '@shared/schema';

// ═══════════════════════════════════════════════════════════════
// STORY TEMPLATES
// ═══════════════════════════════════════════════════════════════

export type StoryTemplate = 
  | 'problem-solution'
  | 'tease-reveal'
  | 'before-after'
  | 'myth-busting'
  | 'auto-asmr';

export type TemplateType = 'narrative' | 'auto-asmr';

// Template structure definition
export interface TemplateStructure {
  id: StoryTemplate;
  name: string;
  stages: string[];
  minScenes: number;
  maxScenes: number;
  optimalSceneCount: number;
}

// ═══════════════════════════════════════════════════════════════
// CAMPAIGN SETTINGS (from frontend wizard)
// ═══════════════════════════════════════════════════════════════

/**
 * Settings passed from the frontend wizard via campaignSettings JSONB.
 * These are extracted from the campaign record and passed to the orchestrator.
 */
export interface StoryCampaignSettings {
  // Content
  template: StoryTemplate;
  templateType: TemplateType;
  
  // Technical
  duration: number;
  aspectRatio: string;
  language: string;
  pacing?: 'slow' | 'medium' | 'fast';
  
  // Text Overlay
  textOverlayEnabled?: boolean;
  textOverlayStyle?: string;
  
  // Visual
  imageStyle: string;
  imageModel: string;
  imageResolution?: string;
  videoModel?: string;
  videoResolution?: string;
  mediaType: 'static' | 'animated';
  transitionStyle?: string;
  
  // References
  styleReferenceUrl?: string;
  characterReferenceUrl?: string;
  
  // Audio
  hasVoiceover: boolean;
  voiceId?: string;
  voiceVolume: number;
  backgroundMusic?: string;
  musicVolume: number;
  
  // Publishing
  publishing?: {
    enabled: boolean;
    platforms: string[];
    scheduleMode: 'immediate' | 'scheduled' | 'continuous';
    scheduledFor?: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// STORY GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Status of a single story generation job
 */
export type StoryGenerationStatus = 
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed';

/**
 * Cached intermediate results from a previous failed attempt.
 * Used to resume from the last successful step instead of restarting.
 */
export interface IntermediateData {
  completedStep: number;
  storyScript?: string;
  scenes?: any[];
  generatedMusicUrl?: string;
  totalCost?: number;
  workspaceName?: string;
  projectName?: string;
}

/**
 * Options for generation (retry support)
 */
export interface StoryGenerationOptions {
  isRetry?: boolean;
  failedStep?: number;
  intermediateData?: IntermediateData;
}

/**
 * Result of a single story generation (returned by orchestrator)
 */
export interface StoryGenerationResult {
  success: boolean;
  storyId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  retryable?: boolean;
  failedStep?: number;
  intermediateData?: IntermediateData;
  metadata?: {
    title?: string;
    duration?: number;
    template?: string;
    currentStep?: number;
    totalCost?: number;
    [key: string]: any;
  };
}

/**
 * Item status stored in campaign.itemStatuses
 */
export interface StoryItemStatus {
  status: StoryGenerationStatus;
  storyId?: string;
  error?: string;
  failedStep?: number;
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
  status: string;
  total: number;
  completed: number;
  failed: number;
  pending: number;
  inProgress: number;
  itemStatuses: Record<string, StoryItemStatus>;
  currentItem?: CurrentItemProgress;
}

// ═══════════════════════════════════════════════════════════════
// RE-EXPORTS
// ═══════════════════════════════════════════════════════════════

export type { StoryCampaign } from '@shared/schema';
