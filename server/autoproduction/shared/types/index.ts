/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SHARED TYPES
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Types shared across auto-video and auto-story campaigns
 */

// Campaign item status
export type ItemStatus = 'pending' | 'generating' | 'completed' | 'failed';

// Item status entry (stored in itemStatuses JSONB)
export interface ItemStatusEntry {
  status: ItemStatus;
  videoId?: string;
  storyId?: string;
  error?: string;
}

// Video idea entry (from videoIdeas JSONB)
export interface VideoIdea {
  idea: string;
  index: number;
}

// Story topic entry (from storyTopics JSONB)
export interface StoryTopic {
  topic: string;
  index: number;
}

// Item schedule entry (from itemSchedules JSONB)
export interface ItemScheduleEntry {
  scheduledDate?: string;
  publishedDate?: string;
}

// Generation stages
export type GenerationStage = 
  | 'script' 
  | 'scenes' 
  | 'visuals' 
  | 'audio' 
  | 'composing';

// Batch progress tracking
export interface BatchProgress {
  campaignId: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
  currentIndex?: number;
  currentTopic?: string;
  currentStage?: GenerationStage;
  currentProgress?: number;
}
