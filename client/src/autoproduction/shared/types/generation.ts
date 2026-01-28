import type { GenerationStage, ItemStatus } from './campaign';

// Progress tracking for batch generation
export interface BatchProgress {
  batchId?: string;
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  pending: number;
  currentItem?: CurrentItemProgress;
  items: ItemProgress[];
}

// Current item being generated
export interface CurrentItemProgress {
  index: number;
  topic: string;
  stage: GenerationStage;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
}

// Individual item progress
export interface ItemProgress {
  index: number;
  topic: string;
  status: ItemStatus;
  progress?: number;
  duration?: number; // seconds taken
  error?: string;
}

// Generation job info
export interface GenerationJob {
  jobId: string;
  campaignId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  estimatedTime?: number; // seconds
  startedAt?: Date;
  completedAt?: Date;
}

// Real-time progress update
export interface ProgressUpdate {
  campaignId: string;
  itemIndex: number;
  stage: GenerationStage;
  progress: number;
  message?: string;
}
