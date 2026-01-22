import type { ProductionCampaign, CampaignItem } from "@shared/schema";

// Campaign types
export type CampaignType = 'auto-video' | 'auto-story';

export type CampaignStatus = 
  | 'draft' 
  | 'generating' 
  | 'review' 
  | 'in_progress' 
  | 'paused' 
  | 'completed' 
  | 'cancelled';

export type AutomationMode = 'manual' | 'auto';

// Item/Story/Video status
export type ItemStatus =
  | 'pending'
  | 'generating'
  | 'generated'
  | 'review_required'
  | 'approved'
  | 'rejected'
  | 'in_production'
  | 'rendering'
  | 'completed'
  | 'failed'
  | 'cancelled';

// Generation stages
export type GenerationStage = 
  | 'script' 
  | 'scenes' 
  | 'visuals' 
  | 'audio' 
  | 'composing';

// Re-export schema types
export type { ProductionCampaign, CampaignItem };

// Extended types with computed fields
export interface CampaignWithProgress extends ProductionCampaign {
  progress: number; // 0-100
  currentItem?: CampaignItem;
  nextPublish?: Date;
}

export interface CampaignItemWithDetails extends CampaignItem {
  campaign?: ProductionCampaign;
}
