import type { VideoCampaign, StoryCampaign } from "@shared/schema";

// Campaign types
export type CampaignType = 'auto-video' | 'auto-story';

export type CampaignStatus = 
  | 'draft' 
  | 'generating' 
  | 'paused'
  | 'review' 
  | 'completed' 
  | 'cancelled';

export type AutomationMode = 'manual' | 'auto';

// Item status (stored in itemStatuses JSONB)
export type ItemStatus =
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed';

// Generation stages
export type GenerationStage = 
  | 'script' 
  | 'scenes' 
  | 'visuals' 
  | 'audio' 
  | 'composing';

// Re-export schema types
export type { VideoCampaign, StoryCampaign };

// Alias for backward compatibility
export type ProductionCampaign = VideoCampaign | StoryCampaign;

// Item status entry (from itemStatuses JSONB)
export interface ItemStatusEntry {
  status: ItemStatus;
  videoId?: string;
  storyId?: string;
  error?: string;
}

// Item schedule entry (from itemSchedules JSONB)
export interface ItemScheduleEntry {
  scheduledDate?: string;
  publishedDate?: string;
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

// Extended types with computed fields
export interface VideoCampaignWithProgress extends VideoCampaign {
  progress: number; // 0-100
  totalItems: number;
  completedItems: number;
  failedItems: number;
}

export interface StoryCampaignWithProgress extends StoryCampaign {
  progress: number; // 0-100
  totalItems: number;
  completedItems: number;
  failedItems: number;
}

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

// Campaign item (individual video or story in a campaign)
export interface CampaignItem {
  id: string;
  sourceIdea: string; // Original topic/idea from campaign
  title?: string;
  status: ItemStatus | 'approved' | 'rejected';
  orderIndex: number;
  previewUrl?: string;
  generationProgress?: number; // 0-100
  error?: string;
}

// Helper function to calculate progress from itemStatuses
export function calculateProgress(itemStatuses: Record<string, ItemStatusEntry>): {
  progress: number;
  totalItems: number;
  completedItems: number;
  failedItems: number;
} {
  const statuses = Object.values(itemStatuses);
  const totalItems = statuses.length;
  const completedItems = statuses.filter(s => s.status === 'completed').length;
  const failedItems = statuses.filter(s => s.status === 'failed').length;
  
  const progress = totalItems > 0 
    ? Math.round((completedItems / totalItems) * 100) 
    : 0;
  
  return { progress, totalItems, completedItems, failedItems };
}
